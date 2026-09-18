import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mounts the shared Better Auth handler without application auth state", async () => {
  const [server, route, manifest] = await Promise.all([
    readFile(new URL("../lib/auth-server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/[...all]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(manifest, /"@atlas\/auth": "workspace:\*"/);
  assert.match(server, /createAtlasAuthFromEnvironment\(\)/);
  assert.match(server, /export const atlasAuthService = createAtlasAuthFromEnvironment\(\)/);
  assert.match(route, /auth\.handler\(request\)/);
  assert.match(route, /export const GET = handle/);
  assert.match(route, /export const POST = handle/);
  assert.doesNotMatch(`${server}\n${route}`, /betterAuth\(|createDatabase\(|localStorage|sessionStorage|jwt|project_member|atlas\.project/i);
});
