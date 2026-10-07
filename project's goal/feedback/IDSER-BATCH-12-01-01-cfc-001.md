# CFC remediation: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Source CK artifact:** `IDSER-BATCH-12-01-01-6d2e733-review.md`
- **Remediation base:** `6d2e73300e2e43500a40218ee93db4944eadd311`
- **HMN authorization consumed:** `HMN-IDSER-012-01-01-001` (`CONTINUE_CURRENT_CFC`)
- **State:** `awaiting_review`

## Closure matrix

| Frozen clause | Status | Closure evidence |
| --- | --- | --- |
| `CK-001.a` | PROVEN (preserved) | The staged-admission fixture creates an explicit legacy bundle and verifies the historical direct-admission entry point rejects a new legacy admission. The implementation preserves idempotent replay before applying that guard. |
| `CK-001.b` | PROVEN (preserved) | The isolated PostgreSQL fixture performs concurrent production repository creation, then proves a saturated third project persists a pending member with zero execution, grant, and pg-boss job. |
| `CK-001.c` | PROVEN (preserved) | The same isolated fixture observes exactly two non-terminal executions, distinct admitted members, and monotonic durable turns across concurrent production creation and refill. |
| `CK-001.d` | PROVEN | `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` now re-instantiates the authority after the initial A/B permits complete, races two refill transactions, and asserts the durable fair-turn selection remains C then A (with the original A(4)/B(5)/C(2), lowest-sequence, and lone-A borrowing observations retained). The frozen fairness oracle passed. |
| `CK-001.e` | PROVEN (preserved) | The real transactional pg-boss producer proof remains passing: one grant/job on success, no payload storage path, and no durable effects after forced rollback. |
| `CK-001.f` | PROVEN | `apps/agents-bridge/tests/idser-010-compose.mjs --staged-regression`, reached by `test:idser-010-compose`, creates two clean projects via the production API. It records distinct project/bundle/document identities, one isolated perception execution/grant/job each, staged pending/perception state, and zero obsolete IDSER-010 semantic/replay jobs or executions. The frozen staged-compatible regression oracle passed without restoring immediate-D1 or `ready_for_review`. |

## Commands and results

```text
DATABASE_URL=<isolated PostgreSQL> corepack pnpm --filter @atlas/db migration:check                                  PASS
DATABASE_URL=<isolated PostgreSQL> corepack pnpm --filter @atlas/db test:permissions                                   PASS
DATABASE_URL=<isolated PostgreSQL> corepack pnpm --filter @atlas/db test:perception-authority                          PASS
DATABASE_URL=<isolated PostgreSQL> node --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test \
  --test-force-exit --test-reporter spec packages/atlas-db/tests/staged-perception-admission.integration.test.ts         PASS (2/2)
corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose                                                      PASS (staged Compose regression)
corepack pnpm --filter @atlas/db typecheck                                                                              PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                                                   PASS
corepack pnpm --filter @atlas/core test                                                                                 PASS
git diff --check                                                                                                        PASS
```

## Internal readiness

All authorized frozen closure oracles are proven and the direct source-authority regression is passing.

`Internal readiness: READY_FOR_CK`
