# CK review: BSS-V2-004-03-05-REL-01

- **Ticket:** `BSS-V2-004-03-05-REL-01` — provisional relationship contract and producer
- **Batch:** `BSS-V2-004-03-05 relationship-lifecycle successor plan`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `55dfa87b45b54c24102a3d48543dbf60846405c6`
- **Reviewed tree:** `853d3c86842e82ab7b7f675c9d7823ffa2c5e363`
- **Frozen ticket:** `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-01-provisional-relationship-contract.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-05-REL-01-go-checkpoint.md`
- **Result:** `CHANGES_REQUIRED`

The GO checkpoint is `awaiting_review` and records the exact implementation commit. Its candidate tree SHA matches that commit's tree, and its parent matches the recorded base. The candidate diff contains exactly the four permitted paths. The primary checkout contains unrelated dirty and untracked content; the review used an isolated validation checkout whose staged candidate tree hash matches the recorded reviewed tree, so those unrelated files do not make the target ambiguous.

## Review Contract

| Row | Ticket authority / required proof | Evidence and status |
| --- | --- | --- |
| `RC-REL-01-01` | Valid envelope and exact trusted source slots produce repeatable immutable `proposed` revisions with local provenance and null authorization. | Focused positive test checks stable repeated materialization, scope, source locators, asset identity, ordinal, null confidence/authorization, and stable persistence replay. **PROVEN**. |
| `RC-REL-01-02` | Named malformed, unknown, enum, missing/foreign/duplicate slot, evidence-pair, SHA/asset, candidate, predecessor, duplicate-conflict, and accepted/confirmed/published cases reject before append. | The focused test covers unknown top-level fields, a fenced string, enum, foreign slot, wrong evidence pair, dangling candidate, forged predecessor, an accepted claim, duplicate relationship and trusted source slots, and SHA/asset mismatches. Missing required relationship-slot, malformed decoded-object, and `confirmed`/`published` claim cases are not exercised. **IMPLEMENTED_UNPROVEN** for those observations; see `CK-001`. |
| `RC-REL-01-03` | Provider ordinal, confidence, candidate reference and language remain provenance only; no accepted authority, canonical Semantic V1 output, visual-owned candidate, or automatic correctness claim. | Producer constructs only `proposed` revisions, sets confidence and authorization to null, records local ordinal, and has no provider/job/reservation or finalizer dependency. Focused output-boundary test checks the prohibited output markers. **PROVEN**. |
| `RC-REL-01-04` | Repeated append/stage calls return the same immutable hashes without duplicate revisions; materializer performs no provider interaction. | Focused test repeats materialization, append and sidecar staging and asserts stable values and one stored revision. Static inspection confirms the materializer only parses, resolves, hashes, loads and appends through the repository port; no provider/job/reservation call exists. **PROVEN**. |

## Validation and evidence

Run in `C:\Temp\atlas-rel01-validation`, at base `158eea48df2b259373225b3e1ee6faef476dbc5e` with the four candidate paths staged. `git write-tree` returned `853d3c86842e82ab7b7f675c9d7823ffa2c5e363`, matching the reviewed commit tree.

| Command / check | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts` | Exit 0; 3 passed. |
| `corepack pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | Exit 0; 18 passed. |
| `git diff --cached --check` | Exit 0. |
| Diff check for `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `semantic-prompt.ts`, `semantic-source-input-v031.ts`, `semantic-source-packet.ts`, and `packages/atlas-contracts` against the base | No changes. |

The two validation commands are the exact suites named by the ticket. Source inspection confirms the new producer imports the existing strict semantic proposal schema and relationship provenance helpers only. No provider, job, reservation, worker, finalizer, database, or acceptance/publication path was added. The test fake exercises the replay-port contract; durable repository implementation and worker composition remain explicitly assigned to REL-03.

## Frozen Finding Closure Matrix

### CK-001 — Missing named rejection observations in `RC-REL-01-02`

The strict parser and source-slot checks appear to reject these inputs, but the frozen ticket requires the named cases to be proven before append. The focused suite does not currently demonstrate the following observations. The clauses are limited to `RC-REL-01-02` and do not broaden the ticket.

#### CK-001.a — Missing required relationship slot

- **Ticket authority:** Frozen ticket `RC-REL-01-02`: missing source slots must be rejected before append.
- **Unsatisfied evidence:** `packages/atlas-skills/tests/relationship-extraction-envelope.test.ts` has a foreign-slot case but no case that omits a required relationship slot from an otherwise decoded relationship proposal.
- **Observable correction:** Add a focused case omitting a required slot property such as `context_source_slot` from the relationship proposal, and assert materialization rejects before repository append.
- **Binary closure oracle:** **PASS** when the focused test contains the omitted-slot input and proves rejection with `repository.appendCalls === 0`; **FAIL** otherwise. Exact evidence location: the new negative case and assertion in `packages/atlas-skills/tests/relationship-extraction-envelope.test.ts`, run with `corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts`. Direct-regression boundary: the missing-required-slot rejection path in the REL-01 envelope/materializer only.

#### CK-001.b — Malformed decoded envelope object

- **Ticket authority:** Frozen ticket `RC-REL-01-02`: decoded malformed values must be rejected before append.
- **Unsatisfied evidence:** The current “fenced response” case supplies a string, but there is no malformed already-decoded object case.
- **Observable correction:** Add a negative case with an envelope-shaped decoded object containing a malformed relationship proposal value (for example, `relationship_proposals: [null]`) and assert rejection before repository append.
- **Binary closure oracle:** **PASS** when the focused test proves the malformed decoded object rejects with `repository.appendCalls === 0`; **FAIL** otherwise. Exact evidence location: the new negative case and assertion in `packages/atlas-skills/tests/relationship-extraction-envelope.test.ts`, run with `corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts`. Direct-regression boundary: strict REL-01 envelope parsing before persistence.

#### CK-001.c — Confirmed and published claims

- **Ticket authority:** Frozen ticket `RC-REL-01-02`: accepted, confirmed and published claims must be rejected before append.
- **Unsatisfied evidence:** A provider-supplied `disposition: "accepted"` is tested as an unknown strict-object field, but `confirmed` and `published` claims are not tested.
- **Observable correction:** Add focused negative cases for provider-supplied `confirmed` and `published` claims on a relationship proposal and assert each rejects before repository append.
- **Binary closure oracle:** **PASS** when both named claim cases reject with `repository.appendCalls === 0`; **FAIL** if either case is missing or reaches append. Exact evidence location: the two negative cases and assertions in `packages/atlas-skills/tests/relationship-extraction-envelope.test.ts`, run with `corepack pnpm --filter @atlas/skills exec jiti tests/relationship-extraction-envelope.test.ts`. Direct-regression boundary: strict REL-01 rejection of authority-bearing provider fields.

## Scope-change observations

None. The durable adapter/migration and atomic worker composition are explicitly deferred to REL-03 and are not required by this review.

## Decision

`CHANGES_REQUIRED` for `CK-001.a` through `CK-001.c` only. The implementation target and exact scope were reviewable. This is a first review; the frozen matrix above is the complete admissible closure target. Historical `BSS-V2-004-03-05` findings `CK-001.a/.b` are unaffected and remain historically unchanged.
