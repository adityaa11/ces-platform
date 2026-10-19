-- CFC IDSER-012-03-03-01: durable plans, handoffs, and cancellation ancestry
-- remain append-only for the normal Atlas persistence role.
CREATE OR REPLACE FUNCTION atlas.reject_semantic_corpus_plan_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is immutable; insert a new plan version or cancellation record', TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS semantic_corpus_plan_immutable ON atlas.semantic_corpus_plan;
CREATE TRIGGER semantic_corpus_plan_immutable BEFORE UPDATE OR DELETE ON atlas.semantic_corpus_plan
  FOR EACH ROW EXECUTE FUNCTION atlas.reject_semantic_corpus_plan_mutation();

DROP TRIGGER IF EXISTS planned_semantic_corpus_handoff_immutable ON atlas.planned_semantic_corpus_handoff;
CREATE TRIGGER planned_semantic_corpus_handoff_immutable BEFORE UPDATE OR DELETE ON atlas.planned_semantic_corpus_handoff
  FOR EACH ROW EXECUTE FUNCTION atlas.reject_semantic_corpus_plan_mutation();

DROP TRIGGER IF EXISTS semantic_corpus_plan_cancellation_immutable ON atlas.semantic_corpus_plan_cancellation;
CREATE TRIGGER semantic_corpus_plan_cancellation_immutable BEFORE UPDATE OR DELETE ON atlas.semantic_corpus_plan_cancellation
  FOR EACH ROW EXECUTE FUNCTION atlas.reject_semantic_corpus_plan_mutation();

INSERT INTO atlas.schema_migrations (name) VALUES ('0086_idser012_immutable_semantic_corpus_plan_cfc') ON CONFLICT DO NOTHING;
