-- BSS-V2-005-04: immutable, Bridge-owned desired admission plan publication.
CREATE TABLE IF NOT EXISTS bridge.desired_admission_profile (
  quota_domain_id text NOT NULL CHECK (length(trim(quota_domain_id)) > 0),
  profile_version text NOT NULL CHECK (length(trim(profile_version)) > 0),
  provider_capacity_profile_version text NOT NULL CHECK (length(trim(provider_capacity_profile_version)) > 0),
  planner_version text NOT NULL CHECK (length(trim(planner_version)) > 0),
  effective_from timestamptz NOT NULL,
  profile jsonb NOT NULL CHECK (jsonb_typeof(profile) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, profile_version),
  FOREIGN KEY (quota_domain_id, provider_capacity_profile_version)
    REFERENCES bridge.provider_capacity_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT
);

-- Every process/workload version consumed by the planner is retained with the
-- published output; readers never have to infer a mutable "current" input.
CREATE TABLE IF NOT EXISTS bridge.desired_admission_profile_input (
  quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL,
  process_id text NOT NULL,
  process_profile_version text NOT NULL,
  workload_id text NOT NULL,
  workload_profile_version text NOT NULL,
  PRIMARY KEY (quota_domain_id, desired_profile_version, process_id, process_profile_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT,
  FOREIGN KEY (process_id, process_profile_version)
    REFERENCES bridge.provider_process_profile (process_id, profile_version)
    ON DELETE RESTRICT,
  FOREIGN KEY (workload_id, workload_profile_version)
    REFERENCES bridge.workload_envelope_profile (workload_id, profile_version)
    ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.validate_desired_admission_profile_input() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  referenced_workload_id text;
  referenced_workload_version text;
BEGIN
  SELECT workload_id, workload_profile_version
    INTO referenced_workload_id, referenced_workload_version
    FROM bridge.provider_process_profile
    WHERE process_id = NEW.process_id AND profile_version = NEW.process_profile_version;
  IF NOT FOUND OR referenced_workload_id <> NEW.workload_id OR referenced_workload_version <> NEW.workload_profile_version THEN
    RAISE EXCEPTION 'desired admission input must bind the process profile''s exact workload version';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS desired_admission_profile_input_valid ON bridge.desired_admission_profile_input;
CREATE TRIGGER desired_admission_profile_input_valid BEFORE INSERT OR UPDATE ON bridge.desired_admission_profile_input
  FOR EACH ROW EXECUTE FUNCTION bridge.validate_desired_admission_profile_input();

CREATE OR REPLACE FUNCTION bridge.reject_desired_admission_profile_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'bridge desired admission profiles and inputs are immutable; publish a new profile_version';
END;
$$;

DROP TRIGGER IF EXISTS desired_admission_profile_immutable ON bridge.desired_admission_profile;
CREATE TRIGGER desired_admission_profile_immutable BEFORE UPDATE OR DELETE ON bridge.desired_admission_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_desired_admission_profile_mutation();
DROP TRIGGER IF EXISTS desired_admission_profile_input_immutable ON bridge.desired_admission_profile_input;
CREATE TRIGGER desired_admission_profile_input_immutable BEFORE UPDATE OR DELETE ON bridge.desired_admission_profile_input
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_desired_admission_profile_mutation();

-- The active pointer is the only mutable operational state.  Its matching
-- append-only activation row is the transaction-capable change seam for 006.
CREATE TABLE IF NOT EXISTS bridge.active_desired_admission_profile (
  quota_domain_id text PRIMARY KEY,
  desired_profile_version text NOT NULL,
  activation_revision bigint NOT NULL CHECK (activation_revision > 0),
  effective_from timestamptz NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bridge.desired_admission_profile_activation (
  quota_domain_id text NOT NULL,
  activation_revision bigint NOT NULL CHECK (activation_revision > 0),
  desired_profile_version text NOT NULL,
  effective_from timestamptz NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quota_domain_id, activation_revision),
  UNIQUE (quota_domain_id, desired_profile_version),
  FOREIGN KEY (quota_domain_id, desired_profile_version)
    REFERENCES bridge.desired_admission_profile (quota_domain_id, profile_version)
    ON DELETE RESTRICT
);

DROP TRIGGER IF EXISTS desired_admission_profile_activation_immutable ON bridge.desired_admission_profile_activation;
CREATE TRIGGER desired_admission_profile_activation_immutable BEFORE UPDATE OR DELETE ON bridge.desired_admission_profile_activation
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_desired_admission_profile_mutation();

CREATE OR REPLACE FUNCTION bridge.activate_desired_admission_profile(
  p_quota_domain_id text,
  p_desired_profile_version text
) RETURNS TABLE (quota_domain_id text, desired_profile_version text, activation_revision bigint, effective_from timestamptz) LANGUAGE plpgsql AS $$
DECLARE
  profile_effective_from timestamptz;
  next_revision bigint;
BEGIN
  -- Serialize activation per domain, including its history and active pointer.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_quota_domain_id, 0));
  SELECT profile.effective_from INTO profile_effective_from
    FROM bridge.desired_admission_profile profile
    WHERE profile.quota_domain_id = p_quota_domain_id AND profile.profile_version = p_desired_profile_version
    FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'desired admission profile %:% is missing', p_quota_domain_id, p_desired_profile_version; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM bridge.desired_admission_profile_input i
    JOIN bridge.provider_process_profile p ON (p.process_id, p.profile_version) = (i.process_id, i.process_profile_version)
    JOIN bridge.workload_envelope_profile w ON (w.workload_id, w.profile_version) = (i.workload_id, i.workload_profile_version)
    WHERE i.quota_domain_id = p_quota_domain_id AND i.desired_profile_version = p_desired_profile_version
  ) THEN RAISE EXCEPTION 'desired admission profile %:% has no valid version-bound process/workload inputs', p_quota_domain_id, p_desired_profile_version; END IF;
  IF EXISTS (SELECT 1 FROM bridge.desired_admission_profile_activation activation WHERE activation.quota_domain_id = p_quota_domain_id AND activation.desired_profile_version = p_desired_profile_version) THEN
    RAISE EXCEPTION 'desired admission profile %:% was already activated', p_quota_domain_id, p_desired_profile_version;
  END IF;
  SELECT COALESCE(max(activation.activation_revision), 0) + 1 INTO next_revision
    FROM bridge.desired_admission_profile_activation activation WHERE activation.quota_domain_id = p_quota_domain_id;
  INSERT INTO bridge.desired_admission_profile_activation (quota_domain_id, activation_revision, desired_profile_version, effective_from)
    VALUES (p_quota_domain_id, next_revision, p_desired_profile_version, profile_effective_from);
  INSERT INTO bridge.active_desired_admission_profile (quota_domain_id, desired_profile_version, activation_revision, effective_from)
    VALUES (p_quota_domain_id, p_desired_profile_version, next_revision, profile_effective_from)
    ON CONFLICT ON CONSTRAINT active_desired_admission_profile_pkey DO UPDATE SET desired_profile_version = EXCLUDED.desired_profile_version,
      activation_revision = EXCLUDED.activation_revision, effective_from = EXCLUDED.effective_from, activated_at = now();
  RETURN QUERY SELECT p_quota_domain_id, p_desired_profile_version, next_revision, profile_effective_from;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.resolve_active_desired_admission_profile(p_quota_domain_id text)
RETURNS TABLE (quota_domain_id text, desired_profile_version text, activation_revision bigint, effective_from timestamptz, provider_capacity_profile_version text, planner_version text, profile jsonb) LANGUAGE sql STABLE AS $$
  SELECT active.quota_domain_id, active.desired_profile_version, active.activation_revision, active.effective_from,
    profile.provider_capacity_profile_version, profile.planner_version, profile.profile
  FROM bridge.active_desired_admission_profile active
  JOIN bridge.desired_admission_profile profile
    ON (profile.quota_domain_id, profile.profile_version) = (active.quota_domain_id, active.desired_profile_version)
  WHERE active.quota_domain_id = p_quota_domain_id;
$$;

ALTER TABLE bridge.desired_admission_profile OWNER TO agents_bridge;
ALTER TABLE bridge.desired_admission_profile_input OWNER TO agents_bridge;
ALTER TABLE bridge.active_desired_admission_profile OWNER TO agents_bridge;
ALTER TABLE bridge.desired_admission_profile_activation OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.desired_admission_profile, bridge.desired_admission_profile_input,
  bridge.active_desired_admission_profile, bridge.desired_admission_profile_activation FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.activate_desired_admission_profile(text, text), bridge.resolve_active_desired_admission_profile(text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION bridge.activate_desired_admission_profile(text, text), bridge.resolve_active_desired_admission_profile(text) TO agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0029_bssv200504_desired_admission_profile_publication') ON CONFLICT DO NOTHING;
