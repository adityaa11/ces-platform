-- A newly published structural ceiling may make a waiting immutable envelope
-- impossible. It becomes an explicit owner replan request, never a spinning retry.
CREATE TABLE bridge.provider_work_replan_request (
  logical_work_id text NOT NULL, attempt_number integer NOT NULL, quota_domain_id text NOT NULL,
  desired_profile_version text NOT NULL, activation_revision bigint NOT NULL, reason text NOT NULL DEFAULT 'structurally_unfit_after_plan_change',
  requested_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(logical_work_id,attempt_number),
  FOREIGN KEY(logical_work_id,attempt_number) REFERENCES bridge.provider_work_attempt(logical_work_id,attempt_number) ON DELETE RESTRICT
);
CREATE OR REPLACE FUNCTION bridge.rebase_provider_work_on_plan_activation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE epoch text; plan jsonb;
BEGIN
  SELECT profile INTO plan FROM bridge.desired_admission_profile WHERE quota_domain_id=NEW.quota_domain_id AND profile_version=NEW.desired_profile_version;
  IF plan IS NULL OR jsonb_typeof(plan->'usableGlobalCapacity')<>'object' THEN RAISE EXCEPTION 'active desired profile lacks usable global capacity'; END IF;
  INSERT INTO bridge.provider_work_replan_request(logical_work_id,attempt_number,quota_domain_id,desired_profile_version,activation_revision)
    SELECT w.logical_work_id,w.attempt_number,w.quota_domain_id,NEW.desired_profile_version,NEW.activation_revision FROM bridge.provider_work_attempt w
    WHERE w.quota_domain_id=NEW.quota_domain_id AND w.state='waiting' AND NOT bridge.admission_vector_fits(jsonb_build_object('rpm',0,'tpm',0,'rpd',0,'concurrency',0),w.request_resource_envelope,plan->'usableGlobalCapacity')
    ON CONFLICT(logical_work_id,attempt_number) DO NOTHING;
  UPDATE bridge.provider_work_attempt w SET state='terminal',terminal_reason='structurally_unfit_after_plan_change',state_version=state_version+1,updated_at=now()
    WHERE w.quota_domain_id=NEW.quota_domain_id AND w.state='waiting' AND NOT bridge.admission_vector_fits(jsonb_build_object('rpm',0,'tpm',0,'rpd',0,'concurrency',0),w.request_resource_envelope,plan->'usableGlobalCapacity');
  UPDATE bridge.provider_work_attempt SET desired_profile_version=NEW.desired_profile_version,activation_revision=NEW.activation_revision,state_version=state_version+1,updated_at=now() WHERE quota_domain_id=NEW.quota_domain_id AND state='waiting';
  epoch:=NEW.desired_profile_version||':'||NEW.activation_revision;
  INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch,virtual_time,next_turn) VALUES(NEW.quota_domain_id,epoch,0,1) ON CONFLICT(quota_domain_id) DO UPDATE SET fairness_epoch=EXCLUDED.fairness_epoch,virtual_time=0,next_turn=1;
  INSERT INTO bridge.provider_work_wakeup_request(quota_domain_id,wakeup_key,requested_for,desired_profile_version,activation_revision) VALUES(NEW.quota_domain_id,'plan:'||NEW.activation_revision,now(),NEW.desired_profile_version,NEW.activation_revision) ON CONFLICT(quota_domain_id,wakeup_key) DO NOTHING;
  RETURN NEW;
END;
$$;
ALTER TABLE bridge.provider_work_replan_request OWNER TO agents_bridge;
ALTER FUNCTION bridge.rebase_provider_work_on_plan_activation() OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_work_replan_request FROM PUBLIC,atlas_app;
INSERT INTO atlas.schema_migrations(name) VALUES('0040_bssv200603_structural_replan_request') ON CONFLICT DO NOTHING;
