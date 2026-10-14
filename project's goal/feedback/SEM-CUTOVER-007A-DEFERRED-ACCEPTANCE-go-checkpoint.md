# GO checkpoint: SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE

Ticket: `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`
Batch: `SEM-CUTOVER`
HMN authorization: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-002`
State: `awaiting_review`
Scope: qualified deferred semantic acceptance prerequisite only; the main `SEM-CUTOVER-007A` remains forbidden pending independent CK.

## B2 historical test-contract realignment

| Historical IDSER-006 expectation | Supersession reason | Preserved current proof |
| --- | --- | --- |
| Direct legacy perception admission creates an extraction execution and durable semantic job. | IDSER-012 deliberately rejects legacy direct admission; the approved staged admission route deliberately ends at `perceived`. | `IDSER-012-01-01` staged-admission integration proves staged admission and legacy rejection. The repaired `IDSER-006 reconciles one explicitly authorized extraction execution atomically` test seeds only an explicitly authorized, source/context-bound semantic extraction execution, then proves PostgreSQL materialization, transactional pg-boss rollback, replay, idempotence, and exactly one reconciliation job. |

No production perception-admission route, staged-admission behavior, D1 scheduling, REL-03 behavior, or reconciliation semantics was changed by this realignment.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation command | Status |
| --- | --- | --- | --- |
| `RC-DA-01` | Authenticated, live execution-scope-bound qualified route; identical-input idempotence; foreign, stale, cancelled, and changed-fingerprint inputs leave no acceptance effects. | `pnpm --filter @atlas/db test:qualified-deferred-acceptance` — authenticated route denial, scope mismatch, stale/cancelled denial, exact replay, changed-composite conflict, and zero-effect assertions. | **PROVEN** |
| `RC-DA-02` | Canonical inventory plus qualified deferred coverage partitions eligible normalized locators exactly once; malformed, duplicate/overlap, unknown, missing, and unqualified coverage reject atomically. | `pnpm --filter @atlas/db test:qualified-deferred-acceptance` — partial positive and atomic malformed-coverage matrix. | **PROVEN** |
| `RC-DA-03` | Partial acceptance persists hashes and deferred coverage; materializes only supported canonical rows and creates one permitted reconciliation continuation. | `pnpm --filter @atlas/db test:qualified-deferred-acceptance` — persisted identity/coverage, one candidate/evidence/index, one reconciliation execution and one handoff, replay/conflict invariant. | **PROVEN** |
| `RC-DA-04` | Fully deferred acceptance persists reviewable deferral and creates zero Semantic V1 result/candidate/evidence/index/reconciliation/job/Master/publication effects. | `pnpm --filter @atlas/db test:qualified-deferred-acceptance` — terminal fully-deferred fixture asserts deferred record and zero-effect count vector. | **PROVEN** |
| `RC-DA-05` | Qualified deferral is distinct from technical failure and `ready_for_review`; mixed bundles remain processing, while terminal deferred bundles keep Draft/Master unchanged. | `pnpm --filter @atlas/db test:qualified-deferred-acceptance`; `node --test apps/atlas/tests/home-projects.test.mjs` — terminal and mixed lifecycle assertions plus deferred-review card projection. | **PROVEN** |
| `RC-DA-06` | Full-canonical extraction/reconciliation behavior remains unchanged, including atomic rollback/replay/idempotence and one durable reconciliation handoff. | `pnpm --filter @atlas/db test:extraction-acceptance` — 2/2 pass. The repaired real-queue test proves rollback leaves zero extraction/job effects and successful retry creates exactly one pg-boss reconciliation job. | **PROVEN** |

## Validation evidence

The local isolated PostgreSQL environment was loaded from the existing local `.env` without printing credentials, then the following commands completed successfully:

```powershell
pnpm --filter @atlas/db typecheck
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db test:extraction-acceptance
pnpm --filter @atlas/db test:staged-perception-admission
pnpm --filter @atlas/db test:qualified-deferred-acceptance
node --test apps/atlas/tests/home-projects.test.mjs
```

Outcomes: typecheck passed; migration check passed; extraction acceptance `2/2`; staged admission `2/2`; deferred acceptance `4/4`; home lifecycle projection `5/5`.

Internal readiness: `READY_FOR_CK`.
