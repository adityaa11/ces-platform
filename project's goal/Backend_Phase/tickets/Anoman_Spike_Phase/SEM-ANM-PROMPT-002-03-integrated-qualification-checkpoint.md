# SEM-ANM-PROMPT-002-03: Integrated offline qualification checkpoint

- **State:** `approved`
- **Review batch:** `SEM-ANM-PROMPT-002-BATCH-03`
- **Parent context:** [SEM-ANM-PROMPT-002 implementation context](../../SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md)
- **Predecessors:** CK `PASS` for [PROMPT-002-01](SEM-ANM-PROMPT-002-01-frozen-reference-and-schema-projection.md) and [PROMPT-002-02](SEM-ANM-PROMPT-002-02-deterministic-extraction-prompt-compiler.md)
- **Start gate:** Predecessor artifacts and hashes reproduce, all predecessor findings are closed, and explicit `go` authorizes the integrated offline checkpoint.

## Outcome

Prove the complete PROMPT-002 output meets its frozen Review Contract: the
reference-derived provider schema and extraction prompt are complete,
deterministic, covered by provenance, and free of reconciliation definitions.
Produce the final reproducible artifact bundle and secret-safe CK review
record, then stop.

This ticket is verification and packaging within the frozen offline scope. It
does not reopen ticket -01 or -02 design decisions, change semantic wording,
call Anoman/Gemini/any provider, or authorize live qualification.

## Required artifacts and checks

Keep generated output under the context's suggested `scripts/sem-anm-prompt002/`
structure, with generated evidence in the repository-approved local artifact
area. At minimum record:

- generated system prompt;
- generated provider JSON Schema;
- deterministic provenance mapping each generated semantic section to source schema/property, exact source description, and static/dynamic ownership;
- source-reference, provider-schema, and system-prompt SHA-256 values;
- machine-readable coverage and hash evidence.

Prove repeated identical builds yield byte-identical schema/prompt/provenance
and identical hashes. Use deterministic structural/string/snapshot checks; do
not use fuzzy or LLM-based comparisons.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT2-03-001` | Cover the complete frozen extraction vocabulary. | Tests prove all 16 kinds are represented and fail on a missing or unknown kind. |
| `RC-PROMPT2-03-002` | Cover provider-facing fields and source accounting. | Candidate/non_fact, semantic_key, payload, normalized_meaning, needs_resolution, questions, slot/source-result accounting are represented. |
| `RC-PROMPT2-03-003` | Enforce required semantic and negative checks. | Tests protect primary-kind/non-exclusive facets, unresolved-vs-needs_resolution, no reconciliation leakage, no old PROMPT-001 ontology, and no semantic descriptions authored outside the frozen reference. |
| `RC-PROMPT2-03-004` | Prove deterministic artifacts. | Two or more identical local builds produce byte-identical outputs and stable recorded SHA-256 hashes. |
| `RC-PROMPT2-03-005` | Prove provenance and fixed-policy coverage. | Provenance differentiates static policy from Zod-owned semantics; coverage checks all required global extraction rules. |
| `RC-PROMPT2-03-006` | Preserve no-provider/no-production scope. | No live call, credentials, provider integration, parser/finalizer, reconciliation execution, persistence, or production contract changes are present. |
| `RC-PROMPT2-03-007` | Close the frozen Review Contract. | Every parent `RC-PROMPT2-001` through `RC-PROMPT2-014` has linked evidence and one terminal `PASS` or `CHANGES_REQUIRED`. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT2-03-IB-01` | The final bundle remains derived offline evidence and does not alter accepted Atlas truth or production authority. |
| `SR-PROMPT2-03-ID-01` | Reference, schema, prompt, provenance, and test results are linked by reproducible hashes. |
| `SR-PROMPT2-03-SA-01` | No credentials, provider responses, or confidential input are needed or preserved for this checkpoint. |
| `SR-PROMPT2-03-PC-01` | Do not expand into live inference, finalization, reconciliation, or production integration while closing evidence. |
| `SR-PROMPT2-03-VS-01` | Verify all semantic coverage, negative checks, artifact stability, and inherited review rows deterministically. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT2-03-RB-01` | `SR-PROMPT2-03-IB-01`, `SR-PROMPT2-03-PC-01` | Does the integrated result preserve scope and all existing authorities? | Final diff/scope audit and parent RC evidence matrix. |
| `SR-PROMPT2-03-RB-02` | `SR-PROMPT2-03-ID-01`, `SR-PROMPT2-03-SA-01`, `SR-PROMPT2-03-VS-01` | Are artifacts attributable, reproducible, complete, and free of secret/provider data? | Hashes, provenance, coverage, deterministic test output, artifact inventory. |

## Terminal classification and hard stop

GO completes the evidence bundle, records a proposed `PASS` or
`CHANGES_REQUIRED`, sets this ticket to `awaiting_review`, and stops for CK.
CK confirms exactly one terminal result under the parent context; `PASS`
requires all frozen parent review rows, generated artifacts, hashes, and
provenance to meet contract. This result does not authorize
SEM-ANM-SPIKE-002, BSS-V2-004-03, model inference, reconciliation, or any
production integration; those require separate planning and authorization.
