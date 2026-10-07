# CFC progress: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Source CK artifact:** `IDSER-BATCH-12-01-01-6d2e733-review.md`
- **Reviewed base:** `6d2e73300e2e43500a40218ee93db4944eadd311`
- **State:** `CFC_NOT_READY_FOR_CK`

## Working closure view

| Frozen clause | Status | Evidence / result |
| --- | --- | --- |
| `CK-001.a` | PROVEN | `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` now creates an explicit legacy bundle and verifies the historical direct admission entry point rejects it, so it cannot bypass the staged two-permit authority. |
| `CK-001.b` | PROVEN | The same isolated PostgreSQL fixture creates two concurrent production projects through `PostgresAtlasProjectRepository.create`, then creates a third saturated project and asserts its durable pending member has zero execution, source grants, and pg-boss jobs. |
| `CK-001.c` | PROVEN | The fixture uses separate concurrent repository creates plus concurrent refill transactions after an authority re-instantiation; it observes exactly two non-terminal executions, distinct members, and monotonic durable turns. |
| `CK-001.d` | IMPLEMENTED_UNPROVEN | Existing A(4)/B(5)/C(2), lowest-sequence, and lone-A evidence remains passing, and the new fixture proves a restart/concurrent refill. It does not yet make the required A/B/C fairness sequence itself concurrent across the restart probe. |
| `CK-001.e` | PROVEN | The fixture uses `createTransactionalPerceptionQueueProducer`, checks exactly one persisted grant and pg-boss job plus redacted queued payload on success, and forces a post-enqueue trigger failure to prove no project, execution, grant, or job survives rollback. |
| `CK-001.f` | BLOCKED_AUTHORITY | `apps/agents-bridge/tests/idser-010-compose.mjs` is a predecessor full-lifecycle harness that waits for `ready_for_review`. The frozen ticket expressly makes this staged cutover stop before Ready-for-Review and prohibits changing that lifecycle. The CK artifact itself identifies selecting a legacy compatibility fixture or a staged-compatible regression as a planning/authority choice. No ticket-authorized choice exists to change this oracle. |

## Commands and observations

```text
corepack pnpm --filter @atlas/db typecheck                         PASS
DATABASE_URL=<disposable PostgreSQL> corepack pnpm --filter @atlas/db test:staged-perception-admission  PASS (2/2)
corepack pnpm --filter @atlas/core test                            PASS
corepack pnpm --filter @atlas/agents-bridge typecheck              PASS
DATABASE_URL=<disposable PostgreSQL> corepack pnpm --filter @atlas/db migration:check  PASS
```

`test:project-repository` retains the historical immediate-D1 assertion and is not valid evidence for the staged cutover; its conflict is the same unresolved authority issue as `CK-001.f`.

## Internal readiness

`CFC_NOT_READY_FOR_CK`. No remediation commit or CK handoff was created. A planning/HMN decision is required to select the frozen ticket's permitted IDSER-010 compatibility or staged-regression arrangement, and the A/B/C restart-concurrency oracle remains to be completed within the current CFC scope.
