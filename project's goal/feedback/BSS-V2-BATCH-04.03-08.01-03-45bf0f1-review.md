# CK review — BSS-V2-004-03-08-01-03

- **Ticket:** `BSS-V2-004-03-08-01-03` — Source-input Zod and v0.3.1 stage-authority map
- **Batch:** `BSS-V2-BATCH-04.03-08.01-03`
- **Review type:** first independent CK review
- **Reviewed commit:** `45bf0f137d0fb460cc7bb927bc7284b20046b410` (`feat(atlas): add source-input stage authority contract`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-03-source-input-zod-and-v0-3-1-stage-authority-map.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-01-03-go-checkpoint.md`
- **Ticket state before review:** `awaiting_review`
- **Review target check:** GO records the checkpoint-introducing commit as the target at HEAD; HEAD matches. The target diff from base `58027b1433da5f0ab498bfe79729a79886865a53` contains the new schema/map, exports, tests, ticket lifecycle change, and GO checkpoint only.

## Review boundary and preconditions

The active ticket tuple is unambiguous. The frozen ticket is committed and unchanged in the worktree. Uncommitted generated fixture changes, unrelated planning/feedback documents, and lab files do not intersect the checkpoint diff or its review target. The GO checkpoint and ticket are clean at the reviewed SHA.

The ticket's prerequisite CK PASS artifacts are present: `BSS-V2-BATCH-04.03-08.01-01-7de0276-review.md` and `BSS-V2-BATCH-04.03-08.01-02-86d4938-review.md`. The consumed approved relationship boundary is recorded in `BSS-V2-BATCH-04.03-08.01-02-ced86fa-context-provenance-review.md`. This review uses those decisions only for the approved additive source-relationship description boundary; it does not reopen them or require persistence, packet construction, runtime validation, hydration, provider calls, or Semantic V1 changes.

## Independent evidence and validation

The candidate implementation adds the provider-neutral source-input schema and eight-stage authority map in `packages/atlas-skills/src/semantic-source-input-v031.ts`, with additive exports from `packages/atlas-skills/src/index.ts`. The source-slot descriptions preserve modality, independently owned versus context-only ownership, source-language neutrality, and distinct temporal/aspectual states. Relationship descriptions distinguish proposals from trusted context and record provenance and authorization separately. Each map section has one authority, identity, version, source, rendered text, and SHA-256; outside-model validators are recorded separately. Inspection confirms the module does not compile prompts, construct packets, persist data, call providers, hydrate images, or duplicate the semantic-kind taxonomy.

I independently recomputed the three legacy contract hashes recorded by GO. They match exactly:

| Preserved contract | Reproduced SHA-256 | Result |
| --- | --- | --- |
| `packages/atlas-contracts/src/semantic-v1.ts` | `b481d1f6b2b178fdb572e7a8a7e565814456489183fbcc7a9f2560da5c9bf825` | unchanged |
| `packages/atlas-skills/src/semantic-prompt.ts` | `be9817c4aa9c09d7748847abd621bb14cb0c8d2425f79b56d90a84cd30fac902` | unchanged |
| `packages/atlas-skills/src/semantic-source-packet.ts` | `0b0fbf9f65f108c477f72980fb06c46e66c1a3611be05d6cd57198c0bcd8305d` | unchanged |

| Exact command independently run | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 11 tests |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests |
| `git diff 58027b1433da5f0ab498bfe79729a79886865a53..HEAD --check` | PASS — no whitespace errors |

The legacy hashes and regression lanes are unchanged. The commands were deterministic local checks; this review made no external provider attempts, image reads, semantic/perception jobs, reservations, reconciliation, or publication.

## Review Contract outcomes

| Row | Ticket authority and required observable | Independent evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Frozen ticket RC-01: source modality, ownership/reference context, title/legend/table meaning, relationship lifecycle and temporal/aspectual distinctions are represented in the additive source-input authority. | Schema fields and descriptions represent text/table/visual-region, independently-owned/context-only, title/legend/scope/interpretation, proposed/accepted/rejected/unresolved, and negative/not-yet/unknown/unavailable. The focused test parses a table plus context-only legend and proposed relation, rejects an invalid temporal state, and inspects the generated descriptions. | `PROVEN` |
| `RC-02` | Frozen ticket RC-02: one instruction authority per section; independently identified/hashed sections; complete ordered eight-stage map; outside-model validators separate; no copied taxonomy or language-specific rule. | Source types assign one scalar authority per section. The map contains all eight ordered stages, unique section IDs, per-section identity/version/source/text/hash, and separately listed validators. The focused stage-map test checks stage order, section IDs, authorities, hashes, validator records, absence of `semanticKinds`, and absence of the named language-token rule. | `PROVEN` |
| `RC-03` | Frozen ticket RC-03: additive, provider-independent contract; Canonical Semantic V1 and approved `prompt-003/v1` schema/bytes unchanged against `08-01-01`. | Reviewed diff is additive to the skills package and does not edit canonical Semantic V1, legacy prompt, or source-packet implementation. Recomputed legacy hashes match the immutable baseline; legacy skills, contracts, and focused bridge regression commands pass. | `PROVEN` |
| `RC-04` | Frozen ticket RC-04: offline determinism and the named temporal, legend, ambiguity, and source-as-instruction negative cases; no provider calls or image hydration. | Determinism and a temporal invalid-state check pass. The valid legend/proposal fixture and policy descriptions are present. However, `semantic-skills.test.ts:188-203` only parses a valid proposed legend relationship, rejects `maybe`, and checks descriptive wording. It contains no negative case for an ambiguous/unattributed legend relationship and no adversarial source-content case demonstrating that source-as-instruction cannot alter the fixed authority policy. Those named negatives remain unproven. No provider or image execution was performed. | `IMPLEMENTED_UNPROVEN` |

## Findings

### CK-001 — RC-04 named negative cases are not independently demonstrated

The frozen ticket RC-04 explicitly requires temporal, legend, ambiguity, and source-as-instruction negatives. The temporal invalid-state case is covered, but the reviewed test evidence for the other named negative cases consists of a valid proposed legend fixture and policy-description assertions. Static wording establishes intended policy but does not demonstrate the required negative observations.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction / proof | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Frozen ticket RC-04 requires legend/ambiguity negatives; RC-01 requires context-only references and attributable relationship states to remain distinct. The approved `atlas.context-provenance/v1` boundary is limited to fallible proposals and separately authorized trusted context. | `semantic-skills.test.ts:188-203` has only a valid table/legend fixture with a `proposed` relationship. It does not demonstrate that ambiguous or unattributed legend context remains untrusted and cannot become a standalone business assertion or trusted context. | Add an offline negative assertion in the source-input/authority tests for an ambiguous or unattributed title/legend relationship, showing it remains context-only/untrusted rather than becoming trusted context or an independently owned assertion. Keep this at the schema/specification boundary; no runtime validator or compiler is required by this clause. | **Pass iff** a named test in `packages/atlas-skills/tests/semantic-skills.test.ts` demonstrates the required untrusted outcome for an ambiguous or unattributed legend relationship and passes under `corepack pnpm --filter @atlas/skills test`. Direct-regression boundary: the new source-input schema and authority map plus their focused tests; no unrelated package/runtime behavior. |
| `CK-001.b` | Frozen ticket RC-04 requires a source-as-instruction negative; RC-01/RC-02 require source content to remain evidence and instruction authority to be explicit and section-owned. | Current tests assert the phrase `evidence, not an instruction author` and hash the authority map, but do not include adversarial source content or prove its inability to change the authority policy. | Add an offline negative assertion using source content that asks to override policy, demonstrating that it remains untrusted evidence and does not change the fixed section authority or policy text/hash. Keep the proof within the frozen schema/authority specification; do not add a prompt compiler, provider call, or runtime integration. | **Pass iff** a named test in `packages/atlas-skills/tests/semantic-skills.test.ts` supplies an adversarial source-as-instruction case and proves the fixed policy/section authority remains authoritative, with the focused skills test passing. Direct-regression boundary: the new source-input schema and authority map plus their focused tests; no unrelated package/runtime behavior. |

No other ticket-bound deficiency was identified. The schema, authority-map structure, additive exports, and compatibility checks satisfy their applicable rows. No separate scope-change observation is required.

## Decision

`CHANGES_REQUIRED`

The single consolidated finding `CK-001` is limited to the missing RC-04 negative evidence. Its clauses and binary closure oracles are frozen by this artifact. Any remediation must follow the existing human/planning authorization workflow and may not expand this ticket into compiler, validator, packet, provider, or runtime work.
