# SEM-ANM-PROMPT-002-02: Deterministic extraction-prompt compiler

- **State:** `approved`
- **Review batch:** `SEM-ANM-PROMPT-002-BATCH-02`
- **Parent context:** [SEM-ANM-PROMPT-002 implementation context](../../SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md)
- **Predecessor:** CK `PASS` for [SEM-ANM-PROMPT-002-01](SEM-ANM-PROMPT-002-01-frozen-reference-and-schema-projection.md)
- **Start gate:** Predecessor output and hash match their accepted evidence, the frozen context remains unchanged, and explicit `go` authorizes this offline ticket.

## Outcome

Compile the schema from PROMPT-002-01 into a deterministic extraction system
prompt. Render provider output shape and semantic definitions from the public
JSON-Schema conversion and frozen Zod `.describe(...)` text, then combine those
sections with the exact fixed extraction scaffold from the parent context.
The compiler must preserve Atlas Semantic V1 meaning without adding a second
hand-maintained glossary.

Reuse PROMPT-001's deterministic traversal/rendering architecture where
appropriate, adapting it for the PROMPT-002 provider shape:

```text
source_results[] -> classification -> candidates[] -> semantic_key/kind/payload/
normalized_meaning/needs_resolution -> non_fact_reason/questions[]
```

## Frozen scope

- Implement deterministic schema traversal and local reference resolution using emitted JSON-Schema forms; fail clearly for unsupported forms, missing descriptions, broken references, or cycles.
- Render output shape and all Zod-owned field, kind, payload, classification, question, and cross-field meanings from the converted schema/descriptions.
- Render only the fixed global policy sections specified in §§8–10 of the parent context, in stable order.
- Keep the semantic-kind definitions and extraction policies separate in code and provenance.
- Explicitly prevent reconciliation relationship definitions from entering the extraction prompt.
- Generate the schema, prompt, and preliminary provenance artifacts at the context's suggested paths.

Do not alter frozen descriptions, fall back to PROMPT-001's three-kind
vocabulary or field model, invent fixed semantic definitions, make provider
calls, introduce provider-specific response handling, implement semantic
finalization, or integrate production systems.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT2-02-001` | Render shape and semantic content from the converted frozen schema. | Tests/provenance show Zod structure and descriptions drive dynamic prompt sections. |
| `RC-PROMPT2-02-002` | Preserve all 16 extraction kinds and source classification. | Generated output represents each current kind and `candidate`/`non_fact`; no old three-kind fallback. |
| `RC-PROMPT2-02-003` | Preserve primary-kind and overlapping-facets behavior. | Generated content carries the reference principle; no `rule XOR constraint` implication. |
| `RC-PROMPT2-02-004` | Preserve `unresolved` versus `needs_resolution`. | Generated content reflects their orthogonality and permits a specific kind with `needs_resolution=true`. |
| `RC-PROMPT2-02-005` | Preserve fixed global extraction policy. | Role, task, references, multiple-candidate, conflict, general, source accounting, and output rules match the context's frozen wording. |
| `RC-PROMPT2-02-006` | Keep extraction separate from reconciliation. | No reconciliation schema is rendered and no reconciliation relationship definitions appear in generated output. |
| `RC-PROMPT2-02-007` | Preserve deterministic provenance ownership. | Each generated semantic section identifies schema/property, source description, and static-versus-dynamic ownership. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT2-02-IB-01` | Preserve the frozen reference and keep this prompt a derived extraction artifact with no Atlas truth authority. |
| `SR-PROMPT2-02-TB-01` | Keep offline prompt generation distinct from any future provider boundary or model execution. |
| `SR-PROMPT2-02-ID-01` | Maintain attribution from every generated semantic section to its Zod property and description. |
| `SR-PROMPT2-02-ES-01` | Keep schema conversion, traversal, extraction/reconciliation filtering, static policy, rendering, and provenance inspectable seams. |
| `SR-PROMPT2-02-PC-01` | Do not invent semantic definitions, bypass descriptions, leak reconciliation definitions, or add live/production coupling. |
| `SR-PROMPT2-02-VS-01` | Verify fixed wording, semantic distinctions, omission of reconciliation, and deterministic rendering. |
| `SR-PROMPT2-02-UP-01` | Provider governance, retention, and route qualification remain unresolved and outside this offline ticket. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT2-02-RB-01` | `SR-PROMPT2-02-IB-01`, `SR-PROMPT2-02-TB-01`, `SR-PROMPT2-02-PC-01` | Does rendering remain offline, derived, and within frozen semantic authority? | Dependency/diff inspection, fixed-section snapshots, scope checks. |
| `SR-PROMPT2-02-RB-02` | `SR-PROMPT2-02-ID-01`, `SR-PROMPT2-02-ES-01`, `SR-PROMPT2-02-VS-01` | Can reviewers trace semantic wording to source descriptions and distinguish it from policy text? | Provenance map, conversion/traversal tests, reconciliation exclusion checks. |

## Handoff

Record `PASS` or `CHANGES_REQUIRED`. On `PASS`, commit the compiler and its
intermediate artifacts, set this ticket to `awaiting_review`, and stop for
CK. Ticket -03 may start only after CK `PASS` and its own explicit `go`.
