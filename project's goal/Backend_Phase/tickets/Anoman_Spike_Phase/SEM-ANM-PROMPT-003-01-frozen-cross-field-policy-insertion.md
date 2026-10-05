# SEM-ANM-PROMPT-003-01: Frozen cross-field policy and deterministic compiler insertion

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-PROMPT-003-BATCH-01`
- **Parent context:** [SEM-ANM-PROMPT-003 implementation context](../../SEM-ANM-PROMPT-003-cross-field-composition-implementation-context.md)
- **Predecessor:** `SEM-ANM-PROMPT-002` CK `PASS` at `e2ccb5b9529d641eca0136d73fd55f2e6e308739`, approval record `b49984c7b4fc2b9ea85b8de043cbc8338d4ac789`
- **Start gate:** The approved PROMPT-002 artifacts match their recorded hashes, the parent context remains frozen, and explicit `go` authorizes this offline ticket.

## Outcome

Create the isolated PROMPT-003 compiler seam (prefer `scripts/sem-anm-prompt003/`) that consumes PROMPT-002 as an immutable structured input and inserts exactly one frozen `CROSS-FIELD SEMANTIC COMPOSITION` section. The insertion is after `CLARIFICATION QUESTIONS` and before `SOURCE CLASSIFICATION`; it is `STATIC_POLICY`, not a change to a Zod-owned definition.

Copy the exact policy body from parent-context §8 byte-for-byte. It must not be paraphrased, expanded, shortened, or supplied with the S4 source, expected answer, Safara material, or provider examples.

## Frozen scope

- Reuse the approved PROMPT-002 compiler output/provenance as structured input; do not copy its semantic glossary or patch raw prompt text with regex.
- Insert one static-policy section with the frozen title, body, ownership, and location.
- Preserve PROMPT-002 Zod reference bytes (`67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`) and provider-schema bytes (`c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`).
- Add focused deterministic tests for policy identity, single insertion, ownership, placement, no fixture leakage, and predecessor immutability.

Do not edit `scripts/sem-anm-prompt002/**`, `packages/atlas-contracts/src/semantic.ts`, any `.describe(...)` text, candidate vocabulary, provider shape, parser/finalizer, or reconciliation behavior. Do not add live calls, credentials/environment reads, keyword heuristics, or post-provider semantic repair.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT3-01-001` | Consume PROMPT-002 as immutable predecessor. | Source/artifact hash checks pass and no PROMPT-002 file changes appear in the bounded diff. |
| `RC-PROMPT3-01-002` | Freeze the exact cross-field policy. | Title and body equal parent-context §8 byte-for-byte, appear once, and contain no S4 fixture/output leakage. |
| `RC-PROMPT3-01-003` | Preserve the tested placement and ownership. | Provenance/test evidence shows `STATIC_POLICY`, immediately after questions and immediately before source classification. |
| `RC-PROMPT3-01-004` | Preserve existing authority. | Zod reference and provider schema remain byte-identical at their approved hashes; no individual semantic definition changes. |
| `RC-PROMPT3-01-005` | Keep this an offline guidance-only change. | No provider code/call, credential read, deterministic may/might/could heuristic, or response repair is added. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT3-01-IB-01` | PROMPT-002 accepted prompt, Zod reference, schema, and provenance are immutable integrity inputs; PROMPT-003 derives only a new prompt policy artifact. |
| `SR-PROMPT3-01-TB-01` | Prompt construction remains offline and separate from any provider execution boundary. |
| `SR-PROMPT3-01-ID-01` | Preserve predecessor checkpoint/hashes plus a reproducible policy-body hash and insertion provenance. |
| `SR-PROMPT3-01-ES-01` | Keep structured section insertion and static-policy attribution independently inspectable. |
| `SR-PROMPT3-01-PC-01` | Do not couple the policy to Zod descriptions, provider schema, fixture-specific examples, keyword repair, reconciliation, or production behavior. |
| `SR-PROMPT3-01-VS-01` | Deterministically verify exact bytes, one occurrence, placement, predecessor hashes, and leakage negatives. |
| `SR-PROMPT3-01-UP-01` | Provider policy and live qualification remain intentionally unresolved. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT3-01-RB-01` | `SR-PROMPT3-01-IB-01`, `SR-PROMPT3-01-ID-01` | Are all accepted inputs unchanged and the new policy attributable to its frozen source? | Hash checks, diff, policy hash, provenance. |
| `SR-PROMPT3-01-RB-02` | `SR-PROMPT3-01-TB-01`, `SR-PROMPT3-01-ES-01`, `SR-PROMPT3-01-PC-01`, `SR-PROMPT3-01-VS-01` | Is this exactly one deterministic offline insertion with no fixture leak or semantic repair seam? | Focused tests, dependency/diff inspection, generated prompt excerpt. |

## Handoff

Record `PASS` or `CHANGES_REQUIRED`. On `PASS`, commit the bounded compiler insertion and focused evidence, set this ticket to `awaiting_review`, and stop for CK. Ticket -02 may start only after CK `PASS` and its own explicit `go`.
