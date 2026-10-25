import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import createJiti from "jiti";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const skip = !databaseUrl || !secret;
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../", import.meta.url).pathname } });

const cookieFrom = (response) => response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");

test("AA-002 guards real Better Auth cookies against persisted role and sealed-bootstrap state", { skip }, async (t) => {
  const [{ createAtlasAuth }, { createAdminIdentityHandler }, { createPersistedAdminAuthorizationReader }] = await Promise.all([
    jiti.import("@atlas/auth"),
    jiti.import("../app/api/admin/identity/route.ts"),
    jiti.import("../lib/admin-guard.ts"),
  ]);
  const service = createAtlasAuth({
    databaseUrl,
    secret,
    baseURL: origin,
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? origin).split(","),
  });
  const admin = postgres(databaseUrl, { max: 1 });
  const suffix = randomUUID();
  const ordinaryEmail = `aa002-ordinary-${suffix}@example.test`;
  const adminEmail = `aa002-admin-${suffix}@example.test`;

  const signUp = async (email, name) => {
    const response = await service.auth.handler(new Request(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, name, password: "a-tested-local-password" }),
    }));
    assert.equal(response.status, 200);
    const cookie = cookieFrom(response);
    assert.ok(cookie, "Better Auth creates a real session cookie");
    return cookie;
  };

  try {
    const ordinaryCookie = await signUp(ordinaryEmail, "AA-002 ordinary user");
    const adminCookie = await signUp(adminEmail, "AA-002 admin user");
    const [{ id: adminId }] = await admin`SELECT id FROM auth."user" WHERE email = ${adminEmail}`;
    await admin`UPDATE auth."user" SET role = 'admin' WHERE id = ${adminId}`;

    const actualSession = service.auth.api.getSession;
    const persistedIdentity = createAdminIdentityHandler(actualSession, createPersistedAdminAuthorizationReader(service.db));
    for (const cookie of ["", "better-auth.session_token=malformed"]) {
      const response = await persistedIdentity(new Request(`${origin}/api/admin/identity`, { headers: cookie ? { cookie } : undefined }));
      assert.equal(response.status, 401, "missing and malformed Better Auth cookies are unauthorized");
    }

    const ordinaryResponse = await persistedIdentity(new Request(`${origin}/api/admin/identity`, { headers: { cookie: ordinaryCookie } }));
    assert.equal(ordinaryResponse.status, 403, "a valid ordinary Better Auth session is forbidden");

    const [{ state }] = await admin`SELECT state FROM atlas.admin_bootstrap_state WHERE bootstrap_key = 'atlas-platform-super-admin'`;
    const beforeFixture = await persistedIdentity(new Request(`${origin}/api/admin/identity`, { headers: { cookie: adminCookie } }));
    assert.equal(beforeFixture.status, state === "SEALED" ? 200 : 403, "the production reader requires the persisted sealed bootstrap marker");
    if (state === "RESERVED") {
      t.skip("the durable bootstrap attempt is reserved; AA-002 must not alter that predecessor state");
      return;
    }

    await admin.begin(async (transaction) => {
      if (state === "UNINITIALIZED") {
        await transaction`
          UPDATE atlas.admin_bootstrap_state
          SET state = 'RESERVED', attempt_id = ${`aa002-${suffix}`}, attempt_email = ${adminEmail}, reserved_at = now()
          WHERE bootstrap_key = 'atlas-platform-super-admin'
        `;
        await transaction`
          UPDATE atlas.admin_bootstrap_state
          SET state = 'SEALED', initial_user_id = ${adminId}, sealed_at = now()
          WHERE bootstrap_key = 'atlas-platform-super-admin'
        `;
      }
      const readAuthorization = async (userId) => {
        const rows = await transaction`
          SELECT u.id, u.email, u.name, u.role
          FROM auth."user" AS u
          JOIN atlas.admin_bootstrap_state AS bootstrap
            ON bootstrap.bootstrap_key = 'atlas-platform-super-admin'
          WHERE u.id = ${userId} AND u.role = 'admin' AND bootstrap.state = 'SEALED'
        `;
        const identity = rows[0];
        return identity ? { ...identity, role: "admin" } : null;
      };
      const protectedIdentity = createAdminIdentityHandler(actualSession, readAuthorization);
      const response = await protectedIdentity(new Request(`${origin}/api/admin/identity`, { headers: { cookie: adminCookie } }));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        user: { id: adminId, email: adminEmail, name: "AA-002 admin user" },
        role: "admin",
      });
      throw new Error("AA-002 rollback-only sealed-state fixture");
    }).catch((error) => {
      if (error.message !== "AA-002 rollback-only sealed-state fixture") throw error;
    });

    const expiredCookie = await signUp(`aa002-expired-${suffix}@example.test`, "AA-002 expired user");
    await admin`UPDATE auth.session SET "expiresAt" = now() - interval '1 hour' WHERE "userId" = (SELECT id FROM auth."user" WHERE email = ${`aa002-expired-${suffix}@example.test`})`;
    const expiredResponse = await persistedIdentity(new Request(`${origin}/api/admin/identity`, { headers: { cookie: expiredCookie } }));
    assert.equal(expiredResponse.status, 401, "an expired Better Auth session is unauthorized");

    const revokedCookie = await signUp(`aa002-revoked-${suffix}@example.test`, "AA-002 revoked user");
    const signOut = await service.auth.handler(new Request(`${origin}/api/auth/sign-out`, { method: "POST", headers: { cookie: revokedCookie, origin } }));
    assert.equal(signOut.status, 200);
    const revokedResponse = await persistedIdentity(new Request(`${origin}/api/admin/identity`, { headers: { cookie: revokedCookie } }));
    assert.equal(revokedResponse.status, 401, "a revoked Better Auth session is unauthorized");
  } finally {
    await service.close();
    await admin`DELETE FROM auth."user" WHERE email LIKE ${`aa002-%-${suffix}@example.test`}`;
    await admin.end();
  }
});
