import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import createJiti from "jiti";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const origin = process.env.BETTER_AUTH_URL;
const skip = !databaseUrl || !secret || !origin;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../", import.meta.url).pathname } });

const cookieFrom = (response) => response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");

function applicationDatabaseUrl() {
  const url = new URL(databaseUrl);
  url.username = "atlas_app";
  url.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  return url.toString();
}

test("AA-005 proves CLI bootstrap through Better Auth cookie authorization survives service restart", { skip }, async (t) => {
  const [{ createAtlasAuth, createAtlasBootstrapCoordinator }, { runAtlasAdminCommand }, { createAdminIdentityHandler }, { createPersistedAdminAuthorizationReader }] = await Promise.all([
    jiti.import("@atlas/auth"),
    jiti.import("../../../packages/atlas-auth/src/admin-bootstrap-cli.ts"),
    jiti.import("../app/api/admin/identity/route.ts"),
    jiti.import("../lib/admin-guard.ts"),
  ]);
  const admin = postgres(databaseUrl, { max: 1 });
  const suffix = randomUUID();
  const email = `aa005-${suffix}@example.test`;
  const name = "AA-005 Round Trip";
  const password = "test-only-aa005-password";
  const config = {
    databaseUrl: applicationDatabaseUrl(),
    secret,
    baseURL: origin,
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? origin).split(","),
  };
  const transcript = [];
  let service;
  let ownsBootstrapState = false;

  const protectedIdentity = async (activeService, cookie) => createAdminIdentityHandler(
    activeService.auth.api.getSession,
    createPersistedAdminAuthorizationReader(activeService.db),
  )(new Request(`${origin}/api/admin/identity`, { headers: { cookie } }));

  try {
    const [{ state }] = await admin`SELECT state FROM atlas.admin_bootstrap_state WHERE bootstrap_key = 'atlas-platform-super-admin'`;
    if (state !== "UNINITIALIZED") {
      t.skip("AA-005 requires a clean local bootstrap marker and does not alter an existing attempt");
      return;
    }
    ownsBootstrapState = true;

    const exitCode = await runAtlasAdminCommand(["admin", "bootstrap", "--email", email, "--name", name], {
      prompt: { async password() { return password; } },
      write: (line) => transcript.push(line),
      createService: async () => {
        const cliService = createAtlasAuth(config);
        return {
          coordinator: createAtlasBootstrapCoordinator(cliService),
          baseURL: config.baseURL,
          close: () => cliService.close(),
        };
      },
    });
    assert.equal(exitCode, 0, "the repository-native CLI completes a clean bootstrap");
    assert.match(transcript.join("\n"), /Bootstrap state sealed/);
    assert.doesNotMatch(transcript.join("\n"), new RegExp(password));

    service = createAtlasAuth(config);
    const signIn = await service.auth.handler(new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    }));
    assert.equal(signIn.status, 200, "the real Better Auth sign-in API accepts the CLI-created credentials");
    const cookie = cookieFrom(signIn);
    assert.ok(cookie, "the real Better Auth response issues a session cookie");

    const initialAccess = await protectedIdentity(service, cookie);
    assert.equal(initialAccess.status, 200, "the issued cookie reaches the protected Admin identity endpoint");
    assert.deepEqual(await initialAccess.json(), { user: { id: await userId(admin, email), email, name }, role: "admin" });

    await service.close();
    service = createAtlasAuth(config);
    const restartedAccess = await protectedIdentity(service, cookie);
    assert.equal(restartedAccess.status, 200, "the original issued cookie still authorizes after application and database-client restart");
    assert.deepEqual(await restartedAccess.json(), { user: { id: await userId(admin, email), email, name }, role: "admin" });

    const [persisted] = await admin`
      SELECT u.role, s.state
      FROM auth."user" AS u
      JOIN atlas.admin_bootstrap_state AS s ON s.bootstrap_key = 'atlas-platform-super-admin'
      WHERE u.email = ${email}
    `;
    assert.deepEqual({ role: persisted?.role, state: persisted?.state }, { role: "admin", state: "SEALED" });
  } finally {
    await service?.close();
    if (ownsBootstrapState) {
      await admin.begin(async (transaction) => {
        await transaction.unsafe("SET LOCAL session_replication_role = replica");
        await transaction`
          UPDATE atlas.admin_bootstrap_state
          SET state = 'UNINITIALIZED', attempt_id = NULL, attempt_email = NULL,
              initial_user_id = NULL, reserved_at = NULL, sealed_at = NULL
          WHERE bootstrap_key = 'atlas-platform-super-admin'
        `;
      }).catch(() => undefined);
      await admin`DELETE FROM auth."user" WHERE email = ${email}`.catch(() => undefined);
    }
    await admin.end();
  }
});

async function userId(admin, email) {
  const [user] = await admin`SELECT id FROM auth."user" WHERE email = ${email}`;
  assert.ok(user?.id, "the CLI-created Better Auth identity is persisted");
  return user.id;
}
