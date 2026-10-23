-- GHR-03B owns only durable Bridge delivery state. Atlas retains immutable
-- issuance/policy truth and exposes it to this role through narrow functions.
CREATE TABLE bridge.generic_handoff_delivery (
  handoff_id text PRIMARY KEY CHECK (handoff_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
  idempotency_key text,
  body_sha256 text NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  producer_execution_id text,
  route_main text,
  route_branch text,
  policy_version text,
  handler_version text,
  body_contract_type text,
  body_contract_version text,
  disposition text CHECK (disposition IN ('parsed_only', 'blocked', 'quarantined', 'retry_exhausted')),
  error_class text CHECK (error_class IS NULL OR error_class IN ('invalid_job', 'corrupt_envelope', 'invalid_policy', 'invalid_route', 'receiver_rejected', 'transient_delivery')),
  lease_owner uuid,
  lease_generation integer NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  lease_expires_at timestamptz,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((disposition IS NULL) = (completed_at IS NULL)),
  CHECK ((disposition IS NULL) OR lease_expires_at IS NULL)
);

CREATE OR REPLACE FUNCTION bridge.reject_generic_handoff_delivery_identity_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.handoff_id IS DISTINCT FROM NEW.handoff_id
    OR OLD.idempotency_key IS DISTINCT FROM NEW.idempotency_key
    OR OLD.body_sha256 IS DISTINCT FROM NEW.body_sha256
    OR OLD.producer_execution_id IS DISTINCT FROM NEW.producer_execution_id
    OR OLD.route_main IS DISTINCT FROM NEW.route_main
    OR OLD.route_branch IS DISTINCT FROM NEW.route_branch
    OR OLD.policy_version IS DISTINCT FROM NEW.policy_version
    OR OLD.handler_version IS DISTINCT FROM NEW.handler_version
    OR OLD.body_contract_type IS DISTINCT FROM NEW.body_contract_type
    OR OLD.body_contract_version IS DISTINCT FROM NEW.body_contract_version THEN
    RAISE EXCEPTION 'generic handoff delivery identity is immutable';
  END IF;
  IF OLD.disposition IS NOT NULL AND NEW.disposition IS DISTINCT FROM OLD.disposition THEN
    RAISE EXCEPTION 'generic handoff delivery disposition is terminal';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generic_handoff_delivery_identity_immutable
  BEFORE UPDATE ON bridge.generic_handoff_delivery
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_generic_handoff_delivery_identity_mutation();

-- This predicate exposes only the exact current policy decision the Bridge
-- needs. It never grants table access or an Atlas write capability.
CREATE OR REPLACE FUNCTION atlas.is_generic_handoff_dispatch_policy_active_v1(p_header jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, atlas AS $$
BEGIN
  IF session_user <> 'agents_bridge' OR jsonb_typeof(p_header) <> 'object' THEN
    RAISE EXCEPTION 'generic handoff dispatch policy access denied';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM atlas.generic_handoff_route_policy policy
    WHERE policy.policy_version = p_header #>> '{route,policyVersion}'
      AND policy.handler_version = p_header #>> '{route,handlerVersion}'
      AND policy.producer_process_key = p_header #>> '{producer,processKey}'
      AND policy.producer_event = 'NormalizedDocumentAccepted/v1'
      AND policy.route_main = p_header #>> '{route,main}'
      AND policy.route_branch = p_header #>> '{route,branch}'
      AND policy.body_contract_type = p_header #>> '{bodyContract,type}'
      AND policy.body_contract_version = p_header #>> '{bodyContract,version}'
      AND policy.can_continue = false AND policy.enabled = true AND policy.revoked_at IS NULL
  );
END;
$$;

ALTER TABLE bridge.generic_handoff_delivery OWNER TO agents_bridge;
ALTER FUNCTION bridge.reject_generic_handoff_delivery_identity_mutation() OWNER TO agents_bridge;
ALTER FUNCTION atlas.is_generic_handoff_dispatch_policy_active_v1(jsonb) OWNER TO atlas_app;
REVOKE ALL ON TABLE bridge.generic_handoff_delivery FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.reject_generic_handoff_delivery_identity_mutation() FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION atlas.is_generic_handoff_dispatch_policy_active_v1(jsonb) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION atlas.is_generic_handoff_dispatch_policy_active_v1(jsonb) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0105_ghr03b_bridge_delivery') ON CONFLICT DO NOTHING;
