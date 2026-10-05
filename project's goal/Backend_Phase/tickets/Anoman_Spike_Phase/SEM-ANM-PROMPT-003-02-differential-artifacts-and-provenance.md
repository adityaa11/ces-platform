# SEM-ANM-PROMPT-003-02: Differential generated artifacts and provenance

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-PROMPT-003-BATCH-02`
- **Parent context:** [SEM-ANM-PROMPT-003 implementation context](../../SEM-ANM-PROMPT-003-cross-field-composition-implementation-context.md)
- **Predecessor:** CK `PASS` for [SEM-ANM-PROMPT-003-01](SEM-ANM-PROMPT-003-01-frozen-cross-field-policy-insertion.md)
- **Start gate:** The predecessor checkpoint and focused evidence reproduce, approved PROMPT-002 hashes still match, and explicit `go` authorizes this offline ticket.

## Outcome

Generate the PROMPT-003 artifact bundle under `scripts/sem-anm-prompt003/generated/`: `system-prompt.txt`, `provider-schema.json`, `prompt-provenance.json`, and `hashes.json`. Prove with an exact structural differential oracle that the sole prompt/provenance delta from PROMPT-002 is the approved cross-field static-policy section.

## Frozen scope

- Deterministically render PROMPT-003 from the predecessor structured sections and insertion seam.
- Record predecessor prompt/schema/Zod hashes; generated prompt/schema/provenance hashes; and frozen policy-body hash.
- Preserve provider schema byte identity at `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`.
- Compare structured sections exactly: remove only the cross-field section from PROMPT-003, then require equality of every remaining section ID, title, ownership, source property, source description, generated text, and order with PROMPT-002.
- Prove two identical builds have byte-identical prompt, schema, provenance, and hashes.

Do not use fuzzy or LLM-based comparison; do not amend PROMPT-002, Zod semantics, provider schema, reconciliation, parser/finalizer, or production behavior. Do not add provider execution, secrets, S1-S4 live results, response repair, or a new semantic heuristic.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT3-02-001` | Emit all required derived artifacts. | Prompt, unchanged schema, provenance, and hashes are generated at the bounded location. |
| `RC-PROMPT3-02-002` | Prove the schema and Zod authority are unchanged. | Schema bytes/hash equal PROMPT-002; frozen Zod reference hash remains approved. |
| `RC-PROMPT3-02-003` | Prove exact predecessor preservation. | Removing the single cross-field section restores exact PROMPT-002 structured section sequence/content with no fuzzy allowance. |
| `RC-PROMPT3-02-004` | Provide inspectable policy provenance. | New provenance records `CROSS-FIELD SEMANTIC COMPOSITION`, `STATIC_POLICY`, `(fixed policy)`, and the exact body. |
| `RC-PROMPT3-02-005` | Prove determinism and exclusions. | Two builds are byte-identical; leak, reconciliation, live-provider, repair, and predecessor-mutation checks pass. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT3-02-IB-01` | Generated artifacts are derived evidence; they cannot rewrite the PROMPT-002 authority. |
| `SR-PROMPT3-02-ID-01` | Link predecessor and generated artifact identities through SHA-256 values, including policy-body identity. |
| `SR-PROMPT3-02-ES-01` | The exact section-delta oracle and provenance mapping remain reviewable without model interpretation. |
| `SR-PROMPT3-02-PC-01` | Do not replace the differential oracle with text heuristics or couple generation to reconciliation, provider execution, or runtime repair. |
| `SR-PROMPT3-02-VS-01` | Verify exact section restoration, stable bytes/hashes, exclusion checks, and known frozen identities. |
| `SR-PROMPT3-02-UP-01` | No provider governance, credentials, or production routing decision is made by artifact generation. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT3-02-RB-01` | `SR-PROMPT3-02-IB-01`, `SR-PROMPT3-02-ID-01` | Are the derived artifacts fully attributable while immutable predecessor identities remain intact? | Hash manifest, generated files, bounded diff. |
| `SR-PROMPT3-02-RB-02` | `SR-PROMPT3-02-ES-01`, `SR-PROMPT3-02-PC-01`, `SR-PROMPT3-02-VS-01` | Does an exact deterministic oracle establish that only the frozen policy changed? | Differential tests, repeat-build evidence, provenance inspection. |

## Handoff

Record `PASS` or `CHANGES_REQUIRED`. On `PASS`, commit generated artifacts and deterministic evidence, set this ticket to `awaiting_review`, and stop for CK. Ticket -03 may start only after CK `PASS` and its own explicit `go`.
