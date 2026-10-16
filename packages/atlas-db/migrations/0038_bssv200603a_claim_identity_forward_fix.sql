-- Forward-only identity completion for databases that applied 0037 before the
-- worker needed the domain/profile fields to submit bounded feedback.
--
-- The route authority is deliberately separate from an attempt binding. Only
-- the Bridge's configured resolver can publish a qualified identity, and the
-- bind operation can then persist only that server-published identity. The
-- admission role has no grant on either operation.
CREATE TABLE IF NOT EXISTS bridge.qualified_provider_route_authority (
  route_id text PRIMARY KEY,
  capability text NOT NULL,
  adapter_version text NOT NULL,
  qualification_version text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO bridge.qualified_provider_route_authority(route_id,capability,adapter_version,qualification_version)
SELECT DISTINCT selected_route_id,capability,adapter_version,qualification_version
  FROM bridge.provider_work_route_binding
ON CONFLICT (route_id) DO NOTHING;

CREATE OR REPLACE FUNCTION bridge.publish_qualified_provider_route_authority(
  p_route_id text,
  p_capability text,
  p_adapter_version text,
  p_qualification_version text
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_route_id IS NULL OR p_capability IS NULL OR p_adapter_version IS NULL OR p_qualification_version IS NULL
    OR btrim(p_route_id)='' OR btrim(p_capability)='' OR btrim(p_adapter_version)='' OR btrim(p_qualification_version)='' THEN
    RAISE EXCEPTION 'qualified route authority is incomplete';
  END IF;
  INSERT INTO bridge.qualified_provider_route_authority(route_id,capability,adapter_version,qualification_version)
    VALUES(p_route_id,p_capability,p_adapter_version,p_qualification_version)
  ON CONFLICT (route_id) DO UPDATE
    SET capability=EXCLUDED.capability,
        adapter_version=EXCLUDED.adapter_version,
        qualification_version=EXCLUDED.qualification_version,
        published_at=now();
END;
$$;

CREATE OR REPLACE FUNCTION bridge.bind_provider_work_route(
  p_logical_work_id text,
  p_attempt_number integer,
  p_selected_route_id text
)
RETURNS bridge.provider_work_route_binding LANGUAGE plpgsql AS $$
DECLARE work bridge.provider_work_attempt; active bridge.desired_admission_profile;
  authority bridge.qualified_provider_route_authority; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO work FROM bridge.provider_work_attempt
    WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work attempt is unknown'; END IF;
  SELECT * INTO active FROM bridge.desired_admission_profile
    WHERE quota_domain_id=work.quota_domain_id AND profile_version=work.desired_profile_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'provider work has no active desired admission profile'; END IF;
  SELECT * INTO authority FROM bridge.qualified_provider_route_authority WHERE route_id=p_selected_route_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'selected route is not published by the server-qualified resolver'; END IF;
  IF authority.capability <> (SELECT capability FROM bridge.provider_process_profile WHERE process_id=work.process_id AND profile_version=work.process_profile_version) THEN
    RAISE EXCEPTION 'selected route capability is not authorized for the provider process';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_process_profile process WHERE process.process_id=work.process_id AND process.profile_version=work.process_profile_version AND process.eligible_route_ids ? p_selected_route_id) THEN
    RAISE EXCEPTION 'selected route is not eligible for the server-authorized provider process';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bridge.provider_capacity_profile c, jsonb_array_elements(c.associated_routes) r WHERE c.quota_domain_id=work.quota_domain_id AND c.profile_version=active.provider_capacity_profile_version AND (r #>> '{}'=p_selected_route_id OR r->>'routeId'=p_selected_route_id)) THEN
    RAISE EXCEPTION 'selected route is not associated with the canonical quota domain';
  END IF;
  INSERT INTO bridge.provider_work_route_binding(logical_work_id,attempt_number,selected_route_id,capability,adapter_version,qualification_version,provider_capacity_profile_version)
    VALUES(p_logical_work_id,p_attempt_number,p_selected_route_id,authority.capability,authority.adapter_version,authority.qualification_version,active.provider_capacity_profile_version)
  ON CONFLICT(logical_work_id,attempt_number) DO NOTHING RETURNING * INTO binding;
  IF NOT FOUND THEN
    SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=p_logical_work_id AND attempt_number=p_attempt_number;
    IF binding.selected_route_id<>p_selected_route_id OR binding.capability<>authority.capability OR binding.adapter_version<>authority.adapter_version OR binding.qualification_version<>authority.qualification_version THEN
      RAISE EXCEPTION 'selected route binding conflicts with immutable attempt identity';
    END IF;
  END IF;
  RETURN binding;
END;
$$;

CREATE OR REPLACE FUNCTION bridge.claim_provider_admitted_transport(p_reservation_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE dispatch bridge.provider_work_dispatch; work bridge.provider_work_attempt; binding bridge.provider_work_route_binding;
BEGIN
  SELECT * INTO dispatch FROM bridge.provider_work_dispatch WHERE reservation_id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch is missing'; END IF;
  SELECT * INTO work FROM bridge.provider_work_attempt WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number FOR UPDATE;
  SELECT * INTO binding FROM bridge.provider_work_route_binding WHERE logical_work_id=dispatch.logical_work_id AND attempt_number=dispatch.attempt_number;
  IF NOT FOUND THEN RAISE EXCEPTION 'admitted provider dispatch has no immutable selected route'; END IF;
  INSERT INTO bridge.provider_transport_claim(reservation_id,logical_work_id,attempt_number) VALUES(p_reservation_id,dispatch.logical_work_id,dispatch.attempt_number) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation already authorized an outbound attempt'; END IF;
  UPDATE bridge.provider_work_attempt SET state='transport_may_have_started',state_version=state_version+1,updated_at=now() WHERE logical_work_id=work.logical_work_id AND attempt_number=work.attempt_number AND state='dispatched' AND cancellation_requested_at IS NULL AND (execution_deadline_at IS NULL OR execution_deadline_at>now());
  IF NOT FOUND THEN RAISE EXCEPTION 'dispatched provider work is stale, cancelled, or expired'; END IF;
  UPDATE bridge.provider_work_dispatch SET transport_claimed_at=now() WHERE reservation_id=p_reservation_id AND transport_claimed_at IS NULL;
  RETURN jsonb_build_object('logicalWorkId',work.logical_work_id,'attemptNumber',work.attempt_number,'reservationId',p_reservation_id,'routeId',binding.selected_route_id,'capability',binding.capability,'adapterVersion',binding.adapter_version,'qualificationVersion',binding.qualification_version,'quotaDomainId',work.quota_domain_id,'desiredProfileVersion',work.desired_profile_version);
END;
$$;
ALTER FUNCTION bridge.claim_provider_admitted_transport(uuid) OWNER TO agents_bridge;
ALTER FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text) OWNER TO agents_bridge;
ALTER FUNCTION bridge.bind_provider_work_route(text,integer,text) OWNER TO agents_bridge;
ALTER TABLE bridge.qualified_provider_route_authority OWNER TO agents_bridge;
REVOKE ALL ON FUNCTION bridge.claim_provider_admitted_transport(uuid) FROM PUBLIC,atlas_app;
REVOKE ALL ON FUNCTION bridge.publish_qualified_provider_route_authority(text,text,text,text),bridge.bind_provider_work_route(text,integer,text) FROM PUBLIC,atlas_app;
GRANT EXECUTE ON FUNCTION bridge.claim_provider_admitted_transport(uuid),bridge.publish_qualified_provider_route_authority(text,text,text,text),bridge.bind_provider_work_route(text,integer,text) TO agents_bridge;
INSERT INTO atlas.schema_migrations(name) VALUES('0038_bssv200603a_claim_identity_forward_fix') ON CONFLICT DO NOTHING;
