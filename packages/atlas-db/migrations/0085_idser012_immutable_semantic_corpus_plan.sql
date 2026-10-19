-- IDSER-012-03-03-01: Atlas-owned immutable plan and handoff records.  These
-- records are deliberately not an outbox, queue, or downstream eligibility.
CREATE TABLE IF NOT EXISTS atlas.semantic_corpus_plan (
  id text PRIMARY KEY CHECK (id ~ '^semantic-plan-[a-f0-9]{64}$'),
  project_id text NOT NULL,
  workspace_id text NOT NULL,
  bundle_id text NOT NULL,
  document_id text NOT NULL,
  proposal_id text NOT NULL,
  idempotency_key text NOT NULL,
  plan_hash text NOT NULL UNIQUE CHECK (plan_hash ~ '^[a-f0-9]{64}$'),
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  source_fingerprint text NOT NULL CHECK (source_fingerprint ~ '^[a-f0-9]{64}$'),
  predecessor_plan_id text REFERENCES atlas.semantic_corpus_plan(id) ON DELETE RESTRICT,
  predecessor_plan_hash text CHECK (predecessor_plan_hash IS NULL OR predecessor_plan_hash ~ '^[a-f0-9]{64}$'),
  immutable_content jsonb NOT NULL CHECK (jsonb_typeof(immutable_content) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (project_id, workspace_id) REFERENCES atlas.workspace(project_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (bundle_id, document_id) REFERENCES atlas.extraction_bundle_document(bundle_id, document_id) ON DELETE RESTRICT,
  UNIQUE (project_id, workspace_id, bundle_id, document_id, proposal_id),
  UNIQUE (project_id, workspace_id, bundle_id, document_id, idempotency_key),
  CHECK ((predecessor_plan_id IS NULL) = (predecessor_plan_hash IS NULL))
);

CREATE TABLE IF NOT EXISTS atlas.planned_semantic_corpus_handoff (
  id text PRIMARY KEY CHECK (id ~ '^semantic-handoff-[a-f0-9]{64}$'),
  plan_id text NOT NULL REFERENCES atlas.semantic_corpus_plan(id) ON DELETE RESTRICT,
  batch_id text NOT NULL,
  batch_slot integer NOT NULL CHECK (batch_slot > 0),
  handoff_hash text NOT NULL UNIQUE CHECK (handoff_hash ~ '^[a-f0-9]{64}$'),
  immutable_content jsonb NOT NULL CHECK (jsonb_typeof(immutable_content) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, batch_id),
  UNIQUE (plan_id, batch_slot)
);

-- Cancellation is append-only so the immutable plan content is never edited.
CREATE TABLE IF NOT EXISTS atlas.semantic_corpus_plan_cancellation (
  plan_id text PRIMARY KEY REFERENCES atlas.semantic_corpus_plan(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas.semantic_corpus_plan OWNER TO atlas_app;
ALTER TABLE atlas.planned_semantic_corpus_handoff OWNER TO atlas_app;
ALTER TABLE atlas.semantic_corpus_plan_cancellation OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.semantic_corpus_plan, atlas.planned_semantic_corpus_handoff, atlas.semantic_corpus_plan_cancellation FROM PUBLIC, agents_bridge;
INSERT INTO atlas.schema_migrations (name) VALUES ('0085_idser012_immutable_semantic_corpus_plan') ON CONFLICT DO NOTHING;
