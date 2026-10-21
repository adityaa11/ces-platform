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

CREATE OR REPLACE FUNCTION atlas.verify_semantic_multimodal_policy_binding_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE plan atlas.semantic_corpus_plan; handoff atlas.planned_semantic_corpus_handoff;
  key_count integer;
BEGIN
  SELECT * INTO plan FROM atlas.semantic_corpus_plan WHERE id=NEW.plan_id;
  SELECT * INTO handoff FROM atlas.planned_semantic_corpus_handoff WHERE id=NEW.handoff_id;
  IF NOT FOUND OR handoff.plan_id <> NEW.plan_id OR handoff.batch_id <> NEW.batch_id OR handoff.batch_slot <> NEW.batch_slot THEN
    RAISE EXCEPTION 'policy binding parents or batch identity are inconsistent';
  END IF;
  IF plan.created_at <> NEW.created_at OR handoff.created_at <> NEW.created_at THEN
    RAISE EXCEPTION 'policy binding must be inserted with its plan and handoff in one transaction';
  END IF;
  SELECT count(*) INTO key_count FROM jsonb_object_keys(NEW.binding_content);
  IF key_count <> 12
     OR NOT (NEW.binding_content ?& ARRAY['bindingVersion','planRef','handoffRef','planHash','handoffHash','batchId','batchSlot','identityBinding','estimatorBinding','routeBinding','serializerBinding','bindingSha256'])
     OR jsonb_typeof(NEW.binding_content->'identityBinding') <> 'object'
     OR jsonb_typeof(NEW.binding_content->'estimatorBinding') <> 'object'
     OR jsonb_typeof(NEW.binding_content->'routeBinding') <> 'object'
     OR jsonb_typeof(NEW.binding_content->'serializerBinding') <> 'object'
     OR jsonb_typeof(NEW.binding_content#>'{routeBinding,image,mediaTypes}') <> 'array'
     OR jsonb_array_length(NEW.binding_content#>'{routeBinding,image,mediaTypes}') <> 1
     OR NEW.binding_content#>>'{routeBinding,image,mediaTypes,0}' <> 'image/png'
     OR NEW.binding_content#>>'{serializerBinding,identity}' <> 'anoman.openai-chat.multipart-data-url'
     OR NEW.binding_content#>>'{serializerBinding,version}' <> 'v1' THEN
    RAISE EXCEPTION 'policy binding has an incomplete or unsupported schema';
  END IF;
  IF NEW.binding_content->>'bindingVersion' <> 'SemanticMultimodalReconstructionPolicyBinding/v1'
     OR NEW.binding_content->>'planRef' <> NEW.plan_id OR NEW.binding_content->>'handoffRef' <> NEW.handoff_id
     OR NEW.binding_content->>'planHash' <> plan.plan_hash OR NEW.binding_content->>'handoffHash' <> handoff.handoff_hash
     OR NEW.binding_content->>'batchId' <> NEW.batch_id OR (NEW.binding_content->>'batchSlot')::integer <> NEW.batch_slot
     OR NEW.binding_content->>'bindingSha256' <> NEW.binding_sha256 THEN
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
