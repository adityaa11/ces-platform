# SEMSPIKE-007: Anthropic Claude Sonnet 5.5 Semantic IR qualification

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-07`
- **Implementation context:** [SEMSPIKE-007 Anthropic Claude Sonnet 5.5 implementation context](../../SEMSPIKE-007-anthropic-sonnet-5-5-implementation-context.md)
- **Baseline checkpoint:** `68cd835` (frozen SEMSPIKE-006 `ENVIRONMENT_BLOCKED` result)
- **Required provider-wire remediation:** `2da8577` (`fix(semir): flatten provider wire unions`)
- **Start gate:** frozen SEMIR-001 through SEMIR-004 semantic authority, the ticket-local offline gate, explicit `go`, and an authenticated Anthropic route.

## Outcome and frozen scope

Determine whether `claude-sonnet-5-5` can produce the existing full
12-result Semantic IR provider-wire envelope twice, correctly and stably,
using the official Anthropic structured-output path. This is a sibling
provider qualification to SEMSPIKE-006, not a remediation of it.

The following are frozen and must not be changed: SEMIR corpus meaning,
Semantic IR schema, semantic mutation expectations, oracle, evidence/source
accounting, modality/polarity/condition/trigger/temporal/quantity/state/
unresolved/discourse semantics, the 12 cases, and the semantic instruction.
Do not compact, batch, weaken, redesign, or fixture-special-case the IR.

The LLM is an untrusted semantic proposer. It creates neither canonical Atlas
truth nor authority for reconciliation, publication, or projection.

## Frozen qualification input

Use this exact ordered subset exactly once per request:

```text
SEMIR-001-021
SEMIR-001-003
SEMIR-001-002
SEMIR-001-006
SEMIR-001-007
SEMIR-001-004
SEMIR-001-009
SEMIR-001-022
SEMIR-001-010
SEMIR-001-020
SEMIR-001-035
SEMIR-001-038
```

It covers simple proposition, obligation, permission, possibility, nested
possibility plus obligation and unresolved applicability, prohibition,
condition/scope, missing actor, quantity/threshold, state transition, example
versus universal rule, and non-semantic heading. Preserve all three `may`
contrasts, including `Approval may be required before processing.`; its known
meaning is possibility plus obligation before processing with unresolved
applicability, not unconditional obligation or permission.

Copy the implementation context's Section 5 instruction body verbatim. Before
live execution, compute its UTF-8 SHA-256 and require:

```text
6434e0bb731db27b082008ac7e80b5750b7a856e6cd8745f93fbc93a8ddc6144
```

The user payload contains only the ordered authorized `{ sourceSlot, text }`
entries. It must not include expected dimensions, oracle answers, mutation or
known-good fixtures, labels, prohibited interpretations, or case-specific
hints.

## Frozen provider and transport profile

| Setting | Frozen value |
| --- | --- |
| Provider / endpoint | Anthropic / official Claude Messages API |
| Model | `claude-sonnet-5-5` |
| SDK / structured output | `@anthropic-ai/sdk`, `client.messages.parse(...)`, `zodOutputFormat(envelopeSchema)` |
| Thinking / effort | `{ type: "adaptive" }` / `high` |
| Streaming | `false` |
| Maximum output | `max_tokens: 16000` |
| Sampling | Omit `temperature`, `top_p`, and `top_k` |
| Calls | Exactly two equivalent authenticated calls |
| Retry / fallback / repair | None |
| Credential | `ANTHROPIC_API_KEY` from process environment only |

Use the existing provider-wire Zod envelope as the semantic contract. Let
Anthropic's Zod helper make its provider-specific schema transformation; do
not send Groq's serialized `providerJsonSchema` or deprecated raw
`output_format`. Provider-side transformation may adapt unsupported transport
constraints, but local validation must retain `results.length === 12`.

If offline analysis shows the frozen `16000` ceiling cannot contain the
expected envelope, stop for planning authority before any provider call. Never
raise it in this ticket.

## Offline release gate

Before the first authenticated call, prove every row below. The provider-call
count must still be zero.

| Gate | Required proof |
| --- | --- |
| Corpus / IR / oracle / harness | SEMIR-001 corpus, SEMIR-002 schema, SEMIR-003 oracle-mutation, and SEMIR-004 NormalizedDocument harness gates pass unchanged. |
| Provider wire | Existing provider-wire round trip passes using the post-`2da8577` contract. |
| Anthropic schema | The helper-generated schema has `additionalProperties: false` on objects; no recursion, external `$ref`, unsupported numeric/string/array bounds, unsupported `allOf` + `$ref`, or invalid `anyOf`; it can represent every known-good fixture. |
| Frozen identity | The 12-case ordered subset and prompt hash match their frozen values. |
| Run isolation | A test proves Run 2 is independent of Run 1 semantic output and state. |
| Secret safety | Deterministic sanitizer coverage redacts `x-api-key`, authorization-like values, Anthropic-key patterns, cookies, request headers, and environment data. |
| Artifact isolation | The new artifact root is ignored and credential-free. |
| Regression hygiene | Affected tests and `git diff --check` pass. |

Provider schema rejection before model execution is an `ENVIRONMENT_BLOCKED`
outcome only after this offline compatibility gate has passed and its sanitized
reason is preserved.

## Live execution and evaluation

Once the release gate is complete, make exactly two calls with identical model,
prompt, sources/source order, schema, token ceiling, adaptive-thinking mode,
effort, and non-streaming setting. Run 2 must neither receive nor inspect Run
1 semantic output. Do not use continuation state, retry, fallback, repair
prompt, smaller schema, or inline change after Run 1.

For each run, capture only safe metadata: API success/error, message ID,
`stop_reason`, latency, input/output tokens, cache token counters where
present, and other safe SDK usage counters. Do not persist headers, key,
cookie, environment dump, or unsanitized diagnostics.

Evaluate an unmodified normal completion in this exact order:

```text
Anthropic structured response
  -> parsed provider-wire envelope
  -> local original provider-wire Zod validation
  -> normalizeProviderWireResult(...)
  -> Atlas Semantic IR Zod validation
  -> source accounting
  -> evidence grounding
  -> unchanged SEMIR-003 semantic oracle
  -> frozen critical-dimension cross-run comparison
```

No stage may repair meaning. `end_turn` is the only normal candidate for
evaluation. `max_tokens` is `FAIL` / `PROVIDER_OUTPUT_TRUNCATION` even if
partial JSON parses; `refusal` is `FAIL` / `PROVIDER_REFUSAL_FAILURE`.

## Terminal classification

Record exactly one terminal result:

- `PASS` only when both runs complete, parse and validate structurally,
  normalize deterministically, pass Semantic IR validation, source accounting,
  evidence grounding, every semantic oracle dimension, and critical-dimension
  cross-run stability.
- `FAIL` when semantic execution occurs and any requirement fails. Use the
  evidence-backed category `PROVIDER_OUTPUT_TRUNCATION`,
  `PROVIDER_REFUSAL_FAILURE`, `PROVIDER_STRUCTURAL_FAILURE`,
  `EVIDENCE_GROUNDING_FAILURE`, `PROVIDER_SEMANTIC_FAILURE`, or
  `PROVIDER_STABILITY_FAILURE`.
- `ENVIRONMENT_BLOCKED` only when credential, network, outage, quota/rate,
  billing, or provider-side pre-execution schema rejection prevents meaningful
  semantic execution. If one run executes and another is blocked, preserve the
  mixed outcome; it cannot become `PASS`.

After the first authenticated call, the experiment is frozen. Any need to
change the prompt, source order, schema, evaluator, model, provider settings,
or token ceiling is a return to planning authority, not inline remediation.

## Evidence, report, and exclusions

Use a new ignored artifact root such as
`packages/atlas-contracts/.atlas-data/semantic-ir-spike-007/anthropic-sonnet-5-5/`.
Preserve sanitized `freeze.json`, `run-01.json`, `run-02.json`, and
`summary.json`. The freeze record must identify the ticket/run, provider/model,
prompt/source/schema fingerprints, token ceiling, effort, thinking, SDK
version, runner commit, and no-retry/no-fallback/no-repair flags.

Commit the sanitized CK handoff report at
`project's goal/feedback/SEMSPIKE-007-anthropic-sonnet-5-5-qualification.md`.
It must separately report `STRUCTURAL RESULT`, `EVIDENCE RESULT`, `SEMANTIC
RESULT`, `CROSS-RUN STABILITY`, and `TERMINAL RESULT`; provider/model and
commit; all fingerprints; per-run stop reason, latency, usage, and failures;
sanitized provider diagnostics; review-contract closure; and an explicit
statement that SEMSPIKE-006 remains unchanged and frozen. Token-cost estimates
may be informational only, never a pass/fail factor.

This ticket does not authorize compact IR or source-accounting redesign,
production extraction, customer PRDs, caching experiments, batching,
canonicalization, reconciliation, Master publication, real-PRD context work,
fallback/Opus testing, privacy-retention claims, or schema weakening.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMSPIKE-007-01` | Preserve SEMSPIKE-006 as frozen sibling evidence and all existing semantic authority unchanged. | No prior artifact or semantic contract changes; the exact frozen corpus, prompt hash, 12-case order, oracle, and full provider-wire shape are used. |
| `RC-SEMSPIKE-007-02` | Use Anthropic's official SDK structured-output path as transport adaptation only. | `messages.parse` plus `zodOutputFormat` transforms the existing Zod envelope; local original Zod enforces 12 results and no Groq schema or deprecated request path is used. |
| `RC-SEMSPIKE-007-03` | Close every offline release gate before provider use. | All gate evidence passes, provider-call count is zero before release, and any incompatible frozen token envelope returns to planning before execution. |
| `RC-SEMSPIKE-007-04` | Make exactly two isolated calls on the frozen profile. | Both redacted run records prove identical frozen inputs/settings, no Run 1 sharing, and no retry, fallback, repair, batching, continuation, or mutation. |
| `RC-SEMSPIKE-007-05` | Validate untouched provider results through all existing structural and grounding layers. | Each applicable run has original Zod validation, deterministic normalization, Atlas IR validation, exact accounting, and evidence-grounding result; no semantic repair occurs. |
| `RC-SEMSPIKE-007-06` | Apply the unchanged semantic oracle and frozen critical stability comparison. | Both runs preserve all required distinctions—including all `may` cases, nested modality, polarity, condition/trigger, temporal, quantity, state, unresolved, and discourse dimensions—or the exact failure is classified. |
| `RC-SEMSPIKE-007-07` | Preserve truthful terminal evidence, isolation, and credential safety. | Sanitized ignored artifacts/report include all required run observations and result sections; no secret/header/environment data appears; affected tests and `git diff --check` pass. |

## Security readiness

**Status:** `applicable`

| ID | Readiness item |
| --- | --- |
| `SR-007-IB-01` | Only the frozen controlled, non-confidential 12-case fixture crosses the Atlas-to-Anthropic boundary; no DocumentStore, customer PRD, Master, or fact discovery is introduced. |
| `SR-007-IB-02` | Preserve provider/model/SDK path/schema/prompt/source order/two-run profile; changes require separate planning authority. |
| `SR-007-IB-03` | Keep runner, artifacts, and dependencies spike-local; no production route, worker, persistence, or authority activation is added. |
| `SR-007-TB-01` | Anthropic output remains untrusted until local Zod validation, deterministic normalization, IR validation, accounting, evidence, oracle, and stability checks complete. |
| `SR-007-SA-01` | `ANTHROPIC_API_KEY`, authorization material, headers, cookies, and secret-bearing environment data remain request/environment-only and sanitized from all evidence. |
| `SR-007-ID-01` | Preserve redacted freeze and per-run identity/configuration so independently generated outcomes are comparable. |
| `SR-007-ES-01` | Keep transport transformation, raw preservation, local validation, normalization, oracle, stability comparison, and reporting distinct. |
| `SR-007-PC-01` | Do not weaken local envelopes, alter semantic authority, repair semantics, adaptively retry, fallback, or couple the spike to production truth. |
| `SR-007-VS-01` | Verify offline schema compatibility, source/request scope, two-run isolation, secret safety, structural/evidence/semantic/stability evaluation, artifacts, and regressions. |
| `SR-007-UP-01` | Provider retention, residency, tenancy, ZDR account configuration, production privacy policy, and economics remain intentionally unresolved. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-007-RB-01` | `SR-007-IB-01`, `SR-007-TB-01` | Did only authorized fixture content cross the boundary and remain untrusted? | Source manifest, redacted request metadata, and validation sequence from `RC-SEMSPIKE-007-04`/`-05`. |
| `SR-007-RB-02` | `SR-007-IB-02`, `SR-007-ID-01` | Are two independently identifiable calls exactly frozen? | Freeze record, prompt/schema/source fingerprints, and per-run metrics from `RC-SEMSPIKE-007-03`/`-04`. |
| `SR-007-RB-03` | `SR-007-SA-01` | Are credentials and authorization material absent from logs, report, and evidence? | Sanitizer tests plus artifact/log/git inspection from `RC-SEMSPIKE-007-03`/`-07`. |
| `SR-007-RB-04` | `SR-007-ES-01`, `SR-007-PC-01` | Does the adapter validate without semantic repair or authority transfer? | SDK/runner/validator inspection and negative tests from `RC-SEMSPIKE-007-02`/`-05`. |
| `SR-007-RB-05` | `SR-007-IB-03`, `SR-007-PC-01` | Is the experiment isolated and are Atlas semantic authorities unchanged? | Imports, artifact paths, and contract diff inspection from `RC-SEMSPIKE-007-01`/`-07`. |
| `SR-007-RB-06` | `SR-007-VS-01` | Do the untouched outputs meet every frozen structural, grounding, semantic, and stability requirement? | Per-run and cross-run matrices from `RC-SEMSPIKE-007-05`/`-06`. |

## Handoff

After a terminal classification and the committed sanitized report, set this
ticket to `awaiting_review` and stop for CK. CK may review the frozen
qualification evidence only. A `PASS` permits only separately authored
planning; a `FAIL` or `ENVIRONMENT_BLOCKED` preserves the exact result without
prompt hacking, retries, or reopening SEMSPIKE-006.
