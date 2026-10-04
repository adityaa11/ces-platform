# SEMSPIKE-005 schema-driven semantic extraction feasibility

- **Ticket:** `SEMSPIKE-005`
- **Batch:** `SEMSPIKE-BATCH-05`
- **Terminal result:** `FAIL`
- **Implementation state:** complete bounded experiment, awaiting CK review of frozen evidence.
- **Workspace state:** `codex/new-atlas-backend` at `a65cd0d` before this ticket's uncommitted scoped changes. Existing unrelated workspace changes were preserved.

## Scope and frozen configuration

The only experimental variable is an isolated provider-facing Zod proposal schema in
`scripts/groq-semantic-spike-005/`. It defines the six bounded concepts with
semantic descriptions, generates strict JSON Schema with `z.toJSONSchema(...)`,
and validates responses through the same Zod schema before deterministic Atlas
finalization.

The runner preserves the real `NormalizedDocument v1` fixture path and the
unchanged `parseSemanticExtractionResult(...)` parser. It sends only S1--S4
fixture text with the frozen Groq profile: `openai/gpt-oss-120b`, non-streaming,
`reasoning_effort=medium`, strict JSON Schema, and the minimal schema-authority
instruction. It contains no semantic repair, retry, fallback, production import,
route activation, persistence, or credential logging. Generated schema and raw
provider output are confined to ignored `.atlas-data/groq-semantic-spike-005/`.

## Validation and evidence

| Command / evidence | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/groq-semantic-spike-005/test.mts` | PASS: real fixture parser, Zod description presence, known-good proposal parsing, source-slot negatives, semantic oracle, deterministic finalizer, and real semantic parser. |
| `corepack pnpm --filter @atlas/contracts test` | PASS: existing execution, perception, and semantic contract tests. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/groq-semantic-spike-005/run.mts` | `FAIL`: exactly two authenticated calls completed with HTTP 200; both miss the frozen S4 oracle. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/groq-semantic-spike-005/evaluate-existing-evidence.mts` | PASS: re-evaluated preserved raw responses without a provider call, separating Zod/accounting/final-parser proof from oracle failure. |
| `.atlas-data/groq-semantic-spike-005/summary.json` | Redacted run record: two strict-schema calls, no credential or Authorization value, and complete per-run validation outcomes. |
| `git diff --check` | PASS at validation time. |

The generated ignored `provider-schema.json` is produced before live execution.
The local test confirms descriptions for `workflow_step`, `constraint`,
`unresolved`, and `non_fact` survive into the generated JSON Schema.

## Run matrix

| Run | Authenticated request | HTTP | Zod / accounting / oracle / final parser |
| ---: | --- | --- | --- |
| 1 | Completed | 200 | PASS / PASS / FAIL / PASS — S4 was a `rule`, not `unresolved`. |
| 2 | Completed | 200 | PASS / PASS / FAIL / PASS — S4 was `unresolved`, but asks whether approval is required rather than the missing condition under which it is required. |

The preserved raw outputs remain ignored local evidence. The report quotes only
their non-secret semantic distinctions. Run 1 and Run 2 are materially
different at S4; neither satisfies the frozen oracle, so the terminal result is
`FAIL`, not `ENVIRONMENT_BLOCKED`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence | Status |
| --- | --- | --- | --- |
| `RC-SEMSPIKE-005-00` | Explicit SEMSPIKE-004 predecessor bypass. | GO used only the BSS-V2-004-02 approved checkpoint and current parser seams; SEMSPIKE-004 state was not used as a gate. | PROVEN |
| `RC-SEMSPIKE-005-01` | Real normalized fixture and exactly-once S1--S4 accounting. | Local runner test invokes `parseNormalizedDocument(...)`; Zod/accounting negative tests reject missing, duplicate, and unknown slots. | PROVEN (local) |
| `RC-SEMSPIKE-005-02` | Zod-generated provider schema retains semantic descriptions. | Local schema inspection test and ignored generated `provider-schema.json`. | PROVEN |
| `RC-SEMSPIKE-005-03` | Two authenticated frozen-profile strict structured-output calls. | Two HTTP 200 calls used Groq, `openai/gpt-oss-120b`, `medium`, non-streaming strict JSON Schema, the minimal instruction, and no retry/fallback. | PROVEN |
| `RC-SEMSPIKE-005-04` | Same Zod schema validates original provider output without repair. | Both raw outputs parse through the generating Zod schema and pass exactly-once accounting; malformed local negatives fail closed. | PROVEN |
| `RC-SEMSPIKE-005-05` | Both live runs satisfy S1--S4 oracle. | The oracle ran against each unmodified parsed response and recorded the exact S4 misses. The required PASS condition is false, establishing the ticket's terminal `FAIL`. | PROVEN |
| `RC-SEMSPIKE-005-06` | Deterministic finalization and unchanged real parser accept both live results. | Both parsed proposals deterministically finalize and pass `parseSemanticExtractionResult(...)`; no semantic repair occurred. | PROVEN |
| `RC-SEMSPIKE-005-07` | Equivalent-run comparison, redaction safety, affected tests, and diff check. | The material S4 difference is recorded; raw output/schema remain ignored; local and contract tests plus diff check pass. | PROVEN |

Internal readiness: **READY_FOR_CK** for the bounded terminal `FAIL` evidence.
This is not a self-issued PASS: CK must review the unchanged oracle, preserved
two-run evidence, and the no-repair boundary.

## Comparison and recommendation

definitions into a provider-facing Zod schema while keeping the instruction
small, fixture, model, reasoning setting, final parser, and Atlas authority
boundaries frozen. Because the route was not invoked, it cannot determine
whether descriptions improve reliability.
Unlike SEMSPIKE-001 through SEMSPIKE-003, this runner moves semantic concept
definitions into a provider-facing Zod schema while keeping the instruction
small, fixture, model, reasoning setting, final parser, and Atlas authority
boundaries frozen. The two frozen runs still fail to preserve the required S4
unresolved condition distinction, so schema descriptions do not qualify this
exact route for the requested feasibility claim.
definitions into a provider-facing Zod schema while keeping the instruction
small, fixture, model, reasoning setting, final parser, and Atlas authority
boundaries frozen. Because the route was not invoked, it cannot determine
whether descriptions improve reliability.

Next recommendation: preserve this `FAIL` evidence and use it in a separately
authorized planning decision about a different provider/model experiment; do
not add prompt inflation or semantic repair to this ticket.
