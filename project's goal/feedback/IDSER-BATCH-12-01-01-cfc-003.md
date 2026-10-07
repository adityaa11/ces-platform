# CFC remediation: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Source CK artifact:** `IDSER-BATCH-12-01-01-a9dc0c3-verification.md`
- **Remediation base:** `a9dc0c3288c537a58fda2fb21349cc69837032ea`
- **HMN authorization consumed:** `HMN-IDSER-012-01-01-005` (`AUTHORIZE_NEXT_CFC`)
- **State:** `awaiting_review`

## Closure matrix

| Frozen clause | Status | Closure evidence |
| --- | --- | --- |
| `CK-001.a` | PROVEN | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` holds two non-terminal queued perception executions before concurrent reconciliation delivery. The staged continuation remains `pending` and has zero successor executions while capacity is occupied. After both permits are terminal, the fixture marks the competing foreign bundle as already served, so the durable never-served ordering deterministically admits this continuation through `admitStagedInTransaction`. The frozen oracle passed. |

The fixture correction does not change admission, lifecycle, permit policy, or
worker behavior. It makes the already-required post-capacity observation
deterministic when two pending bundles exist: the foreign bundle has a prior
turn, while the reconciliation continuation remains never served.

Resolved `CK-001.b` through `CK-001.f` were not reopened or changed.

## Validation

| Command / evidence | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/db typecheck` | PASS |
| `DATABASE_URL=<fresh isolated PostgreSQL> corepack pnpm --filter @atlas/db migration:check` | PASS |
| `DATABASE_URL=<fresh isolated PostgreSQL> AGENTS_BRIDGE_DATABASE_URL=<fresh isolated PostgreSQL as agents_bridge> ATLAS_APP_PASSWORD=<local test credential> node --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test --test-force-exit --test-reporter spec packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` | Direct `CK-001.a` saturation and refill assertions PASS. The command then reaches the previously recorded Windows shutdown limitation in `stopComposeReconciliationWorker`: `null !== 0`. No worker or process-shutdown behavior was changed. |
| `git diff --check` | PASS |

## Direct regression boundary

Only the frozen reconciliation continuation fixture's fair-ordering setup and
its CFC evidence changed. No production source, migration, worker/process
shutdown behavior, lifecycle semantics, or resolved clause changed.

## Internal readiness

`Internal readiness: READY_FOR_CK`

The authorized `CK-001.a` closure oracle has direct, deterministic evidence.
The only command limitation is the previously recorded Windows shutdown result,
which is outside this remediation diff and does not replace the oracle. This
checkpoint does not issue `PASS`; CK must verify the frozen clause, this
bounded diff, and the recorded limitation independently.
