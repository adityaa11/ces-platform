import type { Sql } from "postgres";
import type { createAtlasAuth } from "./index.js";

const BOOTSTRAP_KEY = "atlas-platform-super-admin";

export type AtlasBootstrapPhase = "after-reserve" | "after-identity-created" | "before-seal";
export type AtlasBootstrapResult = Readonly<{ attemptId: string; state: "SEALED" }>;

export class AtlasBootstrapError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "AtlasBootstrapError";
    // This boundary deliberately exposes only a stable, operator-safe code.
    // Callers must not receive internal paths, SQL, or provider stack details.
    this.stack = undefined;
  }
}

export type AtlasBootstrapCoordinator = Readonly<{
  provision(input: Readonly<{ email: string; name: string; password: string }>): Promise<AtlasBootstrapResult>;
  reconcile(input: Readonly<{ attemptId: string }>): Promise<AtlasBootstrapResult>;
}>;

type AtlasAuthService = ReturnType<typeof createAtlasAuth>;
type BootstrapRecord = Readonly<{
  state: "UNINITIALIZED" | "RESERVED" | "SEALED";
  attempt_id: string | null;
  attempt_email: string | null;
  initial_user_id: string | null;
}>;
type VerifiedIdentity = Readonly<{ id: string }>;

export type AtlasBootstrapCoordinatorOptions = Readonly<{
  /** Test-only deterministic interruption seam. It never runs in production. */
  onPhase?: (phase: AtlasBootstrapPhase) => Promise<void> | void;
}>;

const fail = (code: string): never => { throw new AtlasBootstrapError(code); };

function asRecord(rows: readonly BootstrapRecord[]): BootstrapRecord {
  const record = rows[0];
  if (!record) fail("BOOTSTRAP_MARKER_MISSING");
  return record;
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) fail("INVALID_EMAIL");
  return normalized;
}

async function assertReconciliationSafe(sql: Sql): Promise<void> {
  // AA-001 owns this fail-closed check for a missing marker plus an existing
  // admin identity. Calling it before every reservation preserves that fence.
  try {
    await sql`SELECT atlas.assert_admin_bootstrap_reconciliation_safe()`;
  } catch {
    fail("BOOTSTRAP_CONFLICT");
  }
}

async function readVerifiedIdentity(sql: Sql, email: string, expectedUserId?: string | null): Promise<VerifiedIdentity | null> {
  const rows = await sql<VerifiedIdentity[]>`
    SELECT u.id
    FROM auth."user" AS u
    WHERE u.email = ${email}
      AND u.role = 'admin'
      AND u."emailVerified" = true
      AND u.banned = false
      AND (${expectedUserId ?? null}::text IS NULL OR u.id = ${expectedUserId ?? null})
      AND EXISTS (
        SELECT 1
        FROM auth.account AS a
        WHERE a."userId" = u.id
          AND a."providerId" = 'credential'
          AND a.password IS NOT NULL
      )
  `;
  return rows[0] ?? null;
}

async function reserveAttempt(sql: Sql, attemptId: string, email: string): Promise<void> {
  await sql.begin(async (transaction) => {
    await assertReconciliationSafe(transaction);
    const marker = asRecord(await transaction<BootstrapRecord[]>`
      SELECT state, attempt_id, attempt_email, initial_user_id
      FROM atlas.admin_bootstrap_state
      WHERE bootstrap_key = ${BOOTSTRAP_KEY}
      FOR UPDATE
    `);

    if (marker.state === "SEALED") fail("BOOTSTRAP_SEALED");
    if (marker.state === "RESERVED") fail("BOOTSTRAP_RESERVED");

    const existingAdmin = await transaction<{ id: string }[]>`
      SELECT id FROM auth."user" WHERE role = 'admin' LIMIT 1
    `;
    if (existingAdmin[0]) fail("BOOTSTRAP_CONFLICT");

    const existingEmail = await transaction<{ id: string }[]>`
      SELECT id FROM auth."user" WHERE email = ${email} LIMIT 1
    `;
    if (existingEmail[0]) fail("EMAIL_COLLISION");

    await transaction`
      UPDATE atlas.admin_bootstrap_state
      SET state = 'RESERVED', attempt_id = ${attemptId}, attempt_email = ${email}, reserved_at = now()
      WHERE bootstrap_key = ${BOOTSTRAP_KEY} AND state = 'UNINITIALIZED'
    `;
  });
}

async function sealVerifiedAttempt(sql: Sql, attemptId: string): Promise<AtlasBootstrapResult> {
  return sql.begin(async (transaction) => {
    const marker = asRecord(await transaction<BootstrapRecord[]>`
      SELECT state, attempt_id, attempt_email, initial_user_id
      FROM atlas.admin_bootstrap_state
      WHERE bootstrap_key = ${BOOTSTRAP_KEY}
      FOR UPDATE
    `);
    if (marker.state === "SEALED") fail("BOOTSTRAP_SEALED");
    const attemptEmail = marker.attempt_email;
    if (!attemptEmail) throw new AtlasBootstrapError("ATTEMPT_MISMATCH");
    if (marker.state !== "RESERVED" || marker.attempt_id !== attemptId) throw new AtlasBootstrapError("ATTEMPT_MISMATCH");

    const identity = await readVerifiedIdentity(transaction, attemptEmail, marker.initial_user_id);
    if (!identity) throw new AtlasBootstrapError("RECONCILIATION_UNVERIFIED");
    const userId = identity.id;

    await transaction`
      UPDATE atlas.admin_bootstrap_state
      SET state = 'SEALED', initial_user_id = ${userId}, sealed_at = now()
      WHERE bootstrap_key = ${BOOTSTRAP_KEY}
        AND state = 'RESERVED'
        AND attempt_id = ${attemptId}
    `;
    return { attemptId, state: "SEALED" };
  });
}

/**
 * Private infrastructure-only coordinator for the one non-atomic bootstrap
 * attempt. It exposes no HTTP handler and delegates identity/credential work
 * entirely to Better Auth's installed server-side admin API.
 */
export function createAtlasBootstrapCoordinator(
  service: AtlasAuthService,
  options: AtlasBootstrapCoordinatorOptions = {},
): AtlasBootstrapCoordinator {
  const sql = service.sql;

  return {
    async provision(input) {
      const email = normalizeEmail(input.email);
      if (!input.name.trim()) fail("INVALID_NAME");
      if (!input.password) fail("INVALID_PASSWORD");
      const attemptId = crypto.randomUUID();

      await reserveAttempt(sql, attemptId, email);
      await options.onPhase?.("after-reserve");

      try {
        await service.auth.api.createUser({
          body: {
            email,
            name: input.name.trim(),
            password: input.password,
            role: "admin",
            // Trusted infrastructure provisioning must be immediately eligible
            // for the normal Better Auth sign-in flow; this is persisted by
            // Better Auth's own server-side create-user path.
            data: { emailVerified: true },
          },
        });
      } catch {
        // The reservation is deliberately retained. A failed/ambiguous
        // provider call must never trigger another identity creation attempt.
        fail("PROVISIONING_FAILED");
      }

      await options.onPhase?.("after-identity-created");
      await options.onPhase?.("before-seal");
      return sealVerifiedAttempt(sql, attemptId);
    },

    async reconcile(input) {
      if (!input.attemptId) fail("ATTEMPT_MISMATCH");
      // No provisioning API is called here: reconciliation can only verify and
      // seal the original durable reservation, otherwise it fails closed.
      return sealVerifiedAttempt(sql, input.attemptId);
    },
  };
}
