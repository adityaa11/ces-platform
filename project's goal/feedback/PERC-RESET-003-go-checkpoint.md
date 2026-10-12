# PERC-RESET-003 GO checkpoint — zero-visual and exact asset accounting

- **Ticket:** `PERC-RESET-003` — RUN-003 zero-visual validity and exact asset coverage
- **Batch:** `PERC-RESET`
- **Predecessor:** `PERC-RESET-002` is approved after independent CK `PASS` in `PERC-RESET-BATCH-02-9a0ef58-verification.md`.
- **Implementation base:** `23a6102471d3374558ed211e088e53cc2102cb5a`
- **Checkpoint state:** `READY_FOR_CK`
- **Ancillary authorization:** `HMN-PERC-RESET-003-001` authorized one bounded terminating-guard type-safety correction in `packages/atlas-skills/src/provisional-relationship-packet.ts`; details and validation are recorded in `HMN-PERC-RESET-003-001-remediation.md`.
- **Qualification authorization:** `HMN-PERC-RESET-003-002` authorized isolated PostgreSQL qualification and narrowly scoped database-backed assertions.
- **Blockers:** None. Database-backed qualification ran against the isolated `hmn_perc_reset_003_002` database; resource identity, execution evidence, and cleanup are recorded in `HMN-PERC-RESET-003-002-qualification.md`.

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
| R3-03 | `PERC-RESET-003` Binary review contract R3-03 | N captured visuals produce N unique page/locator-bound descriptors/references and exactly verified associated assets, without collision or cross-document mismatch | `packages/atlas-db/tests/derived-assets.integration.test.ts` stages two RUN-003 visual descriptors; checks distinct immutable refs, exact persisted manifest page/locator/hash/length/media bindings with verified and accepted timestamps, restart replay, and durable byte readback for each. | `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` — exit 0; 1 passed, 0 failed, 0 skipped. | `PROVEN` |
| R3-04 | `PERC-RESET-003` Binary review contract R3-04 | Missing descriptor/reference, foreign SHA, wrong page/locator, altered bytes, hash/length/media mismatch reject before accepted `perceived`, without silent dropping | Worker tests reject missing/foreign/duplicate descriptors, wrong page, extras, and colliding refs. The DB suite rejects missing assetRef, foreign result/asset source SHA, duplicate reference, wrong page/locator, altered bytes, hash/length/media mismatch, invalid grant, and bad storage readback; each rejected delivery leaves staged manifests unaccepted. | Worker: `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — exit 0; 12 passed, 0 skipped. DB: derived-assets command above — exit 0; 1 passed, 0 skipped. | `PROVEN` |
| R3-05 | `PERC-RESET-003` Binary review contract R3-05 | Accepted result remains cached by exact RUN-003 identity with no semantic jobs or new source documents | `apps/agents-bridge/tests/perception-integration.test.ts` uses offline synthetic Docling-shaped text/table content and exact identity `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; asserts persisted normalized content, `derived_assets=[]`, completed execution, staged member `perceived`, zero semantic executions/background jobs, unchanged source-document count, and idempotent repeated delivery. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — exit 0; 2 passed, 0 failed, 0 skipped. | `PROVEN` |

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

## HMN-PERC-RESET-003-002 isolated database qualification

- Database endpoint used only by the qualification processes: `postgresql://hmn_perc_003_002_admin:<redacted>@127.0.0.1:55437/hmn_perc_reset_003_002`. A direct PostgreSQL identity query returned database `hmn_perc_reset_003_002` and user `hmn_perc_003_002_admin`; the port was bound to localhost only.
- Docker identities recorded before migration: container `hmn-perc-reset-003-002-pg` (`8cfeed6e2cb93610ca6ef15b6d41f43fc0966b2a0e1fe600173daad01b2efe8a`), volume `hmn-perc-reset-003-002-data`, network `hmn-perc-reset-003-002-net` (`988ff995a8ada03622c5fd9ae0276ed1ba10ffa00b81a8d0811ea138d3ad55e9`), image `postgres:18-alpine` (`sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`). Container mapping was `127.0.0.1:55437:5432`; all created resources carried the HMN authorization label.
- `corepack pnpm --filter @atlas/db migrate` — exit 0; all 25 migrations (`0000`–`0024`) applied. `corepack pnpm --filter @atlas/db migration:check` — exit 0.
- Bridge pg-boss bootstrap, using the isolated database as `agents_bridge` — exit 0; `pgboss.job` and `pgboss.version` confirmed.
- Required database-backed suites: `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` — exit 0, 1 passed, 0 failed, 0 skipped; `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — exit 0, 2 passed, 0 failed, 0 skipped.
- Focused contract evidence: `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — exit 0, 12 passed, 0 failed, 0 skipped; `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` — exit 0, 2 passed, 0 failed, 0 skipped.
- The first bridge-suite attempt exposed a test fixture defect: fault-injection sequences were created in `public` but referenced in `atlas`. The test now creates and drops those sequences in `atlas`. Its synthetic zero-visual fixture initially used the legacy bundle policy and reached `extracting`; setting the test bundles to the existing `staged-fair-local-v1` policy exercised the required `perceived` terminal path. Final required suite runs pass. No production code was changed.
- The complete qualification record was saved in `HMN-PERC-RESET-003-002-qualification.md` before resource disposal. The exact three labeled Docker resources were removed after identity/label checks, and final inventories confirmed all three absent; unrelated Docker resources were untouched.

## Handoff state

`Internal readiness: READY_FOR_CK`.

R3-01 through R3-05 have positive and negative evidence at their required worker and database-backed seams. Both required database qualification suites completed with zero failures and zero skips; the migration check and pg-boss bootstrap passed. The qualification record was preserved before the isolated PostgreSQL resources were removed and their absence verified. No production correction was required. This is a GO handoff only, not a CK result or PASS.
