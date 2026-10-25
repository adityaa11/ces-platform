import assert from "node:assert/strict";
import test from "node:test";
import createJiti from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../", import.meta.url).pathname } });

test("the reusable guard distinguishes invalid sessions from denied Atlas authority", async () => {
  const { AtlasAdminAccessError, createAtlasAdminGuard } = await jiti.import("../lib/admin-guard.ts");
  const headers = new Headers({ cookie: "better-auth.session_token=opaque" });

  const missing = createAtlasAdminGuard(async () => null, async () => {
    throw new Error("authorization must not run without a valid session");
  });
  await assert.rejects(() => missing(headers), (error) => error instanceof AtlasAdminAccessError && error.status === 401);

  const failedLookup = createAtlasAdminGuard(async () => {
    throw new Error("session service unavailable");
  }, async () => {
    throw new Error("authorization must not run when session lookup fails");
  });
  await assert.rejects(() => failedLookup(headers), (error) => error instanceof AtlasAdminAccessError && error.status === 401);

  const ordinary = createAtlasAdminGuard(async ({ headers: received }) => {
    assert.strictEqual(received, headers);
    return { user: { id: "ordinary-user" } };
  }, async () => null);
  await assert.rejects(() => ordinary(headers), (error) => error instanceof AtlasAdminAccessError && error.status === 403);

  const admin = createAtlasAdminGuard(async () => ({ user: { id: "admin-user" } }), async (userId) => {
    assert.equal(userId, "admin-user");
    return { id: userId, email: "admin@example.test", name: "Atlas Admin", role: "admin" };
  });
  assert.deepEqual(await admin(headers), { id: "admin-user", email: "admin@example.test", name: "Atlas Admin", role: "admin" });

  const failedAuthorization = createAtlasAdminGuard(async () => ({ user: { id: "admin-user" } }), async () => {
    throw new Error("database unavailable");
  });
  await assert.rejects(() => failedAuthorization(headers), /database unavailable/);
});

test("the identity endpoint returns only the minimal guarded identity contract", async () => {
  const { createAdminIdentityHandler } = await jiti.import("../app/api/admin/identity/route.ts");
  const handler = createAdminIdentityHandler(async () => ({ user: { id: "admin-user" } }), async () => ({
    id: "admin-user", email: "admin@example.test", name: "Atlas Admin", role: "admin",
  }));

  const response = await handler(new Request("http://localhost:3001/api/admin/identity"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { id: "admin-user", email: "admin@example.test", name: "Atlas Admin" },
    role: "admin",
  });
  assert.deepEqual([...response.headers.keys()].filter((name) => name.includes("cookie")), []);

  const denied = createAdminIdentityHandler(async () => null, async () => null);
  const deniedResponse = await denied(new Request("http://localhost:3001/api/admin/identity"));
  assert.equal(deniedResponse.status, 401);
  assert.deepEqual(await deniedResponse.json(), { error: "Unauthorized" });
});
