# SEMIR-001: Semantic qualification corpus and frozen interpretation expectations

- **State:** `awaiting_review`
- **Review batch:** `SEMIR-BATCH-01`
- **Implementation context:** [SEMIR context §§7–17](../../SEMIR-context.md)
- **Start gate:** explicit `go`; no provider route, credential, or live call is needed or permitted.

## Outcome

Create the human-authored requirements corpus that defines Semantic IR v0 qualification before an IR schema is frozen. The corpus is the specification for later tickets, not a collection of model-training prompts or desired JSON examples.

## Frozen scope

- Add at least 30 small, reviewable cases (target 36–48) with authorized source text, a stable case ID, source-disposition expectation, and dimension-based semantic expectations.
- Cover basic proposition structure; all six semantic forces; polarity; conditions/triggers; quantity/scope; state; relations/cardinality; epistemic incompleteness; discourse/source accounting; at least three multi-proposition sources; and context-free versus context-dependent classification.
- Include the mandatory contrast sets A–E exactly in semantic effect: modal force; the three meanings of `may`; applicability; negation; and condition versus trigger.
- Define explicit positive and prohibited interpretations, including the nested `possibility(obligation(...))` and missing-applicability case for `Approval may be required before processing.`

Do not call a provider, create an IR schema, encode fixture answers as extraction heuristics, alter `NormalizedDocument v1`, alter production semantic contracts, add canonical vocabulary, or implement context retrieval/reconciliation.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMIR-001-01` | Corpus is corpus-first and human-authored. | At least 30 cases have stable IDs, authorized source text, dimension expectations, and no provider-derived answer is treated as authority. |
| `RC-SEMIR-001-02` | All required families are represented. | A coverage matrix maps every §13 family to one or more cases; missing actor/object/condition/trigger/threshold/scope/timing/outcome and ambiguity are explicit. |
| `RC-SEMIR-001-03` | Contrast sets preserve material meaning. | A–E are reviewable as minimally differing source cases and require distinct expected dimensions. |
| `RC-SEMIR-001-04` | Discourse and source disposition remain independent. | Heading/label/non-semantic, example, rationale, reference, semantic-with-unresolved, and valid `needs_review` cases are distinguishable. |
| `RC-SEMIR-001-05` | Multi-proposition and context classification are explicit. | At least three sources require more than one proposition; each case is marked context-free or context-dependent without solving context-dependent interpretation. |
| `RC-SEMIR-001-06` | Corpus does not pre-decide architecture or provider behavior. | No schema-specific workaround, lexical shortcut, canonical entity/relation, production route, or provider call is introduced; affected tests and `git diff --check` pass. |

## Deliverables and validation

Place corpus data and a compact coverage/authoring guide in an isolated semantic-IR test location. Expectations must describe meaning dimensions—not exact serialized output—and include source disposition, propositions, modality/polarity/qualifiers where applicable, unresolved meaning, evidence expectations, and prohibited interpretations.

Run deterministic corpus-shape/coverage checks if introduced, affected local/package tests, and `git diff --check`. Record zero provider calls. Commit only fixtures, checks, and concise evidence-safe documentation.

## Security readiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-001-IB-01` | Corpus source is limited to non-confidential, authorized fixture text; it is not DocumentStore discovery or project fact retrieval. |
| `SR-001-TB-01` | No external-provider trust transition exists in this ticket; preserve the later attachment point by recording source authorization/provenance per fixture. |
| `SR-001-ES-01` | Keep corpus definition separate from schema, extraction, validation implementation, and production semantics. |
| `SR-001-PC-01` | Do not encode canonicalization, reconciliation, lexical extraction rules, or provider answers in corpus expectations. |
| `SR-001-VS-01` | Validate coverage, stable IDs, source disposition, contrast-set distinctness, and zero live calls. |
| `SR-001-UP-01` | Provider/data-retention and future context-authority policy remain unresolved. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-001-RB-01` | `SR-001-IB-01`, `SR-001-TB-01` | Is every fixture source authorized and safely bounded? | Fixture inventory/provenance and no-provider-call record. |
| `SR-001-RB-02` | `SR-001-ES-01`, `SR-001-PC-01` | Are expectations semantic requirements rather than hidden extraction or truth logic? | Corpus and test/code-path review. |
| `SR-001-RB-03` | `SR-001-VS-01` | Does the coverage proof close all mandatory families and contrasts? | Coverage matrix and deterministic validation output. |

## Handoff

Set `awaiting_review` only after every review row passes and the corpus is frozen for SEMIR-002. Any case that cannot be expressed as a clear human expectation is a planning finding; do not omit or silently reinterpret it.
