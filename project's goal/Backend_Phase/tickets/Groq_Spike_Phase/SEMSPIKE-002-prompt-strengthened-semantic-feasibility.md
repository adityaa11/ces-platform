# SEMSPIKE-002: Prompt-strengthened bounded semantic extraction feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-02`
- **Baseline:** `SEMSPIKE-001` terminal `FAIL` at commit `0bb51e2`; that ticket, its prompt, and its evidence are immutable baseline evidence.
- **Dependencies:** unchanged existing `parseNormalizedDocument(...)`, `parseSemanticExtractionResult(...)`, `NormalizedDocument v1`, and `atlas.semantic.extract/v1`; none may change.

## Outcome and frozen scope

This is a new controlled experiment: determine whether the strengthened system
instruction below, and only that changed instruction, enables the frozen Groq
route to satisfy the same bounded semantic extraction contract as
SEMSPIKE-001. The frozen provider is Groq `openai/gpt-oss-120b` using
`GROQ_API_KEY`, non-streaming strict JSON Schema, and `reasoning_effort=medium`.

The implementation may add only isolated code under
`scripts/groq-semantic-spike-002/`, ignored evidence under
`.atlas-data/groq-semantic-spike-002/`, and this ticket's report at
`project's goal/feedback/SEMSPIKE-002-prompt-strengthened-semantic-extraction-feasibility.md`.
It must copy the SEMSPIKE-001 four-source fixture, temporary slots, intermediate
schema, deterministic finalizer, real parser calls, accounting rule, semantic
oracle, and comparison method exactly. No production runtime imports the spike.

The only experimental variable is the system instruction. The revised system
instruction must establish: extraction rather than summarization; explicit-text
authority; preservation of actor/action/object/condition/scope/modality/
negation/quantities/units/temporal constraints/exceptions/uncertainty; no
modality strengthening or weakening; no possibility-to-obligation conversion;
no example-to-requirement or descriptive-to-normative conversion; independent
semantic units where schema permits without severing qualifiers; structural
text as non-fact; ambiguity preservation; non-semantic disposition for no
business meaning; exactly one disposition per slot; source traceability; and
no Atlas IDs, accepted truth, reconciliation, winner/supersession, canonical-
ization, existing knowledge, or downstream Atlas projection. Its semantic
boundary is: *Tell Atlas exactly what the supplied text says semantically,
without deciding what Atlas should believe.*

All SEMSPIKE-001 exclusions remain: no fixture/schema/validator changes,
semantic repair post-processing, reconciliation, retrieval, existing Atlas
knowledge, production route, worker, database, queue, persistence, or route
activation. `SEMSPIKE-001` must not be modified, reopened, or remediated.

## Frozen semantic oracle

| Slot | Exact source | Required result |
| --- | --- | --- |
| S1 | `The customer submits an order.` | `candidate` containing `workflow_step`, no resolution. |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` | `candidate` containing `constraint`, preserving customer, exact `2`, product, and per-order scope. |
| S3 | `3.2 Purchase Rules` | `non_fact` structural context, never a business fact. |
| S4 | `Approval may be required before processing.` | `uncertain` containing `unresolved`, `needs_resolution=true`, and a non-empty approval-condition clarification question and reason. |

Each slot has exactly `slot`, `disposition`, `candidates`, `non_fact_reason`,
`question`, and `question_reason`. Missing, duplicate, unknown, or invalid
dispositions fail; missing model output is never `non_fact`. Atlas alone creates
evidence, exact source wording, IDs, inventory, and questions; candidates use
`payload: {}` and final output must pass the real
`parseSemanticExtractionResult(...)` unchanged.

## Review Contract

| Row | Required behavior | Required proof and pass condition |
| --- | --- | --- |
| `RC-SEMSPIKE-002-01` | Make two real authenticated calls to exactly the frozen Groq route/configuration using only the strengthened instruction. | Redacted request metadata, HTTP/model/usage/latency observations, and two terminal structured responses. |
| `RC-SEMSPIKE-002-02` | Use the identical authorized fixture through the real existing perception parser. | Four validated source units from `parseNormalizedDocument(...)`; no fixture/perception change. |
| `RC-SEMSPIKE-002-03` | Enforce exactly one valid disposition for every S1–S4. | Strict intermediate validation plus missing/duplicate/unknown negative checks; no synthesized disposition. |
| `RC-SEMSPIKE-002-04` | Preserve the frozen four-source semantic oracle. | Observed run matrices prove S1 workflow step, S2 `constraint` with `2`/per-order scope, S3 non-fact, S4 question-bearing `unresolved`. |
| `RC-SEMSPIKE-002-05` | Atlas retains semantic-v1 identity/evidence authority. | Deterministic finalizer uses trusted fixture source mapping and real `parseSemanticExtractionResult(...)` accepts each live result. |
| `RC-SEMSPIKE-002-06` | Compare equivalent live executions and baseline fairly. | Run-1/run-2 semantic comparison, SEMSPIKE-001 comparison, report, directly affected tests, and `git diff --check`; material variation is retained. |

## Security readiness

`SecurityReadiness: applicable`. The inherited boundaries are: only the
non-confidential S1–S4 fixture reaches Groq; the provider is an untrusted
proposal with no truth/review/publication authority; Atlas alone owns IDs,
locators, evidence, and persistence identity; `GROQ_API_KEY` remains
environment-only and absent from logs, artifacts, and reports. Required seams
are strict intermediate transport validation, deterministic finalization with
the real parser, redacted metrics/comparison, exact source accounting, and
credential-safe artifact inspection. The spike must not couple to production
runtime, weaken contracts/accounting/identity, or record credentials. Production
retention, governance, access control, and residency remain unresolved policy.

## Validation and handoff

Run local fixture/accounting/finalizer tests, two live calls, intermediate
validation, finalization, the real semantic parser, directly affected Atlas
contract tests, `git diff --check`, and a credential/header inspection. The
report must state one truthful terminal `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`; all six review rows; source and integrity matrices;
provider/model/configuration; token/latency observations; the baseline
comparison; limitations; and one next recommendation. It must state
`Candidate payload semantics were not qualified by SEMSPIKE-002.` A `FAIL` is a
valid terminal result. Set this ticket to `awaiting_review` and stop for CK.
