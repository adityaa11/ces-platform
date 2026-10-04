# SEMSPIKE-004: Minimal semantic envelope feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-04`
- **Implementation context:** [Atlas SEMSPIKE-004 Implementation Context](../../atlas-semspike-004-minimal-semantic-envelope-implementation-context.md)
- **Predecessor:** frozen `SEMTRACE-001` result. Preserve its artifacts and history; do not reopen or remediate it.
- **S4 oracle clarification:** `HMN-SEMSPIKE-004-001 — CLARIFY_S4_ENVELOPE_SEMANTICS`.
- **GO authorization:** `HMN-SEMSPIKE-004-002 — AUTHORIZE_DIAGNOSTIC_PREDECESSOR_STATE_BYPASS`.

## Outcome and frozen scope

Determine whether Groq `openai/gpt-oss-120b` preserves the S1-S4 semantic quality demonstrated by free-form `SEMTRACE-001` when asked to package those meanings in the minimal JSON envelope. The experiment tests ordinary, unconstrained generation: the request asks for JSON but uses no provider-enforced schema, tools, or function calls.

This is one atomic diagnostic spike. Fixture validation, instruction-integrity check, exactly two live runs, transport parsing, semantic evaluation, comparison, and report are one proof. A packaging or semantic `FAIL` is a completed result, not a reason to tune or retry.

Do not test or implement Atlas extraction, deterministic compilation, reconciliation, production integration, batching, large PRDs, embeddings, retrieval, RPD economics, or provider/model selection. Do not modify earlier spikes, `NormalizedDocument v1`, production semantic contracts/parsers, or Docling behavior. No production application may import spike code.

## Frozen inputs and provider request

Use the same exact S1-S4 fixture as SEMSPIKE-002/003 and SEMTRACE-001, preferably validated by the existing `parseNormalizedDocument(...)` path without changing its output or semantics:

| Slot | Source text |
| --- | --- |
| S1 | `The customer submits an order.` |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` |
| S3 | `3.2 Purchase Rules` |
| S4 | `Approval may be required before processing.` |

Make exactly two authenticated live calls, both identical in all inputs and configuration:

| Setting | Frozen value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| `stream` | `false` |
| `reasoning_effort` | `medium` |
| Tools / functions | none |
| `response_format` / JSON Schema | omitted |
| Credential | existing `GROQ_API_KEY` environment variable only |
| Calls | exactly 2; no retry, fallback, or prompt mutation |

The system instruction in Section 6 of the implementation context is frozen planning-authority text. Put it in one obvious constant verbatim, and verify its UTF-8 SHA-256 before either live call:

```text
c80d619bf5272fd104029e1b466b1b597deeaf16d8e67b47658ff7cb78c90edd
```

A hash mismatch invalidates the experiment; stop without a semantic verdict. The user message contains only the four `{ slot, text }` source objects. It must not contain the oracle, examples, expected S4 wording, Atlas rules, semantic labels, or clarification questions.

Preserve raw model text before parsing. Record redacted provider, model, HTTP status, latency, input/output tokens, reasoning effort, instruction hash, source count, and `structured-output mode = none`. Never expose or persist the API key or Authorization header in logs, reports, or evidence.

## Minimal envelope and validation boundary

The only allowed output shape is:

```ts
interface MinimalSemanticObservation {
  slot: "S1" | "S2" | "S3" | "S4";
  structural_only: boolean;
  meaning: string;
  qualifications: string[];
  unspecified: string[];
}

interface MinimalSemanticEnvelope {
  observations: MinimalSemanticObservation[];
}
```

This is a local parser contract only, never a provider-enforced schema. There are no semantic enums or Atlas-facing classifications. Do not add fields or concepts listed as prohibited in Section 9 of the implementation context; if one appears necessary, stop as `SCOPE_CHANGE`.

Local deterministic code may verify JSON parseability, exact top-level and observation fields, four observations, exactly-once S1-S4 accounting in source order, field types, and the structural/non-structural shape rules. It may also check credential/header safety. It must not repair malformed JSON, rewrite or move model text, infer content, classify semantics, call another model, or make a corrective retry. Preserve invalid raw output and record packaging failure.

## Frozen semantic oracle

Evaluate meaning semantically, not by exact string:

| Slot | Required result |
| --- | --- |
| S1 | Preserve customer, submission, and order, without invented uncertainty or conditions. It is non-structural with non-empty `meaning`; `unspecified` is empty. |
| S2 | Preserve customer/pelanggan, purchasing, maximum exactly `2`, product, and single-order scope. Indonesian or English is acceptable; do not weaken the restriction. |
| S3 | Heading only: `structural_only = true`, with empty `meaning`, `qualifications`, and `unspecified`. Do not invent a proposition. |
| S4 | Across the combined `meaning`, `qualifications`, and `unspecified` content, preserve approval as possibly/maybe required, not definite, unconditional, or always required; preserve `before processing` as temporal ordering (if approval is required, it precedes processing); do not make that temporal phrase the applicability condition; do not invent a hidden condition, trigger, circumstance, actor, or answer. Applicability uncertainty may be stated explicitly, but `unspecified` may be empty when the same uncertainty is faithfully preserved in another text field. Evaluate the complete observation without enforcing semantic field placement. |

The primary S4 oracle is possible requirement plus temporal ordering and no invented applicability, evaluated across all three text fields. The examples in the implementation context are oracle/evaluation guidance only and must not be sent to the model.

## Review Contract

| Row | Required proof | Closure condition |
| --- | --- | --- |
| `RC-SEMSPIKE-004-01` | Frozen instruction constant, hash verification, source fixture, and source-only user message. | **PASS iff** the expected instruction hash is verified before calls and only the authorized S1-S4 source data is sent. |
| `RC-SEMSPIKE-004-02` | Exact provider configuration and two equivalent live executions, with redacted metrics. | **PASS iff** both calls use the frozen route and settings, omit `response_format`, tools, and functions, and no adaptive retry or mutation occurs. |
| `RC-SEMSPIKE-004-03` | Local envelope parser and negative/shape checks. | **PASS iff** only transport/container rules are validated, including exactly-once ordered slots and no additional fields; malformed output is preserved without repair. |
| `RC-SEMSPIKE-004-04` | Per-run S1-S4 semantic outcome matrix and safely quoted structured output. | **PASS iff** both runs meet the complete frozen oracle, especially S2 exact quantity/scope, S3 structural-only behavior, and S4 possibility and temporal relation without an invented applicability condition, assessed across the combined text fields. |
| `RC-SEMSPIKE-004-05` | Report comparison to frozen SEMSPIKE-003 and SEMTRACE-001 evidence. | **PASS iff** it states that SEMSPIKE-003's Atlas-oriented contract failed S4, corrected free-form SEMTRACE-001 passed S1-S4 twice, and this spike tests only minimal packaging; conclusions do not exceed the evidence. |
| `RC-SEMSPIKE-004-06` | Isolation, credential safety, and reviewable evidence. | **PASS iff** spike code is isolated, report/evidence contain no credential or Authorization material, and affected checks plus `git diff --check` are recorded. |

## Terminal classification and stop conditions

Record exactly one: `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or `ENVIRONMENT_BLOCKED`.

- `PASS` requires both live runs to parse, satisfy the minimal envelope, meet every semantic oracle row, and preserve S4's possible requirement and temporal ordering without an invented applicability condition across the combined text fields. `unspecified` may be empty when the same uncertainty is faithfully preserved in `meaning` or `qualifications`. The result must contain no Atlas-facing classification. It supports only planning a separate next experiment for the smallest additional structure needed for deterministic Atlas compilation.
- `PASS_WITH_LIMITS` requires the same complete semantic success plus a material non-oracle limitation. It cannot excuse malformed JSON or any oracle miss.
- `FAIL` applies to any authenticated provider response with malformed JSON, invalid envelope/accounting, forbidden fields, or an S1-S4 semantic miss. Preserve the output; do not remediate the prompt, enable strict schema, add fields, or retry.
- `ENVIRONMENT_BLOCKED` applies only when provider/environment failure prevents the scheduled calls from yielding model output. Malformed or semantically incorrect output is `FAIL`.

Stop as `SCOPE_CHANGE` if completion requires changes to production extraction, `NormalizedDocument v1`, Atlas semantic parser/contracts, Docling, reconciliation, embeddings, vector storage, retrieval, batching, large-PDF support, another provider/model, or any other explicit non-goal. Do not change the frozen prompt, envelope, oracle, fixture, provider settings, or call count.

## Security readiness

- **Status:** `applicable`
- **Inherited boundaries:** `SR-004-IB-01` preserves the frozen fixture and source-only user message; `SR-004-IB-02` preserves the Groq/model/call-count configuration; `SR-004-IB-03` preserves spike isolation and the ban on production imports.
- **Trust boundaries:** `SR-004-TB-01` source text crosses to Groq; `SR-004-TB-02` provider output remains untrusted until local transport validation and semantic evaluation. Parsing is not semantic authority.
- **Sensitive assets:** `SR-004-SA-01` is `GROQ_API_KEY` and Authorization material. Keep these environment/request-only and out of logs and artifacts.
- **Identity context:** `SR-004-ID-01` retain run identity/order and frozen configuration in redacted metrics so the two executions can be compared; no user identity is required by this experiment.
- **Extension seams:** `SR-004-ES-01` keep provider execution, raw response preservation, parser validation, semantic evaluation, and report/evidence distinct enough for future policy to attach without expanding this contract. Do not add production routing or persistent provider state.
- **Prohibited couplings:** `SR-004-PC-01` provider-enforced schemas; `SR-004-PC-02` Atlas semantic categories; `SR-004-PC-03` output repair, retry, or fallback model; `SR-004-PC-04` production imports or routing.
- **Verification seams:** route/request shape and run identity; raw-output preservation and transport-only validation; secret-safe metrics/artifacts; isolated spike code; semantic oracle comparison. No additional security policy is selected here.
- **Planning findings:** none within the supplied bounded context.
- **Review bindings:**
  - `SR-004-RB-01` verifies `SR-004-TB-01` and `SR-004-IB-01`: confirm the request contains only frozen source data. Evidence: captured/redacted request metadata and fixture check (`RC-SEMSPIKE-004-01`).
  - `SR-004-RB-02` verifies `SR-004-IB-02` and `SR-004-ID-01`: confirm both runs use the frozen route/configuration and remain distinguishable. Evidence: redacted run metrics and request-shape inspection (`RC-SEMSPIKE-004-02`).
  - `SR-004-RB-03` verifies `SR-004-TB-02` and `SR-004-ES-01`: confirm provider output is preserved and only transport/container validation occurs without repair or semantic reclassification. Evidence: parser behavior and negative/shape checks (`RC-SEMSPIKE-004-03`).
  - `SR-004-RB-04` verifies `SR-004-SA-01`: confirm the credential and Authorization material do not enter reports, logs, or artifacts. Evidence: artifact and logging inspection (`RC-SEMSPIKE-004-06`).
  - `SR-004-RB-05` verifies `SR-004-IB-03` and `SR-004-PC-04`: confirm all spike code and artifacts remain isolated from production imports. Evidence: dependency/import and artifact-path inspection (`RC-SEMSPIKE-004-06`).
  - `SR-004-RB-06` verifies `SR-004-PC-01`, `SR-004-PC-02`, and `SR-004-PC-03`: confirm there is no constrained schema, Atlas category, repair, retry, or fallback. Evidence: request inspection, runner review, and run record (`RC-SEMSPIKE-004-02`, `RC-SEMSPIKE-004-03`).
  - `SR-004-RB-07` verifies semantic boundary at `SR-004-TB-02`: confirm both outputs are evaluated against the frozen oracle without changing model text. Evidence: per-run S1-S4 outcome matrices (`RC-SEMSPIKE-004-04`).

## Evidence and handoff

Implement only isolated spike mechanics, preferably under `scripts/groq-semantic-spike-004/`. Put ignored run evidence under `.atlas-data/groq-semantic-spike-004/`. Create the report at `project's goal/feedback/SEMSPIKE-004-minimal-semantic-envelope.md`.

The report records terminal classification; branch/commit/worktree state; provider configuration and instruction hash; fixture integrity; redacted metrics for both runs; both semantic outcome matrices and safely quoted outputs; comparison with SEMSPIKE-003 and SEMTRACE-001; limitations; allowed next action; and credential/header safety. Preserve the raw response before parsing in ignored evidence. Do not place secrets in any report or artifact.

## GO checkpoint

Terminal result: `FAIL`. Both live responses were valid envelopes, but each
violated the frozen S1 expectation that `unspecified` be empty. See the
[SEMSPIKE-004 execution report](../../../feedback/SEMSPIKE-004-minimal-semantic-envelope.md)
for the redacted metrics, raw-output evaluation, validation evidence, and
`## Review Contract Closure`. GO consumed
`HMN-SEMSPIKE-004-002 — AUTHORIZE_DIAGNOSTIC_PREDECESSOR_STATE_BYPASS`; all
predecessor states and artifacts remain unchanged.

Implementation commit: `39b06dd` (`SEMSPIKE-004 minimal semantic envelope diagnostic`).

Review Contract Closure: `RC-SEMSPIKE-004-01` through `-06` have evidence
recorded in the report. All proof obligations were exercised; `RC-004-04`
records the truthful semantic `FAIL`, a permitted completed outcome. Internal
readiness: `READY_FOR_CK`.
