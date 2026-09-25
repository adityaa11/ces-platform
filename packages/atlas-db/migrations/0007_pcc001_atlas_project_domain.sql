-- PCC-001: Atlas-owned project metadata only. Source bytes remain in DocumentStore.
CREATE TABLE IF NOT EXISTS atlas.project (
  id text PRIMARY KEY,
  stable_id text NOT NULL UNIQUE CHECK (stable_id ~ '^[a-z0-9-]{3,48}$'),
  name text NOT NULL,
  description text,
  created_by_user_id text NOT NULL REFERENCES auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atlas.project_member (
  project_id text NOT NULL REFERENCES atlas.project(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES auth."user"(id),
  role text NOT NULL CHECK (role = 'owner'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS atlas.workspace (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES atlas.project(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('master', 'initial_draft')),
  state text NOT NULL CHECK (state IN ('empty', 'draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, kind),
  CHECK ((kind = 'master' AND state = 'empty') OR (kind = 'initial_draft' AND state = 'draft'))
);

CREATE TABLE IF NOT EXISTS atlas.document (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES atlas.project(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES atlas.workspace(id) ON DELETE RESTRICT,
  original_filename text NOT NULL,
  storage_key text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  media_type text NOT NULL CHECK (media_type = 'application/pdf'),
  created_by_user_id text NOT NULL REFERENCES auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_member_user_project_idx ON atlas.project_member (user_id, project_id);
CREATE INDEX IF NOT EXISTS document_workspace_idx ON atlas.document (workspace_id);

ALTER TABLE atlas.project OWNER TO atlas_app;
ALTER TABLE atlas.project_member OWNER TO atlas_app;
ALTER TABLE atlas.workspace OWNER TO atlas_app;
ALTER TABLE atlas.document OWNER TO atlas_app;
REVOKE ALL ON TABLE atlas.project, atlas.project_member, atlas.workspace, atlas.document FROM PUBLIC, agents_bridge;

INSERT INTO atlas.schema_migrations (name) VALUES ('0007_pcc001_atlas_project_domain') ON CONFLICT DO NOTHING;
