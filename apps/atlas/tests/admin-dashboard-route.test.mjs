import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the Admin Dashboard page applies the persisted server-side Admin guard before its placeholder renders", async () => {
  const page = await readFile(new URL("../app/admin/dashboard/page.tsx", import.meta.url), "utf8");

  assert.match(page, /import \{ headers \} from "next\/headers"/);
  assert.match(page, /import \{ forbidden, redirect \} from "next\/navigation"/);
  assert.match(page, /const service = await getAtlasAuthService\(\)/);
  assert.match(page, /const requestHeaders = await headers\(\)/);
  assert.match(page, /createAtlasAdminGuard\(\s*service\.auth\.api\.getSession,\s*createPersistedAdminAuthorizationReader\(service\.db\),\s*\)\(requestHeaders\)/s);
  assert.match(page, /if \(error\.status === 401\) redirect\("\/admin\/sign-in"\)/);
  assert.match(page, /forbidden\(\)/);
  assert.match(page, /Welcome, \{identity\.name\}\./);
  assert.match(page, /if \(isWorkerAuthRuntime\(\)\) await service\.close\(\)/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|fetch\(|\/api\/admin\/identity|mock|fixture/i);
});
