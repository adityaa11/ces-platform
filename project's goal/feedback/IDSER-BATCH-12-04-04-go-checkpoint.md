# GO checkpoint: IDSER-012-04-04 / IDSER-BATCH-12-04-04

- **Ticket:** `IDSER-012-04-04` — Immutable v2 plan and handoff persistence.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-04-immutable-v2-plan-handoff-persistence.md`.
- **Dependency consumed:** `IDSER-012-04-03` CK `PASS` in `IDSER-BATCH-12-04-03-f6a1c64-verification.md`.
- **Implementation commit:** `0c6300f2` (`feat(idser): persist immutable semantic corpus v2 plans`).
- **Ticket state:** `awaiting_review`.

## Bounded implementation

Added independent, strict `ImmutableSemanticCorpusPlan/v2` and
`PlannedSemanticCorpusHandoff/v2` canonicalization and parsing over the
existing Atlas immutable parent/child tables and transaction boundary. A v2
parent persists only source/provenance references, aggregate BSS identity, and
locator inventory. Each child persists its deterministic slot, authorized
owned/context locators, packet/profile/estimator/configuration identities,
`ConservativeLogicalRequestBytes/v1`, complete bytes, separate input and
reserved-output tokens, envelope, bounded fit trace, and packet SHA-256.

Unknown fields, payload-shaped fields, malformed hashes, malformed locators,
duplicate/incomplete eligible ownership, invalid slot/order, invalid final-fit
accounting, foreign/stale source binding, and mismatched v2 replan ancestry
fail closed. The repository dispatches v2 explicitly while retaining the v1
canonicalizer, hashes, persistence behavior, and record dispatch unchanged.
No migration, parallel store, GHR output, outbox, BSS runtime work,
reservation/send, SEM call, semantic acceptance, reconciliation, Master, or
CES behavior was added. Existing local migrations `0085` and `0086` were
applied only to the disposable local validation database because it was behind
the repository; no new migration was needed for v2 JSONB records.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120404-01` | Strict v2 parent/child canonicalizers/parsers must reject invalid binding, field sets, hashes, locators, coverage, order, and accounting. | `immutable-semantic-corpus-plan.ts` exposes strict v2 input, parent-record, and handoff-record parsing; `immutable-semantic-corpus-plan-v2.test.ts` covers unknown/raw fields, hashes, coverage, final-fit accounting, and version failure. | `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS** (3 tests). | `PROVEN` |
| `RC-0120404-02` | One approved proposal must create exactly one parent and N immutable handoffs; replay, conflict, cancellation, rollback/crash, and replan preserve prior records. | `PostgresImmutableSemanticCorpusPlanRepository.persistV2()` reuses the authorized scoped lock and transaction. The PostgreSQL test proves concurrent replay, exact 1/N rows, append-only cancellation/replan, immutable update rejection, and a controlled child-insert crash with zero surviving parent/child rows. | `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS** (7 tests). | `PROVEN` |
| `RC-0120404-03` | v1 must retain original parser, hashes, and behavior; v2 must dispatch independently; unknown versions fail; no historical record rewrite. | v1 functions were left intact. The v2 unit suite replays v1 canonical content, dispatches both record versions, and rejects v3; PostgreSQL coverage proves immutable-update rejection and v2 replan append-only behavior. | V2 unit command above — **PASS**. PostgreSQL command above — **PASS**. | `PROVEN` |
| `RC-0120404-04` | Persistence must contain references/hashes/metadata only and have zero prohibited downstream effects. | V2 parent has no packet/payload/media fields; child stores a packet hash only. PostgreSQL test snapshots `pgboss`, BSS admission/attempt/reservation, SEM execution/candidate, and reconciliation counters before/after v2 persistence and replan. | PostgreSQL command above — **PASS**; all scoped counters unchanged. | `PROVEN` |

## Validation

- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS** after the local validation database received existing migrations `0085`/`0086`.
- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS** (3 tests).
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS** (7 tests).
- `git diff --check -- <authorized paths>` — **PASS** before commit.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control
returns to CK for the frozen ticket.
