# GO checkpoint: IDSER-012-03-01-03 / IDSER-BATCH-12-03-01-03

- **Ticket:** `IDSER-012-03-01-03` — Background accepted-document read via BSS-V2-007
- **Batch:** `IDSER-BATCH-12-03-01-03`
- **State:** `awaiting_review`
- **Implementation commit:** `719b9d121340a5388805d284d6263c2a549a6790` (`feat(idser): authorize background document redemption`)
- **Dependencies consumed:** CK `PASS` for `IDSER-012-03-01-01`, `IDSER-012-03-01-02`, and `BSS-V2-007` only. `BSS-V2-008`, GHR delivery, an HTTP route, a planner worker, and all `-03-02` work remain outside this batch.

## Bounded implementation

`PostgresAcceptedSemanticBatchPlanDocumentResolver` now has a server-composed
`resolveBackground(input)` entry point. Its parameterized selector derives
project, workspace, bundle, and document scope from the accepted execution /
member / bundle / document / cache join, without a session, project membership,
caller user, or caller-selected scope. It shares the existing post-lookup
normalized-document and accepted-media validator with interactive `resolve`.

The persisted integration fixture composes the accepted BSS-V2-007 boundary
with the existing strict canonical parser and this background resolver. It
does not add an Atlas route, Bridge-to-Atlas network call, producer identity,
GHR issue/receipt/acknowledgement, worker, database role, migration, source
grant, provider call, or semantic/publication effect.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-012030103-01` | BSS-V2-007 authenticates the configured Bridge credential before canonical five-field parsing or Atlas redemption; wrong/missing credentials have zero parser/resolver calls. | `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts`: `createInternalReceivingBoundary` wraps `parseSemanticBatchPlanInputV1` and `resolveBackground`; active parser/resolver counters remain zero for missing and wrong credentials. | `corepack pnpm --filter @atlas/db test:semantic-batch-plan-input` — PASS, 1 test, 0 failures/skips. | `PROVEN` |
| `RC-012030103-02` | An actual accepted persisted document resolves after interactive session expiry, while interactive `resolve` still rejects that expired session. | Same PostgreSQL fixture first redeems through interactive `resolve`, expires the session and observes its rejection, then observes a successful BSS-wrapped `resolveBackground` with the same bounded result. | `corepack pnpm --filter @atlas/db test:semantic-batch-plan-input` — PASS, 1 test, 0 failures/skips. | `PROVEN` |
| `RC-012030103-03` | Scope comes only from joined persisted rows; source/hash, cache ref, fingerprint, execution/cross-document substitution, parser version, cache invalidation, cancellation, unaccepted member, nonprocessing bundle, and missing/foreign media fail closed. | `resolveBackground` selector in `packages/atlas-db/src/semantic-batch-plan-input.ts`; the persisted fixture mutates each named condition, includes a second accepted foreign document for execution substitution, and observes redacted rejection. | `corepack pnpm --filter @atlas/db test:semantic-batch-plan-input` — PASS, 1 test, 0 failures/skips. | `PROVEN` |
| `RC-012030103-04` | One shared normalized/media acceptance validator returns the existing bounded `AcceptedDocumentPlannerResultV1`; no duplicate resolver, fake REL, source grant, storage path/bytes, or Bridge SQL access. | `resolveAcceptedDocument` is used by both entries in `semantic-batch-plan-input.ts`; fixture asserts exact interactive/background equality, authoritative scope, bounded source/media, and `rel: { state: "unavailable" }`. | `corepack pnpm --filter @atlas/db typecheck` — PASS; focused integration — PASS. | `PROVEN` |
| `RC-012030103-05` | BSS boundary plus true PostgreSQL acceptance has a non-inert positive path; positive/rejected reads cause zero GHR dispatch, planner publication, BSS admission/attempt/reservation, provider/SEM, reconciliation, cache, asset, or accepted-manifest mutation. Historical `-01-02` proof remains intact. | The existing real PostgreSQL RUN-003 fixture records active before/after counters for `pgboss.job`, Bridge admission/attempt/reservation/dispatch tables, and the accepted document’s cache/asset/media/semantic/index/reconciliation rows. | `corepack pnpm --filter @atlas/db test:semantic-batch-plan-input` — PASS, 1 test, 0 failures/skips. | `PROVEN` |

## Validation

The repository-owned Compose PostgreSQL service was healthy on an isolated
local port after the default host port was occupied by a separate project.
No external database was used as evidence.

```text
PowerShell: $env:POSTGRES_PORT='5433'; docker compose up -d postgres
docker compose ps postgres                                  PASS (healthy)
docker compose run --rm --no-deps atlas-migrate             PASS (up to date)
corepack pnpm --filter @atlas/db migration:check            PASS
corepack pnpm --filter @atlas/db typecheck                  PASS
PowerShell (repository .env with DATABASE_URL host port set to 5433):
  corepack pnpm --filter @atlas/db test:semantic-batch-plan-input
                                                          PASS (1 test, 0 failures, 0 skips)
git diff --check 719b9d12^ 719b9d12                        PASS
```

Internal readiness: READY_FOR_CK. This checkpoint is not a CK `PASS`; control
returns to CK for independent review of the frozen ticket.
