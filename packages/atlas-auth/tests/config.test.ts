import assert from "node:assert/strict";
import test from "node:test";
import { loadAtlasAuthConfig } from "../src/config.ts";

const validEnvironment = {
  DATABASE_URL: "postgresql://atlas:local_password@localhost:55432/atlas_test",
  BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  BETTER_AUTH_URL: "http://localhost:3001",
};

test("auth config supplies the base origin when an allowlist is omitted", () => {
  const config = loadAtlasAuthConfig(validEnvironment);
  assert.deepEqual(config.trustedOrigins, ["http://localhost:3001"]);
});

test("auth config rejects missing or weak secrets and malformed trusted origins", () => {
  assert.throws(() => loadAtlasAuthConfig({ ...validEnvironment, BETTER_AUTH_SECRET: undefined }), /BETTER_AUTH_SECRET is required/);
  assert.throws(() => loadAtlasAuthConfig({ ...validEnvironment, BETTER_AUTH_SECRET: "too-short" }), /at least 32 characters/);
  assert.throws(() => loadAtlasAuthConfig({ ...validEnvironment, BETTER_AUTH_TRUSTED_ORIGINS: "not an origin" }), /absolute http\(s\) origin/);
});
