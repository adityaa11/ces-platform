# SEMSPIKE-003 faithfulness-prompt semantic extraction feasibility

SEMSPIKE-003 RESULT: FAIL

Provider: Groq; Model: openai/gpt-oss-120b; Reasoning effort: medium; Requested structured output: strict JSON Schema; Authenticated live inference: yes.

SEMSPIKE-001 and SEMSPIKE-002 remain unchanged baselines. SEMSPIKE-003 changed only the system instruction. Its fixture, slots, schema, deterministic finalizer, semantic oracle, real parsers, provider/model/route, and acceptance criteria were imported unchanged from SEMSPIKE-002.

| Source | Required | Run 1 | Run 2 | Result |
| --- | --- | --- | --- | --- |
| S1 | `workflow_step` | actor plus `workflow_step` | `workflow_step` | PASS |
| S2 | `constraint`, customer/max `2`/per order | `constraint` | `constraint` | PASS |
| S3 | heading-only `non_fact` | `non_fact` | `non_fact` | PASS |
| S4 | question-bearing `unresolved` | resolved `rule`; no question | resolved `rule`; no question | FAIL |

Both live responses were HTTP 200, schema-valid, fully source-accounted, and
accepted by `parseSemanticExtractionResult(...)` after Atlas-owned finalization.
The frozen semantic oracle rejected both because S4's explicitly uncertain
approval meaning was converted to a resolved `rule`, with
`needs_resolution=false` and no clarification question. No semantic repair or
contract weakening was applied.

Run 1: 1,281 input tokens, 951 output tokens, 2,639 ms. Run 2: 1,281 input
tokens, 911 output tokens, 2,734 ms. Redacted fixture/proposal/final-result
evidence is retained only under ignored `.atlas-data/groq-semantic-spike-003/`.
Candidate payload semantics were not qualified by SEMSPIKE-003.

## Review Contract Closure

| Row | Required proof | Evidence | Status |
| --- | --- | --- | --- |
| RC-SEMSPIKE-003-01 | Two exact authenticated strict calls. | Two HTTP 200 Groq calls, exact model/configuration. | PROVEN |
| RC-SEMSPIKE-003-02 | Identical fixture through real perception parser. | Reused frozen fixture test -> PASS. | PROVEN |
| RC-SEMSPIKE-003-03 | Schema and exactly-once accounting. | Both runs pass strict schema/accounting; negative local checks pass. | PROVEN |
| RC-SEMSPIKE-003-04 | Four frozen semantic decisions. | Both S4 values are resolved `rule`, not question-bearing `unresolved`. | FAIL |
| RC-SEMSPIKE-003-05 | Atlas finalization and real parser. | Both finalized results accepted by real parser. | PROVEN |
| RC-SEMSPIKE-003-06 | Honest comparison. | Two equivalent failures and exact metrics retained. | FAIL |

Validation passed: `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike-002/test.mts`, `pnpm --filter @atlas/contracts test`, credential inspection, and `git diff --check`.

Internal readiness: READY_FOR_CK (terminal `FAIL` evidence is complete; not a self-issued PASS).

Next recommendation: do not alter this frozen ticket or preceding baselines. Any further instruction/model/schema experiment needs a new bounded ticket.
