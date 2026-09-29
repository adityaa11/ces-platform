# CFC remediation: IDSER-008 / IDSER-BATCH-08

- **Ticket:** IDSER-008 bundle completion and failure lifecycle
- **Frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **HMN authorization consumed:** `HMN-IDSER-008-003`
- **Status:** `awaiting_review`

## Closure evidence

| Frozen clause | Status | Evidence and executed command | Frozen oracle |
|---|---|---|---|
| CK-001.a | PROVEN | `document-perception-worker.ts` keeps Atlas source unavailability and replay load/stage faults in pg-boss retry; terminal provider failures report only on the final attempt. `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` passed (5/5). | PASS |
| CK-001.b | PROVEN | `reconciliation-acceptance.ts` rechecks the final candidate/extraction scope and evidence document/normalized locator. `reconciliation-acceptance.integration.test.ts` independently injects wrong extraction scope, wrong evidence document, missing locator, and an outside authorized reference; each rolls back before valid replay-safe acceptance. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` passed (1/1). | PASS |
| CK-001.c | PROVEN | The Compose acceptance test preserves the existing restart, reconciliation, replay, and stale-reference race coverage; the perception worker unit proves retryable source/replay behavior and bounded terminal timeout classification. Commands above passed. | PASS |

## Direct regressions

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `corepack pnpm --filter @atlas/db typecheck` — passed.
- `git diff --check` — passed.

Internal readiness: READY_FOR_CK

This is the one bounded remediation checkpoint consuming `HMN-IDSER-008-003`. CK must verify only the frozen clauses, this remediation diff, and direct regressions.
