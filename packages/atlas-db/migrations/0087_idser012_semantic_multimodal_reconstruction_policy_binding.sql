-- IDSER-012-05-04-02: forward-only recovery binding for future v3 plans.
-- The sidecar deliberately stores identities, hashes, and bounded policy only.
CREATE TABLE IF NOT EXISTS atlas.semantic_multimodal_reconstruction_policy_binding (
  plan_id text NOT NULL REFERENCES atlas.semantic_corpus_plan(id) ON DELETE RESTRICT,
  handoff_id text NOT NULL REFERENCES atlas.planned_semantic_corpus_handoff(id) ON DELETE RESTRICT,
  batch_id text NOT NULL,
  batch_slot integer NOT NULL CHECK (batch_slot > 0),
  binding_sha256 text NOT NULL UNIQUE CHECK (binding_sha256 ~ '^[a-f0-9]{64}$'),
  binding_content jsonb NOT NULL CHECK (jsonb_typeof(binding_content) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, handoff_id, batch_id, batch_slot),
  UNIQUE (plan_id, handoff_id),
  UNIQUE (plan_id, batch_id, batch_slot)
);

-- The application remains the source of composition/hash semantics.  These
-- helpers reproduce only the frozen JSON commitment at the ownership boundary
-- so a table owner cannot persist a malformed or hash-inconsistent sidecar.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION atlas.idser012_exact_json_keys(p_value jsonb, p_keys text[])
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(p_value) = 'object'
    AND p_value ?& p_keys
    AND (SELECT count(*) FROM jsonb_object_keys(p_value)) = cardinality(p_keys), false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_bounded_text(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(p_value) = 'string'
    AND octet_length(p_value #>> '{}') BETWEEN 1 AND 200, false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_sha256(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(p_value) = 'string'
    AND (p_value #>> '{}') ~ '^[a-f0-9]{64}$', false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_positive_safe_integer(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(p_value) = 'number'
    AND (p_value #>> '{}') ~ '^[1-9][0-9]*$'
    AND (p_value #>> '{}')::numeric <= 9007199254740991, false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_nonnegative_safe_integer(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(p_value) = 'number'
    AND (p_value #>> '{}') ~ '^(0|[1-9][0-9]*)$'
    AND (p_value #>> '{}')::numeric <= 9007199254740991, false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_versioned_identity(p_value jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(atlas.idser012_exact_json_keys(p_value, ARRAY['identity','version'])
    AND atlas.idser012_bounded_text(p_value->'identity')
    AND atlas.idser012_bounded_text(p_value->'version'), false)
$$;

CREATE OR REPLACE FUNCTION atlas.idser012_canonical_json(p_value jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE p_kind text; p_output text;
BEGIN
  p_kind := jsonb_typeof(p_value);
  IF p_kind IN ('null','boolean','number','string') THEN RETURN p_value::text; END IF;
  IF p_kind = 'array' THEN
    SELECT '[' || COALESCE(string_agg(atlas.idser012_canonical_json(value), ',' ORDER BY ordinal), '') || ']'
      INTO p_output FROM jsonb_array_elements(p_value) WITH ORDINALITY AS elements(value, ordinal);
    RETURN p_output;
  END IF;
  IF p_kind = 'object' THEN
    SELECT '{' || COALESCE(string_agg(to_jsonb(key)::text || ':' || atlas.idser012_canonical_json(value), ',' ORDER BY key COLLATE "C"), '') || '}'
      INTO p_output FROM jsonb_each(p_value);
    RETURN p_output;
  END IF;
  RAISE EXCEPTION 'unsupported policy binding JSON value';
END;
$$;

CREATE OR REPLACE FUNCTION atlas.verify_semantic_multimodal_policy_binding_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE plan atlas.semantic_corpus_plan; handoff atlas.planned_semantic_corpus_handoff;
  content jsonb := NEW.binding_content;
  expected_binding_sha256 text;
BEGIN
  SELECT * INTO plan FROM atlas.semantic_corpus_plan WHERE id=NEW.plan_id;
  SELECT * INTO handoff FROM atlas.planned_semantic_corpus_handoff WHERE id=NEW.handoff_id;
  IF NOT FOUND OR handoff.plan_id <> NEW.plan_id OR handoff.batch_id <> NEW.batch_id OR handoff.batch_slot <> NEW.batch_slot THEN
    RAISE EXCEPTION 'policy binding parents or batch identity are inconsistent';
  END IF;
  IF NEW.created_at <> transaction_timestamp()
     OR plan.created_at <> transaction_timestamp()
     OR handoff.created_at <> transaction_timestamp() THEN
    RAISE EXCEPTION 'policy binding must be inserted with its plan and handoff in one transaction';
  END IF;
  IF NOT atlas.idser012_exact_json_keys(content, ARRAY['bindingVersion','planRef','handoffRef','planHash','handoffHash','batchId','batchSlot','identityBinding','estimatorBinding','routeBinding','serializerBinding','bindingSha256'])
     OR content->>'bindingVersion' <> 'SemanticMultimodalReconstructionPolicyBinding/v1'
     OR NOT atlas.idser012_bounded_text(content->'planRef') OR NOT atlas.idser012_bounded_text(content->'handoffRef') OR NOT atlas.idser012_bounded_text(content->'batchId')
     OR NOT atlas.idser012_sha256(content->'planHash') OR NOT atlas.idser012_sha256(content->'handoffHash') OR NOT atlas.idser012_sha256(content->'bindingSha256')
     OR NOT atlas.idser012_positive_safe_integer(content->'batchSlot')
     OR NOT atlas.idser012_exact_json_keys(content->'identityBinding', ARRAY['prompt','schema','composer','route','adapter'])
     OR NOT atlas.idser012_versioned_identity(content#>'{identityBinding,prompt}') OR NOT atlas.idser012_versioned_identity(content#>'{identityBinding,schema}') OR NOT atlas.idser012_versioned_identity(content#>'{identityBinding,composer}') OR NOT atlas.idser012_versioned_identity(content#>'{identityBinding,route}') OR NOT atlas.idser012_versioned_identity(content#>'{identityBinding,adapter}')
     OR NOT atlas.idser012_exact_json_keys(content->'estimatorBinding', ARRAY['estimator','configuration','configurationSha256','inputBytesPerToken','framingAllowanceBytes','requestByteSafetyMargin','inputTokenSafetyMargin','reservedOutputTokens','requestResourceEnvelope','imageTokenPolicy'])
     OR NOT atlas.idser012_versioned_identity(content#>'{estimatorBinding,estimator}') OR NOT atlas.idser012_versioned_identity(content#>'{estimatorBinding,configuration}') OR NOT atlas.idser012_sha256(content#>'{estimatorBinding,configurationSha256}')
     OR NOT atlas.idser012_positive_safe_integer(content#>'{estimatorBinding,inputBytesPerToken}') OR NOT atlas.idser012_nonnegative_safe_integer(content#>'{estimatorBinding,framingAllowanceBytes}') OR NOT atlas.idser012_nonnegative_safe_integer(content#>'{estimatorBinding,requestByteSafetyMargin}') OR NOT atlas.idser012_nonnegative_safe_integer(content#>'{estimatorBinding,inputTokenSafetyMargin}') OR NOT atlas.idser012_positive_safe_integer(content#>'{estimatorBinding,reservedOutputTokens}')
     OR NOT atlas.idser012_exact_json_keys(content#>'{estimatorBinding,requestResourceEnvelope}', ARRAY['requestUnits','dayUnits','concurrencyUnits'])
     OR NOT atlas.idser012_positive_safe_integer(content#>'{estimatorBinding,requestResourceEnvelope,requestUnits}') OR NOT atlas.idser012_positive_safe_integer(content#>'{estimatorBinding,requestResourceEnvelope,dayUnits}') OR NOT atlas.idser012_positive_safe_integer(content#>'{estimatorBinding,requestResourceEnvelope,concurrencyUnits}')
     OR NOT atlas.idser012_exact_json_keys(content#>'{estimatorBinding,imageTokenPolicy}', ARRAY['identity','version','policySha256'])
     OR NOT atlas.idser012_bounded_text(content#>'{estimatorBinding,imageTokenPolicy,identity}') OR NOT atlas.idser012_bounded_text(content#>'{estimatorBinding,imageTokenPolicy,version}') OR NOT atlas.idser012_sha256(content#>'{estimatorBinding,imageTokenPolicy,policySha256}')
     OR NOT atlas.idser012_exact_json_keys(content->'routeBinding', ARRAY['routeId','profileId','profileVersion','maxPromptBytes','image','imageTpm'])
     OR NOT atlas.idser012_bounded_text(content#>'{routeBinding,routeId}') OR NOT atlas.idser012_bounded_text(content#>'{routeBinding,profileId}') OR NOT atlas.idser012_bounded_text(content#>'{routeBinding,profileVersion}') OR NOT atlas.idser012_positive_safe_integer(content#>'{routeBinding,maxPromptBytes}')
     OR NOT atlas.idser012_exact_json_keys(content#>'{routeBinding,image}', ARRAY['version','mediaTypes','maxImageCount','maxImageBytes','maxImageWidth','maxImageHeight'])
     OR content#>>'{routeBinding,image,version}' <> 'v1' OR jsonb_typeof(content#>'{routeBinding,image,mediaTypes}') <> 'array' OR jsonb_array_length(content#>'{routeBinding,image,mediaTypes}') <> 1 OR content#>>'{routeBinding,image,mediaTypes,0}' <> 'image/png'
     OR NOT atlas.idser012_positive_safe_integer(content#>'{routeBinding,image,maxImageCount}') OR NOT atlas.idser012_positive_safe_integer(content#>'{routeBinding,image,maxImageBytes}') OR NOT atlas.idser012_positive_safe_integer(content#>'{routeBinding,image,maxImageWidth}') OR NOT atlas.idser012_positive_safe_integer(content#>'{routeBinding,image,maxImageHeight}')
     OR NOT ((atlas.idser012_exact_json_keys(content#>'{routeBinding,imageTpm}', ARRAY['state']) AND content#>>'{routeBinding,imageTpm,state}' = 'unknown') OR (atlas.idser012_exact_json_keys(content#>'{routeBinding,imageTpm}', ARRAY['state','tokensPerImage']) AND content#>>'{routeBinding,imageTpm,state}' = 'qualified' AND atlas.idser012_positive_safe_integer(content#>'{routeBinding,imageTpm,tokensPerImage}')))
     OR NOT atlas.idser012_exact_json_keys(content->'serializerBinding', ARRAY['identity','version','model','policySha256'])
     OR content#>>'{serializerBinding,identity}' <> 'anoman.openai-chat.multipart-data-url' OR content#>>'{serializerBinding,version}' <> 'v1' OR NOT atlas.idser012_bounded_text(content#>'{serializerBinding,model}') OR NOT atlas.idser012_sha256(content#>'{serializerBinding,policySha256}') THEN
    RAISE EXCEPTION 'policy binding has an incomplete or unsupported schema';
  END IF;
  expected_binding_sha256 := encode(atlas.digest(convert_to(atlas.idser012_canonical_json(content - 'bindingSha256'), 'UTF8'), 'sha256'), 'hex');
  IF NEW.binding_content->>'bindingVersion' <> 'SemanticMultimodalReconstructionPolicyBinding/v1'
     OR NEW.binding_content->>'planRef' <> NEW.plan_id OR NEW.binding_content->>'handoffRef' <> NEW.handoff_id
     OR NEW.binding_content->>'planHash' <> plan.plan_hash OR NEW.binding_content->>'handoffHash' <> handoff.handoff_hash
      OR NEW.binding_content->>'batchId' <> NEW.batch_id OR (NEW.binding_content->>'batchSlot')::integer <> NEW.batch_slot
      OR NEW.binding_content->>'bindingSha256' <> NEW.binding_sha256
      OR NEW.binding_sha256 <> expected_binding_sha256 THEN
    RAISE EXCEPTION 'policy binding commitment is inconsistent with immutable v3 parents';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER semantic_multimodal_policy_binding_insert_guard
  BEFORE INSERT ON atlas.semantic_multimodal_reconstruction_policy_binding
  FOR EACH ROW EXECUTE FUNCTION atlas.verify_semantic_multimodal_policy_binding_insert();

CREATE TRIGGER semantic_multimodal_policy_binding_immutable
  BEFORE UPDATE OR DELETE ON atlas.semantic_multimodal_reconstruction_policy_binding
  FOR EACH ROW EXECUTE FUNCTION atlas.reject_semantic_corpus_plan_mutation();

ALTER TABLE atlas.semantic_multimodal_reconstruction_policy_binding OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.semantic_multimodal_reconstruction_policy_binding FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0087_idser012_semantic_multimodal_reconstruction_policy_binding') ON CONFLICT DO NOTHING;
