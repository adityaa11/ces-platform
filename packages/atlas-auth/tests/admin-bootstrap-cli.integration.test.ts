import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { createAtlasAuth, createAtlasBootstrapCoordinator } from "../src/index.ts";
import { runAtlasAdminCommand } from "../src/admin-bootstrap-cli.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("AA-004 CLI provisions a real Better Auth administrator without an HTTP server", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const email = `aa004-${randomUUID()}@example.test`;
  const password = "test-only-cli-password";
  const applicationUrl = new URL(databaseUrl!);
  applicationUrl.username = "atlas_app";
  applicationUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const config = {
    databaseUrl: applicationUrl.toString(),
    secret: "0123456789abcdef0123456789abcdef",
    baseURL: "http://localhost:3001",
    trustedOrigins: ["http://localhost:3001"],
  };
  const reset = async () => {
    await admin.begin(async (transaction) => {
      await transaction.unsafe("SET LOCAL session_replication_role = replica");
      await transaction`
        UPDATE atlas.admin_bootstrap_state
        SET state = 'UNINITIALIZED', attempt_id = NULL, attempt_email = NULL,
            initial_user_id = NULL, reserved_at = NULL, sealed_at = NULL
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
    });
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
  };

  const output: string[] = [];
  try {
    const initial = await admin<{ state: string }[]>`
      SELECT state FROM atlas.admin_bootstrap_state WHERE bootstrap_key = 'atlas-platform-super-admin'
    `;
    if (initial[0]?.state !== "UNINITIALIZED") {
      test.skip("AA-004 integration requires the local bootstrap marker to be uninitialized");
      return;
    }
    assert.equal(await runAtlasAdminCommand(["admin", "bootstrap", "--email", email, "--name", "AA-004 CLI"], {
      prompt: { async password() { return password; } },
      write: (line) => output.push(line),
      createService: async () => {
        const service = createAtlasAuth(config);
        return { coordinator: createAtlasBootstrapCoordinator(service), baseURL: config.baseURL, close: () => service.close() };
      },
    }), 0);
    const rows = await admin`
      SELECT u.email, u.role, u."emailVerified", u.banned, a.password, s.state
      FROM auth."user" AS u
      JOIN auth.account AS a ON a."userId" = u.id AND a."providerId" = 'credential'
      JOIN atlas.admin_bootstrap_state AS s ON s.bootstrap_key = 'atlas-platform-super-admin'
      WHERE u.email = ${email}
    `;
    assert.equal(rows.length, 1);
    assert.deepEqual(
      { role: rows[0].role, verified: rows[0].emailVerified, banned: rows[0].banned, credentialed: Boolean(rows[0].password), state: rows[0].state },
      { role: "admin", verified: true, banned: false, credentialed: true, state: "SEALED" },
    );

    const service = createAtlasAuth(config);
    try {
      const response = await service.auth.handler(new Request(`${config.baseURL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: config.baseURL },
        body: JSON.stringify({ email, password }),
      }));
      assert.equal(response.status, 200, "CLI-created credentials are immediately eligible for normal Better Auth sign-in");
    } finally {
      await service.close();
    }
    const transcript = output.join("\n");
    assert.match(transcript, /Bootstrap state sealed/);
    assert.doesNotMatch(transcript, new RegExp(password));
  } finally {
    await reset().catch(() => undefined);
    await admin.end();
  }
});
