# SEMSPIKE-002 prompt-strengthened semantic extraction feasibility

SEMSPIKE-002 RESULT: FAIL

Provider: Groq
Model: openai/gpt-oss-120b
Reasoning effort: medium
Requested structured output: strict JSON Schema
Authenticated live inference: yes

NormalizedDocument v1 changed: no
Semantic v1 changed: no
Production semantic worker changed: no
Production route activated: no
Knowledge Index implemented: no
Reconciliation tested: no

## Controlled variable and terminal result

SEMSPIKE-001 remains unchanged at terminal `FAIL`; its original prompt is the
baseline. SEMSPIKE-002 copied its provider, model, route, four-source fixture,
slots, strict intermediate schema, deterministic finalizer, validators, and
semantic oracle. The only changed variable was the strengthened system
instruction in `scripts/groq-semantic-spike-002/groq-client.mts`.

Both authenticated HTTP 200 responses were schema-valid, fully accounted, and
accepted by the real semantic-v1 parser after deterministic Atlas finalization.
However, S1 was `relationship` in run 1 and `actor` in run 2, rather than the
required `workflow_step`. This violates the frozen semantic oracle and is a
valid terminal `FAIL`; no post-processing, fixture/schema change, or contract
weakening was used to convert it to success.

## Source evaluation matrix

| Source | Required | Run 1 | Run 2 | Result |
| --- | --- | --- | --- | --- |
| S1 | `workflow_step` | `relationship` | `actor` | FAIL |
| S2 | `constraint`, customer/max `2`/per order | `constraint`, max two per order | `constraint`, max `2` per order | PASS |
| S3 | heading-only `non_fact` | `non_fact` | `non_fact` | PASS |
| S4 | question-bearing `unresolved` | `rule` despite question/reason and needs resolution | `unresolved`, question/reason, needs resolution | FAIL |

| Integrity requirement | Result |
| --- | --- |
| Real `parseNormalizedDocument(...)` validates the exact four-source fixture | PASS |
| Strict intermediate schema and exactly one known slot disposition each | PASS |
| Missing/duplicate slot negative validation | PASS |
| Trusted Atlas evidence, IDs, wording, inventory, and questions | PASS |
| Real `parseSemanticExtractionResult(...)` accepts both finalized results | PASS |
| Numeric `2` and per-order scope preserved | PASS |
| No credential or Authorization data in committed report/artifacts | PASS |

Run 1: 896 input tokens, 1,022 output tokens, 2,813 ms latency. Run 2: 896
input tokens, 1,041 output tokens, 2,759 ms latency. Both provider proposals,
final semantic-v1 results, fixture, and redacted metrics are retained only in
the ignored `.atlas-data/groq-semantic-spike-002/` evidence directory.
Candidate payload semantics were not qualified by SEMSPIKE-002.

## Repeatability and baseline comparison

The stronger prompt materially improved the SEMSPIKE-001 outcome: both runs
now retain S2 as `constraint` and produce clarification questions for S4. It
did not establish reliable S1 classification (both runs miss `workflow_step`)
or reliable S4 `unresolved` classification (run 1 returns `rule`). Therefore
the experiment distinguishes a partial prompt-contract improvement from full
model capability qualification, but it does not support `PASS` or
`PASS_WITH_LIMITS`.

| Experiment | Model / variable | Result |
| --- | --- | --- |
| SEMSPIKE-001 | Same model, original instructions | FAIL: S4 invalid; S2 unstable. |
| SEMSPIKE-002 | Same model, strengthened instructions only | FAIL: S1 not `workflow_step` in either run; S4 kind remains unstable. |

## Review Contract Closure

| Row | Required proof | Evidence / executed validation | Status |
| --- | --- | --- | --- |
| RC-SEMSPIKE-002-01 | Two exact authenticated strict-route calls. | Two HTTP 200 calls to `openai/gpt-oss-120b`, medium reasoning, strict JSON Schema. | PROVEN |
| RC-SEMSPIKE-002-02 | Same fixture through real perception parser. | `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike-002/test.mts` -> PASS. | PROVEN |
| RC-SEMSPIKE-002-03 | Valid exactly-once dispositions plus negative checks. | Both live proposals validate; local missing/duplicate checks pass. | PROVEN |
| RC-SEMSPIKE-002-04 | All four frozen semantic decisions. | S1 is `relationship` then `actor`, not `workflow_step`; S4 is `rule` then `unresolved`. | FAIL |
| RC-SEMSPIKE-002-05 | Atlas-owned finalization and real parser acceptance. | Both live finalizations accepted by `parseSemanticExtractionResult(...)`. | PROVEN |
| RC-SEMSPIKE-002-06 | Honest equivalent-run/baseline comparison. | S1/S4 material disagreement is preserved in the matrix and ignored evidence. | FAIL |

Additional validation: `pnpm --filter @atlas/contracts test` and `git diff
--check` pass. `rg` inspection found no credential value or literal Bearer
token in SEMSPIKE-002 committed-report paths.

Internal readiness: READY_FOR_CK (terminal `FAIL` evidence is complete and is
not a self-issued PASS).

## Next recommendation

Do not remediate SEMSPIKE-001 or SEMSPIKE-002 in place. Any further prompt,
model, schema, or oracle experiment requires separately authored planning.
