-- GHR-02A owns immutable issuance truth only.  It deliberately creates no
-- queue, worker, delivery receipt, lease, trigger, or acceptance-path hook.
CREATE TABLE atlas.generic_handoff_route_policy (
  policy_version text NOT NULL,
  producer_process_key text NOT NULL,
  producer_event text NOT NULL,
  route_main text NOT NULL,
  route_branch text NOT NULL,
  handler_version text NOT NULL,
  body_contract_type text NOT NULL,
  body_contract_version text NOT NULL,
  can_continue boolean NOT NULL CHECK (can_continue = false),
  enabled boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (policy_version, producer_process_key, producer_event, route_main, route_branch, handler_version, body_contract_type, body_contract_version),
  CHECK (policy_version = 'v1'),
  CHECK (producer_process_key = 'perception.acceptance'),
  CHECK (producer_event = 'NormalizedDocumentAccepted/v1'),
  CHECK (route_main = 'semantic'),
  CHECK (route_branch = 'batch-plan'),
  CHECK (handler_version = 'v1'),
  CHECK (body_contract_type = 'SemanticBatchPlanInput'),
  CHECK (body_contract_version = 'v1')
);

CREATE TABLE atlas.generic_handoff_intent (
  handoff_id text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  producer_execution_id text NOT NULL,
  project_id text NOT NULL,
  workspace_id text NOT NULL,
  bundle_id text NOT NULL,
  document_id text NOT NULL,
  policy_version text NOT NULL,
  handler_version text NOT NULL,
  body_contract_type text NOT NULL,
  body_contract_version text NOT NULL,
  route_main text NOT NULL,
  route_branch text NOT NULL,
  can_continue boolean NOT NULL CHECK (can_continue = false),
  body_encoding text NOT NULL CHECK (body_encoding = 'canonical-json-v1'),
  body_bytes bytea NOT NULL CHECK (octet_length(body_bytes) BETWEEN 1 AND 2081),
  body_sha256 text NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  trusted_header jsonb NOT NULL,
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (route_main = 'semantic' AND route_branch = 'batch-plan'),
  CHECK (policy_version = 'v1' AND handler_version = 'v1'),
  CHECK (body_contract_type = 'SemanticBatchPlanInput' AND body_contract_version = 'v1')
);

CREATE OR REPLACE FUNCTION atlas.reject_generic_handoff_intent_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'generic handoff intent is immutable';
END;
$$;
CREATE TRIGGER generic_handoff_intent_immutable
  BEFORE UPDATE OR DELETE ON atlas.generic_handoff_intent
  FOR EACH ROW EXECUTE FUNCTION atlas.reject_generic_handoff_intent_mutation();

INSERT INTO atlas.generic_handoff_route_policy (
  policy_version, producer_process_key, producer_event, route_main, route_branch,
  handler_version, body_contract_type, body_contract_version, can_continue, enabled
) VALUES ('v1', 'perception.acceptance', 'NormalizedDocumentAccepted/v1', 'semantic', 'batch-plan', 'v1', 'SemanticBatchPlanInput', 'v1', false, true)
ON CONFLICT DO NOTHING;

-- This is deliberately a one-known-handoff lookup, not SELECT access to the
-- Atlas tables.  Delivery state remains a later Bridge-owned concern.
CREATE OR REPLACE FUNCTION atlas.read_generic_handoff_dispatch_v1(p_handoff_id text)
RETURNS TABLE(handoff_id text, trusted_header jsonb, body_bytes bytea, body_sha256 text, body_encoding text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, atlas AS $$
BEGIN
  IF session_user <> 'agents_bridge' OR length(trim(COALESCE(p_handoff_id, ''))) = 0 THEN
    RAISE EXCEPTION 'generic handoff dispatch access denied';
  END IF;
  RETURN QUERY
  SELECT intent.handoff_id, intent.trusted_header, intent.body_bytes, intent.body_sha256, intent.body_encoding
  FROM atlas.generic_handoff_intent intent
  WHERE intent.handoff_id = p_handoff_id;
END;
$$;

ALTER TABLE atlas.generic_handoff_route_policy OWNER TO atlas_app;
ALTER TABLE atlas.generic_handoff_intent OWNER TO atlas_app;
ALTER FUNCTION atlas.reject_generic_handoff_intent_mutation() OWNER TO atlas_app;
ALTER FUNCTION atlas.read_generic_handoff_dispatch_v1(text) OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.generic_handoff_route_policy, atlas.generic_handoff_intent FROM PUBLIC, agents_bridge;
REVOKE ALL ON FUNCTION atlas.reject_generic_handoff_intent_mutation(), atlas.read_generic_handoff_dispatch_v1(text) FROM PUBLIC, atlas_app;
GRANT EXECUTE ON FUNCTION atlas.read_generic_handoff_dispatch_v1(text) TO agents_bridge;

INSERT INTO atlas.schema_migrations(name) VALUES('0103_ghr02a_immutable_issuance') ON CONFLICT DO NOTHING;
