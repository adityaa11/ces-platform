# PERC-RESET-003 GO checkpoint — zero-visual and exact asset accounting

- **Ticket:** `PERC-RESET-003` — RUN-003 zero-visual validity and exact asset coverage
- **Batch:** `PERC-RESET`
- **Predecessor:** `PERC-RESET-002` is approved after independent CK `PASS` in `PERC-RESET-BATCH-02-9a0ef58-verification.md`.
- **Implementation base:** `23a6102471d3374558ed211e088e53cc2102cb5a`
- **Checkpoint state:** `BLOCKED`
- **Ancillary authorization:** `HMN-PERC-RESET-003-001` authorized one bounded terminating-guard type-safety correction in `packages/atlas-skills/src/provisional-relationship-packet.ts`; details and validation are recorded in `HMN-PERC-RESET-003-001-remediation.md`.
- **Blockers:** R3-03 through R3-05 still require database-backed qualification, but `DATABASE_URL` is unset. This HMN did not authorize starting Docker/PostgreSQL or using an existing database.

## Bounded implementation

- In `apps/agents-bridge/src/document-perception-worker.ts`, the visual-region loop copies each `region.locatorId` to a local, validates it as a nonempty string, then uses the narrowed local for page/locator uniqueness tracking. Invalid values continue to raise `BridgeProviderError("malformed_response", ...)`. No assertion, `any`, suppression, compiler setting, zero-visual flow, replay, derived-asset handoff, or Atlas acceptance behavior changed.
- Added focused worker assertions for wrong-page and extra descriptors, plus colliding returned asset references. Existing checks for missing, foreign-source, duplicate descriptors and zero-visual table/text behavior remain.
- `packages/atlas-db/src/perception-authority.ts` and the visual-bearing manifest/readback protections were not modified. The existing exact identity cache key, `derivedAssets=[]` handling for zero visuals, and staged terminal `perceived` path remain unchanged by this correction.
- No Docker, Compose, PostgreSQL setup, unrelated skills source, semantic work, or successor ticket was changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact validation and outcome | Status |
|---|---|---|---|---|---|
| R3-01 | `PERC-RESET-003` Binary review contract R3-01 | Text blocks with zero visual regions and zero descriptors normalize successfully with no derived-asset handoff calls | `apps/agents-bridge/tests/document-perception-worker.test.ts`, `RUN-003 accepts text and tables with zero visual regions without a derived-asset handoff` | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — exit 0; 12 passed, 0 failed, 0 skipped | `PROVEN` |
| R3-02 | `PERC-RESET-003` Binary review contract R3-02 | Tables with zero pictures remain structural output without forced visual evidence | Same worker test asserts retained table and `visualRegions=[]` | Same worker command — exit 0; 12 passed | `PROVEN` |
| R3-03 | `PERC-RESET-003` Binary review contract R3-03 | N captured visuals produce N unique page/locator-bound descriptors/references and exactly verified associated assets, without collision or cross-document mismatch | Worker mapping and collision assertions pass. Authority manifest, byte/hash, and readback behavior is covered by `packages/atlas-db/tests/derived-assets.integration.test.ts`, which requires PostgreSQL. `packages/atlas-db/src/perception-authority.ts` was unchanged. | `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` — exit 0; 2 passed. `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` — exit 0, 1 skipped because `DATABASE_URL` is unset; not a pass. | `BLOCKED_ENVIRONMENT` |
| R3-04 | `PERC-RESET-003` Binary review contract R3-04 | Missing descriptor/reference, foreign SHA, wrong page/locator, altered bytes, hash/length/media mismatch reject before accepted `perceived`, without silent dropping | Worker negative assertions cover missing, foreign, duplicate, wrong-page, and extra descriptors; collision rejection has its own test. Authority integrity and binding cases are in the DB integration harness, which did not execute. | Worker command — exit 0; 12 passed. `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` — exit 0; 2 passed. Derived-assets integration — exit 0, 1 skipped (no `DATABASE_URL`); not a pass. | `BLOCKED_ENVIRONMENT` |
| R3-05 | `PERC-RESET-003` Binary review contract R3-05 | Accepted result remains cached by exact RUN-003 identity with no semantic jobs or new source documents | Existing `apps/agents-bridge/tests/perception-integration.test.ts` observes `derived_assets=[]`, while DB-backed assertions cover cache and lifecycle. Both integration cases require a database. Relevant authority cache key and terminal branch were inspected and left unchanged. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — exit 0, 2 skipped because `DATABASE_URL` is unset; not a pass. | `BLOCKED_ENVIRONMENT` |

## Validation record

- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — **exit 0**, 12 passed, 0 failed, 0 skipped.
- `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` — **exit 0**, 2 passed, 0 failed, 0 skipped.
- `git diff --check` — **exit 0**, no whitespace diagnostics. `git status --short` was inspected; unrelated pre-existing tracked and untracked work remains untouched.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **exit 0**, no diagnostics after the authorized ancillary guard correction.
- `corepack pnpm --filter @atlas/db typecheck` — **exit 0**, no diagnostics.
- `corepack pnpm --filter @atlas/skills typecheck` — **exit 0**, no diagnostics; the nine TS18048/TS2345 errors are resolved.
- `corepack pnpm --filter @atlas/skills exec jiti tests/provisional-relationship-packet.test.ts` — **exit 0**, 3 passed, 0 failed, 0 skipped.
- Baseline source evidence: before remediation, the current file and both cited commit blobs had hash `9e59e08ec5b558d2841d2cd49daccf63e4d3abe3`. HMN-authorized change is limited to returning the existing `reject(...)` call from the missing-slot guard; error text and runtime rejection remain unchanged.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — **exit 0**, 12 passed, 0 failed, 0 skipped.
- `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` — **exit 0**, 2 passed, 0 failed, 0 skipped.
- `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` — **exit 0, 1 skipped** because `DATABASE_URL` is unset; skipped is not PASS.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — **exit 0, 2 skipped** because `DATABASE_URL` is unset; skipped is not PASS.
- `DATABASE_URL` is unset. No Docker or database setup was attempted, per the ticket continuation.
- `git diff --check` — **exit 0**, no whitespace diagnostics for the authorized correction and checkpoint.

## Handoff state

`Internal readiness: NOT_READY — BLOCKED_ENVIRONMENT`.

The worker and authorized ancillary type-safety corrections are complete, and the required typechecks and focused tests pass. Do not set `READY_FOR_CK` or `awaiting_review`: R3-03 through R3-05 still lack required database-backed observations. PostgreSQL qualification remains blocked pending separate authorization; no database environment was started or reused.
