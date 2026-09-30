# CFC remediation: IDSER-008 / IDSER-BATCH-08

- **Original frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **Latest CK verification:** `IDSER-BATCH-08-8e0abca-verification.md`
- **HMN authorization consumed:** `HMN-IDSER-008-005`
- **Status:** `awaiting_review`

## Authorized-clause closure

| Frozen clause | Status | Evidence / command | Frozen oracle |
|---|---|---|---|
| `CK-001.a` | RESOLVED (preserved) | Existing `tests/perception-integration.test.ts` transient replay/source/stage outage recovery remains unchanged. | Preserved |
| `CK-001.b` | PROVEN | `reconciliation-acceptance.integration.test.ts` changes the active-stage fixture to actual `lifecycle='queued'`, then proves final acceptance rolls back and later valid acceptance/replay succeeds. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` passed. | PASS |
| `CK-001.c` | PROVEN | `perception-integration.test.ts` drives a real pg-boss worker through bounded retry exhaustion, grant-expiry delivery, and accepted completion followed by stale failure; it observes failed terminal states without trusted completion and completed authority state without regression. The existing stopped/restarted Compose reconciliation worker now proves its accepted completion rejects a stale terminal report and retains completed execution/member state. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` and the reconciliation command passed. | PASS |

## Validation

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — passed, 2/2.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db typecheck` — passed.

Internal readiness: READY_FOR_CK

This single bounded remediation consumes `HMN-IDSER-008-005`. IDSER-008 remains
`awaiting_review`; CK may verify only the original frozen residual clauses,
this remediation diff, and direct regressions.
