# Review: SEMIR-001 / SEMIR-BATCH-01

- Ticket / batch: `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-001-semantic-qualification-corpus.md` / `SEMIR-BATCH-01`
- Reviewed commit: `68a474cce430996a1077971752345ac38ffbc5ea`
- Frozen ticket reference: SEMIR-001 at the reviewed commit; state `awaiting_review`.
- Result: `CHANGES_REQUIRED`

## Evidence

- `HEAD` is `68a474cce430996a1077971752345ac38ffbc5ea` (`feat(semir): add qualification corpus`). Its five-file diff adds the ticket, checkpoint, isolated corpus, checker, and authoring guide. Tracked working-tree edits are confined to unrelated Atlas fixtures, an IDSER ticket/feedback item, `tsconfig.tsbuildinfo`, and the Groq spike client; none changes the reviewed SEMIR-001 files.
- `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` passed and reported `40 human-authored cases, 11 coverage families, zero provider calls`.
- `git diff --check 68a474c^ 68a474c` passed. Static inspection confirms no provider integration, schema, extraction logic, production contract, or `NormalizedDocument v1` modification in the reviewed commit.
- The passing checker validates only that the eleven broad coverage labels are nonempty and reference known IDs. It does not assert the required members within each family or the material distinction of every A–E expectation.

## Findings

| ID | Classification | Requirement / authority | Location | Evidence | Required correction |
| --- | --- | --- | --- | --- | --- |
| CK-001 | COVERAGE_AND_VALIDATION_DEFECT | SEMIR-001 frozen scope; `RC-SEMIR-001-02`, `RC-SEMIR-001-03`; `SR-001-VS-01` and `SR-001-RB-03`. | `scripts/semantic-ir-v0/semir-001-corpus.mjs`; `scripts/semantic-ir-v0/check-semir-001-corpus.mjs` | The §13-required `definition`, `missing scope`, and `ambiguous attachment` members have no corpus expectation (the corpus and its guide contain none of `definition`, `missing-scope`, or `ambiguous-attachment`). The checker still passes because it only checks broad-family membership and case IDs; it does not prove those required members or all material contrast distinctions. | Add compact, authorized human-authored cases and coverage entries for the omitted members. Extend the deterministic checker to prove every required §13 member and the required distinct A–E contrast expectations, then record its passing output. |
| CK-002 | REQUIREMENTS_CORPUS_DEFECT | SEMIR-001 Deliverables and validation; `RC-SEMIR-001-01`; `SR-001-ES-01`, `SR-001-PC-01`, and `SR-001-RB-02`. | `scripts/semantic-ir-v0/semir-001-corpus.mjs` | The ticket requires the corpus expectations to include propositions and evidence expectations, while remaining semantic rather than serialized output. Every fixture currently exposes only source disposition, context classification, generic dimension tags, unresolved entries, and prohibited interpretations. It records neither proposition expectations nor evidence expectations; consequently later tickets cannot use this frozen corpus to distinguish the semantic proposition(s) and expected grounding without inventing them. | Add corpus-first, human-authored proposition and evidence-expectation fields (including multiple propositions where required) and checker assertions for their presence where applicable. Keep them semantic and source-grounded; do not introduce JSON/schema shape, extraction rules, canonicalization, or provider behavior. |

## Frozen Finding Closure Matrix

| Clause | Ticket authority | Unsatisfied evidence | Observable correction / proof | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- | --- |
| CK-001.a | SEMIR-001 frozen scope, §13 required families; `RC-SEMIR-001-02`. | No case/dimension covers `definition`, `missing scope`, or `ambiguous attachment`. | Corpus and coverage map contain an authorized, stable-ID case for each omitted member with semantic dimensions and any required unresolved/prohibited meaning. | The corpus contains all three members, the coverage map points to them, and the checker passes assertions that identify them. | Preserve existing mandatory A–E cases and their semantic expectations; add no provider, schema, extraction, or production behavior. |
| CK-001.b | `RC-SEMIR-001-02`, `RC-SEMIR-001-03`; `SR-001-VS-01`; `SR-001-RB-03`. | The checker accepts a nonempty broad-family map and ID presence without proving member completeness or material A–E expectation distinction. | Deterministic corpus validation asserts every §13-required member and verifies distinct semantic expectations for the required A–E contrasts. | `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` passes with assertions for the complete §13 member set and distinct A–E semantic expectations. | Do not weaken or replace existing coverage/contrast checks; no live/provider call is permitted. |
| CK-002.a | SEMIR-001 Deliverables and validation; `RC-SEMIR-001-01`; `SR-001-ES-01`, `SR-001-PC-01`, `SR-001-RB-02`. | Fixtures lack proposition and evidence-expectation data required by the ticket. | Every applicable fixture has human-authored semantic proposition expectation(s) and evidence expectation(s); multi-proposition sources explicitly preserve more than one. | The corpus checker passes assertions that applicable cases contain these fields and cases 023, 024, and 034 preserve multiple proposition expectations; inspection shows no serialized IR/extraction/canonicalization/provider content. | Retain source authorization, disposition/context classification, unresolved meaning, and prohibited interpretations; do not alter production or `NormalizedDocument v1`. |

## Scope-change observations

None identified. The requested repairs are ticket-local corpus and deterministic-validation work; they do not require a product, provider, architecture, or policy decision.

## Decision

The committed corpus is safely isolated and its existing deterministic check passes, but two ticket-bound deficiencies remain: three mandatory §13 members are absent with insufficient coverage/contrast proof, and the fixtures lack the required proposition and evidence expectations. The checkpoint is `CHANGES_REQUIRED`. Keep SEMIR-001 at `awaiting_review`; a single bounded CFC remediation against the frozen clauses is required before SEMIR-002 may start.
