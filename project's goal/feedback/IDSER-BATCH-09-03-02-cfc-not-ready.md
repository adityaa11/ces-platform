# CFC progress: IDSER-009-03-02 / IDSER-BATCH-09-03-02

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Source CK artifact:** `IDSER-BATCH-09-03-02-746ba16-review.md`
- **Remediation base:** `746ba16fb734ae1dd245172cc6d0edb27746365b`
- **State:** `CFC_NOT_READY_FOR_CK`

## Working progress view

| Frozen clause | Status | Evidence location and command | Frozen oracle result |
|---|---|---|---|
| CK-001.a | PROVEN | `packages/atlas-db/src/perception-authority.ts` now requires a matching D1 member and its scope-matched bundle in the redemption transaction. `packages/atlas-db/tests/perception-authority.integration.test.ts` creates a valid scoped D1 pair, then proves a separately valid but unbound grant is rejected and its execution state is unchanged. `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck && corepack pnpm --filter @atlas/db test:perception-authority'` passed (1/1). | PASS for the no-matching-member branch; the transaction rejects before changing execution or lifecycle state. |
| CK-002.a | IMPLEMENTED_UNPROVEN | Existing route checks remain insufficient for the frozen complete table-driven negative matrix and before/after target-plus-unrelated lifecycle snapshots. | Not yet proven. |
| CK-002.b | IMPLEMENTED_UNPROVEN | Existing perception integration seeds rows directly and does not pause `agents-bridge-worker`, create through the real authenticated owner route, or assert the two production-card labels for the same project. | Not yet proven. |

## Validation

- The required focused DB typecheck and authority integration command above passed in Compose.
- The host-local equivalents could not run because workspace dependencies are not installed (`tsc` and `jiti` unavailable); the Compose command is the ticket-required environment and supplied the passing evidence.
- `apps/agents-bridge/tests/perception-integration.test.ts` was aligned with the corrected contract by creating the scoped D1 lifecycle fixture before redemption. Its focused Compose command has not reached a recorded test result in this execution window, so it is not counted as proof.

## Readiness

Internal readiness: `CFC_NOT_READY_FOR_CK`.

The partial in-scope implementation is intentionally left uncommitted. No CFC checkpoint was marked `awaiting_review`, no remediation commit was created, and no CK handoff is authorized until CK-002.a and CK-002.b have their frozen-oracle evidence.
