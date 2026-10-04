# SEMTRACE-001: Raw semantic understanding trace

- **State:** `awaiting_review`
- **Review batch:** `SEMTRACE-BATCH-01`
- **Implementation context:** [Atlas SEMTRACE-001 Implementation Context](../../atlas-semtrace-001-implementation-context.md)
- **Predecessor:** frozen `SEMSPIKE-003` evidence, including its S4 failure. Do not modify, reopen, or remediate any SEMSPIKE ticket, report, evidence, or script.

## Outcome and frozen scope

This is a deliberately small diagnostic experiment. It determines whether
Groq `openai/gpt-oss-120b` understands the raw semantics of the frozen S1-S4
sources when the Atlas extraction/application contract is absent. It tests the
following mutually exclusive explanations for the SEMSPIKE-003 S4 result:

- **H1 — model semantic-capability failure:** the model does not reliably
  preserve the S4 distinction.
- **H2 — representation/contract loss:** the model understands S4, but loses
  that meaning while producing Atlas-oriented disposition, kind, and resolution
  fields.

This ticket is not an Atlas extraction test, prompt-tuning exercise, production
integration, or architecture implementation. A semantic `FAIL` is a completed,
useful result and must not trigger remediation or a new ticket.

## Frozen inputs and transport

Use the same immutable four-source fixture as SEMSPIKE-002/003, preferably by
calling the real existing `parseNormalizedDocument(...)` path without importing
any Atlas semantic-mapping behavior:

| Slot | Source text |
| --- | --- |
| S1 | `The customer submits an order.` |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` |
| S3 | `3.2 Purchase Rules` |
| S4 | `Approval may be required before processing.` |

Make exactly two authenticated, non-streaming live calls with `GROQ_API_KEY`,
provider `Groq`, model `openai/gpt-oss-120b`, `reasoning_effort=medium`, and
strict JSON Schema. The user message contains only the four `{ slot, text }`
objects—no instruction, expected output, Atlas policy, or oracle hint. Do not
make an adaptive retry or alter any input between runs.

The system instruction is supplied planning authority. Copy Section 5 of the
implementation context verbatim into one obvious constant; do not rewrite,
expand, shorten, append to, or vary it. Before a semantic verdict, compute its
UTF-8 SHA-256 and stop invalid if it is not:

```text
9d00f115bfe5d6c3e08edfb6aa577917386fe6ffb0b9210ad9d53fccc326550c
```

Implement isolated code only, preferably beneath
`scripts/groq-semantic-trace-001/`, with ignored evidence beneath an
equivalently named `.atlas-data/` directory. No production application may
import this experiment.

## Neutral semantic representation

Create a new strict JSON Schema containing only an `observations` list. It
must contain exactly one observation for every S1-S4 slot and no other slot.
Each observation has exactly these semantic fields:

| Field | Allowed values / requirement |
| --- | --- |
| `slot` | `S1`, `S2`, `S3`, or `S4` |
| `semantic_role` | `business_proposition` or `structural_text` |
| `proposition` | faithful source meaning; empty only for structural text |
| `epistemic_status` | `certain`, `probable`, `possible`, `underspecified`, or `not_applicable` |
| `polarity` | `positive`, `negative`, `underspecified`, or `not_applicable` |
| `stated_conditions` | explicit source conditions only |
| `unresolved_information` | source-unspecified information only; not a clarification question |

Do not reuse the SEMSPIKE-002/003 intermediate schema or add any Atlas-facing
field, including `candidate`, `kind`, `workflow_step`, `constraint`,
`unresolved`, `needs_resolution`, `disposition`, `question`, `evidence`,
identity, reconciliation, publication, or projection concepts.

Deterministic code may validate JSON/schema integrity, exactly-once slot
accounting, enum validity, structural-text invariants, malformed responses, and
credential leakage only. It must never repair, rewrite, infer, reclassify, or
semantically post-process provider output.

## Frozen semantic oracle

| Slot | Required semantic result |
| --- | --- |
| S1 | A positive, certain business proposition preserving customer, submits, and order; no invented unresolved information. |
| S2 | A positive business proposition preserving customer, purchasing, maximum quantity exactly `2`, products, and per-order scope; faithful Indonesian or English wording is allowed. |
| S3 | Structural text with `proposition = ""`, `epistemic_status = not_applicable`, `polarity = not_applicable`, and empty condition/unresolved lists; never invent a business rule. |
| S4 | A positive business proposition preserving approval, a possible requirement, and approval before processing. `epistemic_status = possible`; do not make approval definite, unconditional, or always required. `stated_conditions` is empty unless literally supported—the temporal ordering is not an applicability condition. `unresolved_information` preserves that the source does not establish whether or when approval is required, without inventing the answer or a named hidden condition. |

The central closure oracle is:

```text
Approval may be required before processing.
!=
Approval is required before processing.
```

## Review contract

| Row | Exact bounded behavior | Binary evidence and closure oracle |
| --- | --- | --- |
| `RC-SEMTRACE-001-01` | Preserve the frozen provider configuration, fixture, data-only user boundary, and verbatim instruction. | Redacted request metadata, parsed fixture, and recorded instruction hash. **PASS iff** the hash equals the frozen value and only S1-S4 reach the provider. |
| `RC-SEMTRACE-001-02` | Use the new neutral strict schema with complete source accounting. | Schema/negative tests and each live response. **PASS iff** both have exactly one valid observation for each authorized slot and no Atlas-facing field. |
| `RC-SEMTRACE-001-03` | Keep validation transport-only and the provider output untrusted evidence. | Runner and tests. **PASS iff** no semantic repair, corrective retry, reclassification, or schema-to-Atlas finalization occurs. |
| `RC-SEMTRACE-001-04` | Perform exactly two equivalent authenticated live executions. | Redacted run-1/run-2 metrics: provider, model, HTTP status, latency, input/output tokens, reasoning effort, strict-output mode, instruction hash, and source count. **PASS iff** both valid runs use the frozen configuration without adaptive changes. |
| `RC-SEMTRACE-001-05` | Evaluate raw meaning against the frozen S1-S4 oracle. | Per-run semantic-outcome matrix and safely quoted structured outputs. **PASS iff** every required meaning is preserved, especially S4 `possible` rather than certain/unconditional. |
| `RC-SEMTRACE-001-06` | Report the bounded result truthfully and preserve isolation and credential safety. | Concise report, affected tests, `git diff --check`, and artifact inspection. **PASS iff** the report compares both runs with SEMSPIKE-003 S4, limits its conclusion to H1/H2, and contains no credential or Authorization material. |

## Terminal classification and stop conditions

Record exactly one terminal result: `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`.

- `PASS` requires both valid live runs to meet all S1-S4 oracle rows. It is
  evidence consistent with H2; it permits only a separately authored proposal
  for a neutral-observation-to-deterministic-Atlas-compiler experiment.
- `PASS_WITH_LIMITS` requires the same semantic success plus a recorded
  non-oracle limitation. It never excuses an S4 miss.
- `FAIL` applies when either valid run violates an oracle. Preserve the failure,
  conclude H2 is not sufficiently supported by this model, and do not create
  SEMSPIKE-004 automatically.
- `ENVIRONMENT_BLOCKED` applies only when authenticated execution cannot yield
  the required valid runs because of environment or provider failure—not a
  semantic miss.

Stop and report rather than changing the frozen instruction, fixture, oracle,
schema semantics, provider, model, or reasoning effort. Stop as `SCOPE_CHANGE`
if completion would require production routing, a database/queue/worker change,
`NormalizedDocument v1` or semantic-parser modification, Docling work,
reconciliation, projection, embeddings, vector storage, batching, or large-PDF
handling.

## Evidence and handoff

Create `project's goal/feedback/SEMTRACE-001-raw-semantic-understanding.md`.
It must record the terminal verdict; branch/commit/worktree state;
provider/model/configuration; frozen instruction hash; source integrity;
redacted metrics for both runs; both S1-S4 outcome matrices; exact or safely
quoted structured outputs; semantic differences; direct SEMSPIKE-003 S4
comparison; an H1/H2-limited conclusion; the next action allowed by the
verdict; and credential/header safety confirmation.

Do not claim that Atlas semantics, production extraction, large-PRD extraction,
RPD economics, or reconciliation are solved. Once one terminal classification
is supported, set the ticket to `awaiting_review` and stop for CK. CK may review
only the frozen experiment evidence and does not authorize integration.
