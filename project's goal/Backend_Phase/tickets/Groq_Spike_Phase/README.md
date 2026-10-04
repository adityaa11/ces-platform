# Atlas Groq GPT-OSS-120B Semantic Feasibility and Trace Spikes

- **State:** `planned`
- **Ticket prefixes:** `SEMSPIKE`, `SEMTRACE`
- **Implementation contexts:** [SEMSPIKE-001 Groq GPT-OSS-120B implementation context](../../atlas-semspike-001-groq-gpt-oss-120b-implementation-context.md), [SEMTRACE-001 implementation context](../../atlas-semtrace-001-implementation-context.md), [SEMSPIKE-004 implementation context](../../atlas-semspike-004-minimal-semantic-envelope-implementation-context.md), and [SEMSPIKE-005 schema-driven semantic extraction context](../../SEMSPIKE-005-schema-driven-semantic-extraction-implementation-context.md)
- **Execution branch:** `codex/new-atlas-backend`

## Purpose

This set contains deliberately isolated Groq experiments. `SEMSPIKE-001` to
`SEMSPIKE-003` test the Atlas-facing semantic-extraction representation.
`SEMTRACE-001` follows the frozen `SEMSPIKE-003` S4 failure and asks the
narrower raw-meaning question without any Atlas classification or application
contract. `SEMSPIKE-004` tests whether that demonstrated meaning survives a
minimal JSON envelope without provider-enforced structure. `SEMSPIKE-005`
independently tests whether semantic descriptions in a provider-facing Zod
schema can guide the same frozen Atlas distinctions.

```text
validated NormalizedDocument v1
  -> bounded slots S1..S4
  -> Groq proposal only
  -> Atlas-owned source accounting, identity, evidence, and finalization
  -> real parseSemanticExtractionResult(...)
```

It is not a production Groq integration, provider migration, BSS-V2 route
qualification, semantic-worker redesign, reconciliation, Knowledge Index,
database/queue work, or a full-PRD extraction.

## Delivery order

| Order | Ticket | Review batch | Dependencies | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [SEMSPIKE-001](SEMSPIKE-001-groq-gpt-oss-120b-semantic-feasibility.md) | `SEMSPIKE-BATCH-01` | Existing `NormalizedDocument v1`, `atlas.semantic.extract/v1`, and their real parsers remain unchanged | Can the frozen Groq route produce a fully accounted proposal that Atlas finalizes through the unchanged semantic-v1 parser twice, without granting Groq Atlas authority? |
| 2 | [SEMSPIKE-002](SEMSPIKE-002-prompt-strengthened-semantic-feasibility.md) | `SEMSPIKE-BATCH-02` | Frozen SEMSPIKE-001 baseline; unchanged fixture, contract, parsers, and provider configuration | Does the strengthened extraction instruction change the same Atlas-facing result without changing any other variable? |
| 3 | [SEMSPIKE-003](SEMSPIKE-003-faithfulness-prompt-semantic-feasibility.md) | `SEMSPIKE-BATCH-03` | Frozen SEMSPIKE-001/002 baselines; unchanged fixture, contract, parsers, and provider configuration | Does the supplied faithfulness instruction preserve S4 as unresolved in the Atlas-facing representation? |
| 4 | [SEMTRACE-001](SEMTRACE-001-raw-semantic-understanding.md) | `SEMTRACE-BATCH-01` | Frozen SEMSPIKE-003 evidence, identical S1-S4 wording, and the real perception parser; no Atlas-facing intermediate schema | Does the model preserve raw S4 possibility without Atlas terminology, policy, or disposition fields? |
| 5 | [SEMSPIKE-004](SEMSPIKE-004-minimal-semantic-envelope.md) | `SEMSPIKE-BATCH-04` | Frozen SEMTRACE-001 evidence and identical S1-S4 wording; minimal natural-language envelope only, with no provider-enforced schema | Does unconstrained generation preserve the free-form semantic result inside a tiny parseable JSON container? |
| 6 | [SEMSPIKE-005](SEMSPIKE-005-schema-driven-semantic-extraction.md) | `SEMSPIKE-BATCH-05` | Accepted BSS-V2-004-02, existing real parsers, and an invokable Groq route; SEMSPIKE-004 state is explicitly not a prerequisite | Do semantic descriptions in a provider-facing Zod schema improve Atlas-correct S1-S4 proposals under a minimal instruction? |

The table order records the spike sequence and review batches. It is not a
predecessor gate for SEMSPIKE-005; its listed start gate controls, and its
context explicitly bypasses SEMSPIKE-004 ticket state.

Every ticket is atomic. Its frozen fixture/schema validation, both live runs,
repeatability comparison, and report are one proof. A credential check, HTTP
response, or structured JSON alone is not a checkpoint or partial success.
The SEMTRACE ticket deliberately does not finalise into, or invoke validation
for, the Atlas semantic-extraction contract. SEMSPIKE-005 is one atomic
checkpoint that includes schema generation, local validation, two live runs,
Atlas finalization, semantic evaluation, and the report; it may proceed without
SEMSPIKE-004 predecessor-state gating as explicitly authorized by its context.

## Execution and review controls

Keep the ticket `planned` until explicit `go` authorization. GO completes all
frozen review rows to one terminal `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`, then records the spike implementation and summarized
evidence before `awaiting_review`. CK reviews only that frozen evidence; it
does not authorize production integration. CFC may repair only spike-local
runner, schema, finalizer, or evidence defects. HMN is required for any change
to a contract, provider/model/mode, authority boundary, production route,
persistence, or source scope.

Use only `GROQ_API_KEY` through environment configuration. The earlier
SEMSPIKE tickets use strict JSON Schema; SEMSPIKE-004 deliberately omits
`response_format` and tests ordinary unconstrained generation. Each ticket's
frozen provider mode is authoritative. Requests are non-streaming and use
`reasoning_effort=medium` against exactly `openai/gpt-oss-120b`; never switch
provider, model, reasoning mode, or output mode when that target fails. Keep
spike code isolated under its ticket-specific `scripts/` directory and never
import it from production runtime. Generated artifacts belong only under the
matching ignored `.atlas-data/` directory. Do not commit credentials,
Authorization headers, or raw secret-bearing diagnostics.

## Completion

SEMSPIKE-001 through SEMSPIKE-003 complete only after the exact four-source
fixture passes the real `parseNormalizedDocument(...)`, each run passes the
tiny intermediate schema and complete source accounting, Atlas finalization
passes the real `parseSemanticExtractionResult(...)`, semantic decisions are
compared across both runs, directly affected contract tests and
`git diff --check` pass, and the required feasibility report supports its
terminal classification. SEMTRACE-001 and SEMSPIKE-004 use their ticket-specific
completion proofs and must not be routed through the Atlas semantic parser.

A `PASS` or `PASS_WITH_LIMITS` supports only the next separately authored,
bounded planning decision. It does not qualify Groq for production or
authorize an architecture, contract, route, or model change.

SEMSPIKE-005 uses its ticket-specific terminal set (`PASS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`) and completion proof. It requires the Zod-generated
schema descriptions, both S1-S4 oracle outcomes, deterministic Atlas
finalization, and the unchanged semantic parser. Its sequence-table position
does not add a dependency on SEMSPIKE-004.
