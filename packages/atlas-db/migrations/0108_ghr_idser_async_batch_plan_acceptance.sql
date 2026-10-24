-- The v2 transition is append-only: v1/false handoffs remain immutable and
-- never become planning-authorized merely because a newer receiver exists.
ALTER TABLE atlas.generic_handoff_route_policy
  DROP CONSTRAINT IF EXISTS generic_handoff_route_policy_can_continue_check,
  DROP CONSTRAINT IF EXISTS generic_handoff_route_policy_policy_version_check,
  DROP CONSTRAINT IF EXISTS generic_handoff_route_policy_handler_version_check;
ALTER TABLE atlas.generic_handoff_route_policy
  ADD CONSTRAINT generic_handoff_route_policy_planning_transition_check CHECK (
    (policy_version='v1' AND handler_version='v1' AND can_continue=false)
    OR (policy_version='v2' AND handler_version='v2' AND can_continue=true)
  );

ALTER TABLE atlas.generic_handoff_intent
  DROP CONSTRAINT IF EXISTS generic_handoff_intent_can_continue_check,
  DROP CONSTRAINT IF EXISTS generic_handoff_intent_policy_version_handler_version_check;
ALTER TABLE atlas.generic_handoff_intent
  ADD CONSTRAINT generic_handoff_intent_planning_transition_check CHECK (
    (policy_version='v1' AND handler_version='v1' AND can_continue=false)
    OR (policy_version='v2' AND handler_version='v2' AND can_continue=true)
  );

INSERT INTO atlas.generic_handoff_route_policy (
  policy_version, producer_process_key, producer_event, route_main, route_branch,
  handler_version, body_contract_type, body_contract_version, can_continue, enabled
) VALUES ('v2','perception.acceptance','NormalizedDocumentAccepted/v1','semantic','batch-plan','v2','SemanticBatchPlanInput','v1',true,true)
ON CONFLICT DO NOTHING;

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
      AND policy.can_continue = true AND policy.enabled = true AND policy.revoked_at IS NULL
  );
END;
$$;

ALTER TABLE bridge.generic_handoff_delivery DROP CONSTRAINT IF EXISTS generic_handoff_delivery_disposition_check;
ALTER TABLE bridge.generic_handoff_delivery ADD CONSTRAINT generic_handoff_delivery_disposition_check
  CHECK (disposition IN ('accepted','parsed_only','blocked','quarantined','retry_exhausted'));

SELECT pgboss.create_queue('bridge-semantic-batch-plan-v1', '{"policy":"short","retryLimit":8,"retryDelay":5,"retryBackoff":true,"expireInSeconds":300}'::jsonb);

CREATE TABLE bridge.semantic_batch_plan_job (
  handoff_id text PRIMARY KEY CHECK (handoff_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
  body_sha256 text NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  canonical_input text NOT NULL CHECK (octet_length(canonical_input) BETWEEN 1 AND 2048),
  trusted_scope jsonb NOT NULL CHECK (jsonb_typeof(trusted_scope)='object'),
  queue_job_id uuid NOT NULL UNIQUE,
  state text NOT NULL CHECK (state IN ('PENDING','RUNNING','READY','REPLAN','BLOCKED','NO_ELIGIBLE_SOURCE')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  outcome jsonb,
  accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  CHECK ((state IN ('PENDING','RUNNING')) = (outcome IS NULL)),
  CHECK ((state IN ('READY','REPLAN','BLOCKED','NO_ELIGIBLE_SOURCE')) = (completed_at IS NOT NULL))
);

CREATE OR REPLACE FUNCTION bridge.accept_semantic_batch_plan(
  p_handoff_id text, p_body_sha256 text, p_canonical_input text, p_trusted_scope jsonb
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE existing bridge.semantic_batch_plan_job; queued uuid;
BEGIN
  IF p_handoff_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$' OR p_body_sha256 !~ '^[a-f0-9]{64}$'
    OR octet_length(p_canonical_input) NOT BETWEEN 1 AND 2048 OR jsonb_typeof(p_trusted_scope) <> 'object' THEN
    RAISE EXCEPTION 'semantic batch-plan acceptance input is invalid';
  END IF;
  SELECT * INTO existing FROM bridge.semantic_batch_plan_job WHERE handoff_id=p_handoff_id FOR UPDATE;
  IF FOUND THEN
    IF existing.body_sha256 <> p_body_sha256 OR existing.canonical_input <> p_canonical_input OR existing.trusted_scope <> p_trusted_scope THEN
      RAISE EXCEPTION 'handoffId is already bound to a different immutable planning handoff';
    END IF;
    RETURN false;
  END IF;
  INSERT INTO pgboss.job(name,data,policy,singleton_key)
    VALUES ('bridge-semantic-batch-plan-v1', jsonb_build_object('handoffId',p_handoff_id), 'short', p_handoff_id)
    RETURNING id INTO queued;
  INSERT INTO bridge.semantic_batch_plan_job(handoff_id,body_sha256,canonical_input,trusted_scope,queue_job_id,state)
    VALUES (p_handoff_id,p_body_sha256,p_canonical_input,p_trusted_scope,queued,'PENDING');
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.claim_semantic_batch_plan(p_handoff_id text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE job bridge.semantic_batch_plan_job;
BEGIN
  UPDATE bridge.semantic_batch_plan_job SET state='RUNNING', attempt_count=attempt_count+1, started_at=clock_timestamp()
    WHERE handoff_id=p_handoff_id AND state IN ('PENDING','RUNNING')
    RETURNING * INTO job;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('canonicalInput',job.canonical_input,'trustedScope',job.trusted_scope);
END;
$$;

CREATE OR REPLACE FUNCTION bridge.complete_semantic_batch_plan(p_handoff_id text, p_state text, p_outcome jsonb)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_state NOT IN ('READY','REPLAN','BLOCKED','NO_ELIGIBLE_SOURCE') OR jsonb_typeof(p_outcome) <> 'object' OR p_outcome->>'disposition' <> p_state THEN
    RAISE EXCEPTION 'semantic batch-plan outcome is invalid';
  END IF;
  UPDATE bridge.semantic_batch_plan_job SET state=p_state, outcome=p_outcome, completed_at=clock_timestamp()
    WHERE handoff_id=p_handoff_id AND state IN ('PENDING','RUNNING');
  RETURN FOUND;
END;
$$;

ALTER TABLE bridge.semantic_batch_plan_job OWNER TO agents_bridge;
ALTER FUNCTION bridge.accept_semantic_batch_plan(text,text,text,jsonb) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_semantic_batch_plan(text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.complete_semantic_batch_plan(text,text,jsonb) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.semantic_batch_plan_job FROM PUBLIC, atlas_app;
REVOKE ALL ON FUNCTION bridge.accept_semantic_batch_plan(text,text,text,jsonb), bridge.claim_semantic_batch_plan(text), bridge.complete_semantic_batch_plan(text,text,jsonb) FROM PUBLIC, atlas_app;

INSERT INTO atlas.schema_migrations(name) VALUES('0108_ghr_idser_async_batch_plan_acceptance') ON CONFLICT DO NOTHING;
