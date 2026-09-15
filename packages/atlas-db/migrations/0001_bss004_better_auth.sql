-- BSS-004: Better Auth owns these identity and session records in auth.
CREATE TABLE IF NOT EXISTS auth."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL,
  image text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS auth.session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON auth.session ("userId");

CREATE TABLE IF NOT EXISTS auth.account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON auth.account ("userId");

CREATE TABLE IF NOT EXISTS auth.verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON auth.verification (identifier);

INSERT INTO atlas.schema_migrations (name) VALUES ('0001_bss004_better_auth') ON CONFLICT DO NOTHING;
