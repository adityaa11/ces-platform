-- BSS-V2-006-03A: bridge the predecessor's durable wakeup intent to one
-- pg-boss delivery.  The dispatch row is the replay fence: more requests can
-- move an unclaimed delivery earlier but cannot mint a second effective wakeup.

-- Activation is a database transaction and may legitimately happen before a
-- Bridge worker has started. Materialize the same queue identity here so the
-- activation transaction never depends on worker-start ordering; the worker
-- still owns its runtime options and consumer registration.
SELECT pgboss.create_queue('bridge-provider-work-wakeup-v1',
  '{"policy":"short","retryLimit":2,"expireInSeconds":900}'::jsonb);

CREATE TABLE IF NOT EXISTS bridge.provider_work_wakeup_dispatch (
  quota_domain_id text NOT NULL,
  wakeup_key text NOT NULL,
  job_id uuid NOT NULL UNIQUE,
  claimed_at timestamptz,
  claimed_desired_profile_version text,
  claimed_activation_revision bigint,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (quota_domain_id, wakeup_key),
  FOREIGN KEY (quota_domain_id, wakeup_key)
    REFERENCES bridge.provider_work_wakeup_request(quota_domain_id, wakeup_key) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bridge.provider_admission_convergence_intent (
  intent_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_kind text NOT NULL CHECK (intent_kind IN ('owner_replan_required','capacity_revision_request')),
  quota_domain_id text NOT NULL,
  logical_work_id text NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  source_desired_profile_version text NOT NULL,
  source_activation_revision bigint NOT NULL,
  active_desired_profile_version text NOT NULL,
  active_activation_revision bigint NOT NULL,
  provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance) = 'object'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (intent_kind, quota_domain_id, logical_work_id, attempt_number, active_desired_profile_version, active_activation_revision),
  FOREIGN KEY (logical_work_id, attempt_number)
    REFERENCES bridge.provider_work_attempt(logical_work_id, attempt_number) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION bridge.reject_provider_admission_convergence_intent_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'provider admission convergence intents are immutable';
END;
$$;

DROP TRIGGER IF EXISTS provider_admission_convergence_intent_immutable ON bridge.provider_admission_convergence_intent;
CREATE TRIGGER provider_admission_convergence_intent_immutable
  BEFORE UPDATE OR DELETE ON bridge.provider_admission_convergence_intent
  FOR EACH ROW EXECUTE FUNCTION bridge.reject_provider_admission_convergence_intent_mutation();

CREATE OR REPLACE FUNCTION bridge.request_provider_work_wakeup(
  p_quota_domain_id text, p_wakeup_key text, p_requested_for timestamptz,
  p_desired_profile_version text DEFAULT NULL, p_activation_revision bigint DEFAULT NULL
) RETURNS bridge.provider_work_wakeup_request LANGUAGE plpgsql AS $$
DECLARE active record; wakeup bridge.provider_work_wakeup_request; dispatch bridge.provider_work_wakeup_dispatch; job_id uuid;
BEGIN
  -- Preserve the 006-01 revision fence: a durable delivery cannot make an
  -- old or invented plan revision look active merely by enqueueing it.
  IF (p_desired_profile_version IS NULL) <> (p_activation_revision IS NULL) THEN
    RAISE EXCEPTION 'plan revision must be supplied together';
  END IF;
  IF p_desired_profile_version IS NOT NULL THEN
    SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
    IF NOT FOUND OR active.desired_profile_version<>p_desired_profile_version OR active.activation_revision<>p_activation_revision THEN
      RAISE EXCEPTION 'wakeup must reference the active desired admission profile revision';
    END IF;
  END IF;
  INSERT INTO bridge.provider_work_wakeup_request (quota_domain_id,wakeup_key,requested_for,desired_profile_version,activation_revision)
  VALUES (p_quota_domain_id,p_wakeup_key,p_requested_for,p_desired_profile_version,p_activation_revision)
  ON CONFLICT (quota_domain_id,wakeup_key) DO UPDATE SET
    requested_for=LEAST(bridge.provider_work_wakeup_request.requested_for,EXCLUDED.requested_for),
    desired_profile_version=COALESCE(EXCLUDED.desired_profile_version,bridge.provider_work_wakeup_request.desired_profile_version),
    activation_revision=COALESCE(EXCLUDED.activation_revision,bridge.provider_work_wakeup_request.activation_revision),
    updated_at=clock_timestamp()
  RETURNING * INTO wakeup;

  SELECT * INTO dispatch FROM bridge.provider_work_wakeup_dispatch
    WHERE quota_domain_id=wakeup.quota_domain_id AND wakeup_key=wakeup.wakeup_key FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO pgboss.job(name,data,policy,singleton_key,start_after)
    VALUES ('bridge-provider-work-wakeup-v1',jsonb_build_object('quotaDomainId',wakeup.quota_domain_id,'wakeupKey',wakeup.wakeup_key),'short',wakeup.quota_domain_id||':'||wakeup.wakeup_key,wakeup.requested_for)
    RETURNING id INTO job_id;
    INSERT INTO bridge.provider_work_wakeup_dispatch(quota_domain_id,wakeup_key,job_id)
      VALUES(wakeup.quota_domain_id,wakeup.wakeup_key,job_id);
  ELSIF dispatch.claimed_at IS NULL THEN
    UPDATE pgboss.job SET start_after=LEAST(start_after,wakeup.requested_for)
      WHERE id=dispatch.job_id AND name='bridge-provider-work-wakeup-v1' AND state='created';
  END IF;
  RETURN wakeup;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.claim_provider_work_wakeup(
  p_quota_domain_id text, p_wakeup_key text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE wakeup bridge.provider_work_wakeup_request; dispatch bridge.provider_work_wakeup_dispatch;
BEGIN
  SELECT * INTO wakeup FROM bridge.provider_work_wakeup_request
    WHERE quota_domain_id=p_quota_domain_id AND wakeup_key=p_wakeup_key FOR UPDATE;
  IF NOT FOUND OR wakeup.requested_for>clock_timestamp() THEN RETURN NULL; END IF;
  SELECT * INTO dispatch FROM bridge.provider_work_wakeup_dispatch
    WHERE quota_domain_id=p_quota_domain_id AND wakeup_key=p_wakeup_key FOR UPDATE;
  IF NOT FOUND OR dispatch.claimed_at IS NOT NULL THEN RETURN NULL; END IF;
  UPDATE bridge.provider_work_wakeup_dispatch
    SET claimed_at=clock_timestamp(), claimed_desired_profile_version=wakeup.desired_profile_version,
      claimed_activation_revision=wakeup.activation_revision
    WHERE quota_domain_id=p_quota_domain_id AND wakeup_key=p_wakeup_key AND claimed_at IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('quotaDomainId',wakeup.quota_domain_id,'wakeupKey',wakeup.wakeup_key,
    'desiredProfileVersion',wakeup.desired_profile_version,'activationRevision',wakeup.activation_revision);
END;
$$;

-- Activation emits one durable pg-boss delivery per immutable activation
-- revision. The wakeup payload remains an opaque domain/key identity.
CREATE OR REPLACE FUNCTION bridge.enqueue_active_plan_wakeup()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM bridge.request_provider_work_wakeup(
    NEW.quota_domain_id,
    'active-plan:' || NEW.activation_revision::text,
    clock_timestamp(),
    NEW.desired_profile_version,
    NEW.activation_revision
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS desired_admission_profile_activation_wakeup ON bridge.desired_admission_profile_activation;
DROP TRIGGER IF EXISTS active_desired_admission_profile_wakeup ON bridge.active_desired_admission_profile;
CREATE TRIGGER active_desired_admission_profile_wakeup
  AFTER INSERT OR UPDATE OF desired_profile_version, activation_revision ON bridge.active_desired_admission_profile
  FOR EACH ROW EXECUTE FUNCTION bridge.enqueue_active_plan_wakeup();

-- A claimed activation wakeup may touch only waiting work. Reservations and
-- their window liabilities retain their original plan attribution. A request
-- becomes structurally incompatible only when its exact immutable
-- process/workload input no longer belongs to the active plan. Capacity
-- revision requests are narrower still: the old immutable plan fit the exact
-- request envelope and the newly active immutable plan no longer does.
CREATE OR REPLACE FUNCTION bridge.consume_active_plan_wakeup(
  p_quota_domain_id text, p_wakeup_key text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE claimed jsonb; active record; rebased_count integer := 0;
  owner_intents integer := 0; capacity_intents integer := 0;
BEGIN
  claimed := bridge.claim_provider_work_wakeup(p_quota_domain_id, p_wakeup_key);
  IF claimed IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'rebasedWaitingWork', 0, 'ownerReplanIntents', 0, 'capacityRevisionIntents', 0);
  END IF;
  SELECT * INTO active FROM bridge.resolve_active_desired_admission_profile(p_quota_domain_id);
  IF NOT FOUND
     OR active.desired_profile_version <> claimed->>'desiredProfileVersion'
     OR active.activation_revision <> (claimed->>'activationRevision')::bigint THEN
    RETURN jsonb_build_object('claimed', true, 'staleActivation', true, 'rebasedWaitingWork', 0, 'ownerReplanIntents', 0, 'capacityRevisionIntents', 0);
  END IF;

  INSERT INTO bridge.provider_admission_convergence_intent(
    intent_kind, quota_domain_id, logical_work_id, attempt_number,
    source_desired_profile_version, source_activation_revision,
    active_desired_profile_version, active_activation_revision, provenance
  )
  SELECT 'owner_replan_required', work.quota_domain_id, work.logical_work_id, work.attempt_number,
    work.desired_profile_version, work.activation_revision,
    active.desired_profile_version, active.activation_revision,
    jsonb_build_object('reason', 'immutable_process_or_workload_input_not_in_active_plan',
      'sourceDesiredProfileVersion', work.desired_profile_version,
      'sourceActivationRevision', work.activation_revision,
      'activeDesiredProfileVersion', active.desired_profile_version,
      'activeActivationRevision', active.activation_revision,
      'processId', work.process_id, 'processProfileVersion', work.process_profile_version)
  FROM bridge.provider_work_attempt work
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND NOT EXISTS (
      SELECT 1 FROM bridge.desired_admission_profile_input input
      JOIN bridge.provider_process_profile process
        ON (process.process_id, process.profile_version) = (input.process_id, input.process_profile_version)
      WHERE input.quota_domain_id = active.quota_domain_id
        AND input.desired_profile_version = active.desired_profile_version
        AND input.process_id = work.process_id
        AND input.process_profile_version = work.process_profile_version
        AND process.workload_id = input.workload_id
        AND process.workload_profile_version = input.workload_profile_version
    )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS owner_intents = ROW_COUNT;

  INSERT INTO bridge.provider_admission_convergence_intent(
    intent_kind, quota_domain_id, logical_work_id, attempt_number,
    source_desired_profile_version, source_activation_revision,
    active_desired_profile_version, active_activation_revision, provenance
  )
  SELECT 'capacity_revision_request', work.quota_domain_id, work.logical_work_id, work.attempt_number,
    work.desired_profile_version, work.activation_revision,
    active.desired_profile_version, active.activation_revision,
    jsonb_build_object('reason', 'immutable_active_plan_capacity_downgrade',
      'sourceDesiredProfileVersion', work.desired_profile_version,
      'sourceActivationRevision', work.activation_revision,
      'activeDesiredProfileVersion', active.desired_profile_version,
      'activeActivationRevision', active.activation_revision)
  FROM bridge.provider_work_attempt work
  JOIN bridge.desired_admission_profile source_plan
    ON (source_plan.quota_domain_id, source_plan.profile_version) = (work.quota_domain_id, work.desired_profile_version)
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND bridge.admission_vector_fits('{}'::jsonb, work.request_resource_envelope, source_plan.profile->'usableGlobalCapacity')
    AND NOT bridge.admission_vector_fits('{}'::jsonb, work.request_resource_envelope, active.profile->'usableGlobalCapacity')
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS capacity_intents = ROW_COUNT;

  UPDATE bridge.provider_work_attempt work
    SET desired_profile_version = active.desired_profile_version,
        activation_revision = active.activation_revision,
        state_version = work.state_version + 1,
        updated_at = clock_timestamp()
  WHERE work.quota_domain_id = p_quota_domain_id AND work.state = 'waiting'
    AND (work.desired_profile_version <> active.desired_profile_version OR work.activation_revision <> active.activation_revision)
    AND EXISTS (
      SELECT 1 FROM bridge.desired_admission_profile_input input
      JOIN bridge.provider_process_profile process
        ON (process.process_id, process.profile_version) = (input.process_id, input.process_profile_version)
      WHERE input.quota_domain_id = active.quota_domain_id
        AND input.desired_profile_version = active.desired_profile_version
        AND input.process_id = work.process_id
        AND input.process_profile_version = work.process_profile_version
        AND process.workload_id = input.workload_id
        AND process.workload_profile_version = input.workload_profile_version
    );
  GET DIAGNOSTICS rebased_count = ROW_COUNT;
  RETURN jsonb_build_object('claimed', true, 'staleActivation', false,
    'rebasedWaitingWork', rebased_count, 'ownerReplanIntents', owner_intents,
    'capacityRevisionIntents', capacity_intents);
END;
$$;

ALTER TABLE bridge.provider_work_wakeup_dispatch OWNER TO agents_bridge;
ALTER TABLE bridge.provider_admission_convergence_intent OWNER TO agents_bridge;
ALTER FUNCTION bridge.request_provider_work_wakeup(text,text,timestamptz,text,bigint) OWNER TO agents_bridge;
ALTER FUNCTION bridge.claim_provider_work_wakeup(text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.consume_active_plan_wakeup(text,text) OWNER TO agents_bridge;
REVOKE ALL ON TABLE bridge.provider_work_wakeup_dispatch,bridge.provider_admission_convergence_intent FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.claim_provider_work_wakeup(text,text),bridge.consume_active_plan_wakeup(text,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.request_provider_work_wakeup(text,text,timestamptz,text,bigint), bridge.claim_provider_work_wakeup(text,text), bridge.consume_active_plan_wakeup(text,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0055_bssv200603a_durable_wakeup_consumer') ON CONFLICT DO NOTHING;
