-- Existing upgraded databases may already have the pre-final 0055 consumer.
-- Preserve that proven claim/revalidation implementation, then converge its
-- completed activation to the ticket-required debt-free fairness epoch.
ALTER FUNCTION bridge.consume_active_plan_wakeup(text,text)
  RENAME TO consume_active_plan_wakeup_pre_fairness_convergence;

CREATE FUNCTION bridge.consume_active_plan_wakeup(
  p_quota_domain_id text, p_wakeup_key text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb; active record;
BEGIN
  result := bridge.consume_active_plan_wakeup_pre_fairness_convergence(p_quota_domain_id,p_wakeup_key);
  IF COALESCE((result->>'claimed')::boolean,false) AND NOT COALESCE((result->>'staleActivation')::boolean,false) THEN
    SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
    IF FOUND THEN
      INSERT INTO bridge.provider_admission_domain_state(quota_domain_id,fairness_epoch,virtual_time,next_turn)
        VALUES (p_quota_domain_id,active.desired_profile_version||':'||active.activation_revision,0,1)
      ON CONFLICT(quota_domain_id) DO UPDATE SET
        fairness_epoch=EXCLUDED.fairness_epoch,
        virtual_time=0,
        next_turn=1;
    END IF;
  END IF;
  RETURN result;
END;
$$;

ALTER FUNCTION bridge.consume_active_plan_wakeup_pre_fairness_convergence(text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.consume_active_plan_wakeup(text,text) OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.consume_active_plan_wakeup_pre_fairness_convergence(text,text),bridge.consume_active_plan_wakeup(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.consume_active_plan_wakeup(text,text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0062_bssv200603a_wakeup_fairness_convergence') ON CONFLICT DO NOTHING;
