import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { AtlasBootstrapError, createAtlasAuth, createAtlasBootstrapCoordinator } from "../src/index.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

const configFor = (url: string) => {
  const applicationUrl = new URL(url);
  applicationUrl.username = "atlas_app";
  applicationUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  return {
    databaseUrl: applicationUrl.toString(),
    secret: "0123456789abcdef0123456789abcdef",
    baseURL: "http://localhost:3001",
    trustedOrigins: ["http://localhost:3001"],
  };
};

test("AA-003 coordinator reserves, verifies, seals, and reconciles only one durable attempt", { skip }, async () => {
  const admin = postgres(databaseUrl!, { max: 1 });
  const suffix = randomUUID();
  const emails: string[] = [];
  const reset = async () => {
    await admin.begin(async (transaction) => {
      // The fixture owns only an initially-uninitialized local marker. The
      // transition trigger correctly forbids ordinary application reset, so
      // administrative teardown suppresses it transaction-locally.
      await transaction.unsafe("SET LOCAL session_replication_role = replica");
      await transaction`
        UPDATE atlas.admin_bootstrap_state
        SET state = 'UNINITIALIZED', attempt_id = NULL, attempt_email = NULL,
            initial_user_id = NULL, reserved_at = NULL, sealed_at = NULL
        WHERE bootstrap_key = 'atlas-platform-super-admin'
      `;
    });
    if (emails.length) await admin`DELETE FROM auth."user" WHERE email = ANY(${emails})`;
  };
  const readMarker = async () => (await admin<{
    state: string; attempt_id: string | null; attempt_email: string | null; initial_user_id: string | null;
  }[]>`
    SELECT state, attempt_id, attempt_email, initial_user_id
    FROM atlas.admin_bootstrap_state
    WHERE bootstrap_key = 'atlas-platform-super-admin'
  `)[0];
  const newInput = (name: string) => {
    const email = `aa003-${name}-${suffix}@example.test`;
    emails.push(email);
    return { email, name: `AA-003 ${name}`, password: `not-a-real-secret-${suffix}` };
  };

  try {
    const initial = await readMarker();
    if (initial?.state !== "UNINITIALIZED") {
      test.skip("AA-003 integration requires the local bootstrap marker to be uninitialized");
      return;
    }

    const service = createAtlasAuth(configFor(databaseUrl!));
    try {
      const first = newInput("success");
      const second = newInput("contender");
      const coordinator = createAtlasBootstrapCoordinator(service);
      const [winner, contender] = await Promise.allSettled([
        coordinator.provision(first),
        coordinator.provision(second),
      ]);
      const success = winner.status === "fulfilled" ? winner : contender.status === "fulfilled" ? contender : undefined;
      const rejection = winner.status === "rejected" ? winner : contender.status === "rejected" ? contender : undefined;
      assert.ok(success, "exactly one concurrent caller seals the singleton state");
      assert.equal(success.value.state, "SEALED");
      assert.ok(rejection?.reason instanceof AtlasBootstrapError);
      assert.equal(rejection?.reason.code, "BOOTSTRAP_RESERVED");

      const marker = await readMarker();
      assert.equal(marker?.state, "SEALED");
      assert.equal(marker?.attempt_id, success.value.attemptId);
      const rows = await admin`
        SELECT u.email, u.role, u."emailVerified", u.banned, a.password
        FROM auth."user" AS u
        JOIN auth.account AS a ON a."userId" = u.id AND a."providerId" = 'credential'
        WHERE u.email = ANY(${emails})
      `;
      assert.equal(rows.length, 1, "contention creates no duplicate administrator");
      assert.deepEqual(
        { role: rows[0].role, verified: rows[0].emailVerified, banned: rows[0].banned, credentialed: Boolean(rows[0].password) },
        { role: "admin", verified: true, banned: false, credentialed: true },
      );
      await assert.rejects(() => coordinator.provision(newInput("replay")), (error: unknown) =>
        error instanceof AtlasBootstrapError && error.code === "BOOTSTRAP_SEALED");
      assert.equal((await admin`SELECT count(*)::integer AS count FROM auth."user" WHERE email = ANY(${emails})`)[0].count, 1);
    } finally {
      await service.close();
    }

    for (const phase of ["after-reserve", "after-identity-created", "before-seal"] as const) {
      await reset();
      const input = newInput(phase);
      const service = createAtlasAuth(configFor(databaseUrl!));
      try {
        const interrupted = createAtlasBootstrapCoordinator(service, {
          onPhase: (observed) => { if (observed === phase) throw new Error(`interrupt-${phase}`); },
        });
        await assert.rejects(() => interrupted.provision(input), /interrupt-/);
        const reserved = await readMarker();
        assert.deepEqual(
          { state: reserved?.state, email: reserved?.attempt_email, hasAttempt: Boolean(reserved?.attempt_id), userId: reserved?.initial_user_id },
          { state: "RESERVED", email: input.email, hasAttempt: true, userId: null },
          `${phase} leaves a durable, non-authorizing reservation`,
        );

        const created = await admin`SELECT count(*)::integer AS count FROM auth."user" WHERE email = ${input.email}`;
        assert.equal(created[0].count, phase === "after-reserve" ? 0 : 1);
        const reconciler = createAtlasBootstrapCoordinator(service);
        if (phase === "after-reserve") {
          await assert.rejects(() => reconciler.reconcile({ attemptId: reserved!.attempt_id! }), (error: unknown) =>
            error instanceof AtlasBootstrapError && error.code === "RECONCILIATION_UNVERIFIED");
        } else {
          const sealed = await reconciler.reconcile({ attemptId: reserved!.attempt_id! });
          assert.equal(sealed.state, "SEALED");
        }
      } finally {
        await service.close();
      }
    }

    await reset();
    const collision = newInput("collision");
    await admin`
      INSERT INTO auth."user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
      VALUES (${`aa003-unrelated-${suffix}`}, 'unrelated', ${collision.email}, true, 'user', now(), now())
    `;
    const collisionService = createAtlasAuth(configFor(databaseUrl!));
    try {
      const coordinator = createAtlasBootstrapCoordinator(collisionService);
      await assert.rejects(() => coordinator.provision(collision), (error: unknown) =>
        error instanceof AtlasBootstrapError && error.code === "EMAIL_COLLISION");
      assert.equal((await admin`SELECT role FROM auth."user" WHERE email = ${collision.email}`)[0].role, "user");

      let safeError = "";
      try {
        await coordinator.reconcile({ attemptId: "not-the-recorded-attempt" });
      } catch (error) {
        assert.ok(error instanceof AtlasBootstrapError);
        safeError = String(error);
      }
      assert.doesNotMatch(safeError, /not-a-real-secret/);
      assert.doesNotMatch(safeError, /bootstrap-coordinator/);
      const metadata = JSON.stringify(await readMarker());
      assert.doesNotMatch(metadata, /not-a-real-secret/);
    } finally {
      await collisionService.close();
    }
  } finally {
    await reset().catch(() => undefined);
    if (emails.length) await admin`DELETE FROM auth."user" WHERE email = ANY(${emails})`;
    await admin.end();
  }
});
