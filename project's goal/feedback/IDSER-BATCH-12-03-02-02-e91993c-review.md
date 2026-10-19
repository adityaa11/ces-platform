# CK review: IDSER-012-03-02-02 / IDSER-BATCH-12-03-02-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-02-02-conservative-corpus-demand-estimator.md`
- **Reviewed commit:** `e91993ce0980c813a66a50d88533c62cd0c9ad56` (`feat(idser): add conservative corpus demand estimator`)
- **Checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-02-02-go-checkpoint.md`
- **Ticket state:** `awaiting_review`.
- **Batch:** `IDSER-BATCH-12-03-02-02`.
- **Review type:** first consolidated CK review.
- **Result:** `PASS`.

## Review preconditions and evidence

- The active tuple is unambiguous: ticket `IDSER-012-03-02-02`, batch `IDSER-BATCH-12-03-02-02`, ticket state `awaiting_review`, and implementation target `e91993ce`.
- The recorded implementation commit exists and is the committed revision under review. The estimator source, focused test, and package script are clean in the current checkout; unrelated dirty and untracked paths do not overlap the reviewed implementation or evidence paths and do not make the target ambiguous.
- The consumed predecessor is the recorded CK `PASS` for `IDSER-012-03-01-03`; the GO checkpoint records the pinned BSS estimator identity `anoman-prospective-estimator@v2` supplied by the `-03-02-01` evidence.
- Reviewed the frozen ticket, the parent split-map estimator clarification, the GO checkpoint, `apps/agents-bridge/src/idser-corpus-demand-estimator.ts`, the accepted-document resolver result type, the existing `RequestResourceEnvelope` parser, and the focused estimator tests.

## Review Contract

| Row | Ticket authority | Required proof | CK assessment |
| --- | --- | --- | --- |
| `RC-012030202-01` | Frozen ticket row 01 and `SR-012030202-T1/R2`: accepted source material yields deterministic document/page/kind/local-ID locators and explicit eligible/deferred/unexamined classifications; duplicate, foreign, missing-media and fidelity-breaking cases reject or remain explicit. | `apps/agents-bridge/src/idser-corpus-demand-estimator.ts:110-160` performs deterministic page/source ordering, canonical locator construction, duplicate detection, and media binding. `apps/agents-bridge/tests/idser-corpus-demand-estimator.test.ts:22-35` proves deterministic text/table/visual ordering and explicit deferred/unexamined states; lines 38-50 cover missing/foreign media and duplicate locators. | `PROVEN` |
| `RC-012030202-02` | Frozen ticket row 02 and `SR-012030202-R1`: measured, conservative request bytes/input tokens cover source, context/REL placeholders, media, system prompt, schema, reserved output and safety margins, then project the existing finite four-dimensional envelope with pinned identity/version and no page-count sizing. | `idser-corpus-demand-estimator.ts:6-27,62-89` validates the pinned identity and finite bounds, uses UTF-8 byte length, includes configured overheads/margins, and calls the existing `parseRequestResourceEnvelope`. The exact visual fixture and output assertions are at `idser-corpus-demand-estimator.test.ts:6-10,22-32`; no page count participates in demand arithmetic. | `PROVEN` |
| `RC-012030202-03` | Frozen ticket row 03 and `SR-012030202-C1/R2`: REL absence remains absent; placeholders do not own output or fabricate semantic structure/visual facts. | The accepted result type supplies only `rel: { state: "unavailable" }`; the estimator rejects any other REL state at `idser-corpus-demand-estimator.ts:104-106` and emits only locator/classification/demand data. The fabricated-REL negative case is proven at `idser-corpus-demand-estimator.test.ts:49-50`. | `PROVEN` |
| `RC-012030202-04` | Frozen ticket row 04 and `SR-012030202-C1/R2`: an empty corpus returns typed `NO_ELIGIBLE_SOURCE`; pure estimation creates no BSS/storage/plan/reservation/GHR/SEM/provider/truth effects. | `idser-corpus-demand-estimator.ts:93-102` exposes a pure function with no reader, persistence, queue, transport or provider dependency. `idser-corpus-demand-estimator.test.ts:53-59` proves the typed empty result and zero eligible units; the module imports only the envelope parser and accepted-result type. | `PROVEN` |

## Validation and evidence

- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-corpus-demand-estimator.test.ts` — **PASS**: 3 tests, 0 failures, 0 skips.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — **PASS**: `Atlas database migration check passed`.
- `git diff --check e91993ce^ e91993ce -- apps/agents-bridge/package.json apps/agents-bridge/src/idser-corpus-demand-estimator.ts apps/agents-bridge/tests/idser-corpus-demand-estimator.test.ts` — **PASS**.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test` — **FAILS after the reviewed estimator suite** at the unrelated pre-existing Docling assertion `apps/agents-bridge/tests/docling-provider.test.ts:109-112`: the test expects `docling-digital-pdf` to resolve, while the current route registry rejects it because it lacks the approved RUN-003 qualification. All suites through the reviewed estimator suite passed; no reviewed path overlaps this failure.

## Frozen Finding Closure Matrix

No ticket-bound implementation or evidence deficiency was identified. No `CK-###` finding or closure clause is frozen.

## Scope-change observations

None. The unrelated Docling suite failure is outside this ticket's authorized estimator scope and does not require a ticket change, dependency change, provider/runtime/deployment target, architecture decision, or reopening of approved predecessor work.

## Decision

`PASS`. All four ticket-derived Review Contract rows are proven by the committed implementation and recorded focused evidence, and no direct in-scope regression remains. This is the first CK review; the ticket remains `awaiting_review` unless the repository workflow separately records the approved state transition.
