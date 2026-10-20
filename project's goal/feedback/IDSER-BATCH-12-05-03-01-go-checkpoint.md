# IDSER-012-05-03-01 GO checkpoint

- **Ticket:** `IDSER-012-05-03-01` — Immutable v3 locator persistence
- **Batch:** `IDSER-BATCH-12-05-03-01`
- **State:** `awaiting_review`
- **Predecessor:** `IDSER-012-05-02-02` CK `PASS` at `0fb9052a6c5be44e0c11708a9d628bbabaa7b3b1`.
- **Implementation commit:** `ed07f338daf5e7158a5459b427f0fda2f329589b` (`feat(idser): persist immutable v3 locators`).

## Bounded implementation

- Added strict `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` canonical schemas to the existing immutable Atlas parent/handoff tables; no table or migration contract is widened.
- The parent retains source snapshot identity, ordered inventory, resolvable accepted-media identities, manifest identity, pinned prompt/schema/composer/route/adapter/estimator/configuration identities, BSS prospective provenance, resource envelope, and explicit replan/cancellation identity.
- Each child retains only its ordered owned/context locators and source/request/manifest hashes, conservative measurements, output reservation, resource envelope, and fit trace. Inputs and records reject unknown/duplicate/foreign data and content-bearing fields before a transaction starts.
- `persistV3()` uses the existing advisory-lock parent/child transaction, append-only tables, idempotent replay comparison, and cancellation-ancestry fence. It adds no resolver, hydration, grants, BSS admission, provider call, queue, GHR, dispatch, or semantic execution surface.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-01205-0301-01` | Frozen ticket row `RC-01205-0301-01` | Strict v3 schemas reject unknown, duplicate, foreign, ownership/coverage, identity, and estimate inconsistencies. | `packages/atlas-db/src/immutable-semantic-corpus-plan.ts`; `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` passed 3/3, including unknown payload, duplicate media, foreign locator, hash, manifest, ancestry, and post-canonical injection cases. | `PROVEN` |
| `RC-01205-0301-02` | Frozen ticket row `RC-01205-0301-02` | Parent/children persist atomically, replay idempotently, and retain cancellation/ancestry identity without dispatch. | Disposable PostgreSQL integration case `v3 atomically persists references-only commitments with idempotency, cancellation ancestry, and no dispatch` passed. It injects a child-insert failure and observes zero parent/children, checks concurrent/idempotent replay, cancels and creates a v3 successor with exact predecessor identity, then observes no queue/BSS/provider/SEM deltas. | `PROVEN` |
| `RC-01205-0301-03` | Frozen ticket row `RC-01205-0301-03` | Database inspection proves no full request, prompt/schema/source body, media bytes/base64, adapter JSON, provider body, credentials, or duplicated manifest/payload is stored. | The PostgreSQL case serializes the parent and every child read from `atlas.semantic_corpus_plan`/`atlas.planned_semantic_corpus_handoff` and asserts all prohibited content markers absent. The unit suite also validates exact allowed parent/child keys and rejects injected `raw`, prompt body, media bytes/base64, and provider body fields. | `PROVEN` |
| `RC-01205-0301-04` | Frozen ticket row `RC-01205-0301-04` | Persisted commitments permit later read-only reconstruction to rederive transient source/request/manifest identities and measurements. | The canonical v3 proof asserts source specification hash, request hash, parent/child manifest binding, locators, accepted-media identity, conservative request bytes, input/output measurement, envelope, fit trace, and every pinned identity are present while bodies are absent. `replayImmutableSemanticCorpusPlanHashV3()` reproduces the durable parent hash. | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` — **PASS** (3 tests).
- Disposable PostgreSQL 18 logical copy at `127.0.0.1:55432`: `corepack pnpm --filter @atlas/db migrate` — **PASS**; `corepack pnpm --filter @atlas/db migration:check` — **PASS**; `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan` — **PASS** (8 tests, including the v3 atomic/database-inspection case).
- `git diff --check --` for the authorized implementation paths — **PASS**.

Internal readiness: READY_FOR_CK
