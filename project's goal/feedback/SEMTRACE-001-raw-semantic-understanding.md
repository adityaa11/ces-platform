# SEMTRACE-001 raw semantic understanding trace

- **State:** `awaiting_review`
- **Review batch:** `SEMTRACE-BATCH-01`
- **Terminal result:** `ENVIRONMENT_BLOCKED`
- **GO authorization:** `HMN-SEMTRACE-001-001 — AUTHORIZE_DIAGNOSTIC_PREDECESSOR_BYPASS`

## Scope and baseline

The authorization allows this one diagnostic experiment to use SEMSPIKE-003 as
frozen comparison material while it remains `awaiting_review`. It does not
approve, modify, remediate, reinterpret, or mark SEMSPIKE-003 as PASS.

Execution started on branch `codex/new-atlas-backend` at
`5b74dfb0c0282444b6660f3a5b425fcd37534e55`. The shared worktree already
contained unrelated user changes; they were preserved and excluded from this
checkpoint.

The experiment code is isolated in `scripts/groq-semantic-trace-001/`. No
production route, semantic contract/parser, queue, database, worker, fixture
wording, or SEMSPIKE file was changed.

## Configuration and source integrity

| Item | Recorded value |
| --- | --- |
| Provider / model | Groq / `openai/gpt-oss-120b` |
| Stream / tools | non-streaming / none |
| Reasoning effort | `medium` |
| Structured output | strict JSON Schema (`semantic_trace_observation`) |
| Frozen instruction SHA-256 | `9d00f115bfe5d6c3e08edfb6aa577917386fe6ffb0b9210ad9d53fccc326550c` |
| Parsed fixture | real `parseNormalizedDocument(...)` succeeds; four exact S1–S4 sources |
| Parsed source hash | `3feffb8c3b02f53c3c21c02fd021ff309779db5962e30c4d8d91f102dab78292` |
| User boundary | data-only `{ sources: [{ slot, text }] }`; only S1–S4 are constructed |

The harness validates the frozen instruction hash before attempting a request.
Its local checks reject missing, duplicate, invented, and Atlas-facing fields;
they do not repair, infer, reclassify, finalize, or semantically alter provider
output.

## Two scheduled run records

| Run | Provider/model | HTTP status | Latency | Input/output tokens | Result |
| ---: | --- | --- | --- | --- | --- |
| 1 | Groq / `openai/gpt-oss-120b` | 200 | not retained after invalid structural response | not retained after invalid structural response | Provider response violated the structural-text invariants; it was not a valid trace. |
| 2 | Groq / `openai/gpt-oss-120b` | 200 | 2,527 ms | 856 / 989 | Structurally valid, but is only one of the two required valid runs. |

Both calls used the unchanged configuration and no retry, prompt adaptation,
provider/model substitution, or semantic repair occurred. The redacted run
records and normalized fixture are retained only under ignored
`.atlas-data/groq-semantic-trace-001/`. Run 1 was rejected because its
structural-text observation did not meet the mandated empty/
`not_applicable` fields; the provider output is consequently not eligible as a
semantic trace.

## Semantic outcome matrix and SEMSPIKE-003 comparison

One authenticated, structurally valid provider output exists. It preserved S1
as a certain positive proposition, S2's Indonesian wording and exact `2` /
per-order scope, and S3 as structural text. Its S4 observation was safely
quoted as `epistemic_status = possible`, proposition `Approval may be required
before processing.`, and unresolved information `whether approval is
required`; however, it incorrectly placed `before processing` in
`stated_conditions`. The frozen oracle treats temporal ordering as distinct
from an applicability condition, so this single output would not pass S4.

There is no two-run semantic matrix: run 1 was structurally invalid and run 2
alone cannot classify the experiment. In particular, the evidence does not
support an H1/H2 conclusion.

SEMSPIKE-003 remains the untouched baseline: both of its authenticated runs
classified S4 as a resolved rule rather than question-bearing unresolved
meaning. SEMTRACE-001 neither confirms nor refutes H1 or H2 because its two
required authenticated executions were unavailable.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| RC-SEMTRACE-001-01 | Frozen provider configuration, fixture, data-only boundary, and verbatim instruction hash | `scripts/groq-semantic-trace-001/{fixture,groq-client,test}.mts`; exact hash and four-source parsed fixture pass. Both HTTP 200 calls used the frozen configuration. | PROVEN |
| RC-SEMTRACE-001-02 | Neutral strict schema with exactly-once source accounting in each response | `schema.mts` plus negative checks in `test.mts` pass. Run 2 was fully accounted; run 1 failed structural validation. | BLOCKED_ENVIRONMENT |
| RC-SEMTRACE-001-03 | Transport-only validation; no semantic repair/retry/finalization | Isolated runner/schema and local test inspection; no Atlas semantic imports or finalization path. | PROVEN |
| RC-SEMTRACE-001-04 | Exactly two equivalent authenticated valid executions with redacted metrics | `run.mts` made two unchanged HTTP 200 calls. Only run 2 was structurally valid; no second valid execution exists. | BLOCKED_ENVIRONMENT |
| RC-SEMTRACE-001-05 | Per-run S1–S4 semantic-oracle matrix and safe structured outputs | Run 2 safely records its output and fails S4's temporal-ordering/condition distinction; run 1 is structurally invalid. | BLOCKED_ENVIRONMENT |
| RC-SEMTRACE-001-06 | Truthful bounded report, isolation, diff/test and credential safety | This report; ignored evidence directory; no API key or Authorization material is recorded. | PROVEN |

## Validation

```text
node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-trace-001/test.mts
PASS — fixture, frozen-instruction hash, neutral schema, source accounting, and structural invariants

node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-trace-001/run.mts
ENVIRONMENT_BLOCKED — two scheduled HTTP 200 calls; run 1 is structurally invalid and run 2 is the only valid trace
```

Credential/header safety: confirmed. The committed code reads only
`GROQ_API_KEY` at runtime; no credential or Authorization value is logged,
persisted, or included here. Artifact inspection found only redacted errors,
fixture content, and configuration metadata.

## Conclusion and next action

`ENVIRONMENT_BLOCKED` is the only supported terminal classification because
the provider did not yield the two valid traces required by the frozen
protocol. It is not a semantic `FAIL`, `PASS`, or `PASS_WITH_LIMITS`, and it
supplies no H1/H2 conclusion. Any future attempt requires new workflow
authorization and must retain the frozen instruction, fixture, schema
semantics, provider, model, and reasoning effort.

Internal readiness: READY_FOR_CK (the frozen ticket explicitly defines
`ENVIRONMENT_BLOCKED` for inability to obtain authenticated valid runs; this
is a handoff readiness statement, not a self-issued PASS).
