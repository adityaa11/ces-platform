# SEMSPIKE-001 Groq GPT-OSS-120B semantic extraction feasibility

SEMSPIKE-001 RESULT: FAIL

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

## Terminal condition

Two authenticated, non-streaming Groq requests reached exactly
`openai/gpt-oss-120b` with `reasoning_effort=medium` and strict JSON Schema.
Both returned HTTP 200. Both proposals violated the frozen `uncertain`
disposition rule for S4: each left required `question` and `question_reason`
empty, and used `condition` rather than required `unresolved`. Run 2 also
classified S2 as `rule`, rather than the required `constraint`. Atlas rejected
both proposals before finalization. This is a provider semantic/contract
failure, not an environment failure; the schema and Atlas contract were not
weakened. Redacted fixture, proposal, and metrics artifacts are ignored under
`.atlas-data/groq-semantic-spike/`.

## Fixture and local contract evidence

The controlled fixture contains exactly the authorized non-empty page-one text
blocks `spike-text-001` through `spike-text-004`. The local runner passed that
fixture through the real current `parseNormalizedDocument(...)`, validates the
strict spike-only intermediate shape, rejects missing and duplicate slots, then
passes Atlas-built output through the real current
`parseSemanticExtractionResult(...)`.

| Source | Expected | Observed live result | Status |
| --- | --- | --- | --- |
| S1 | `workflow_step`, customer submits order | Run 1 includes `workflow_step` plus actor/object; run 2 returns `workflow_step` | PASS |
| S2 | `constraint`, customer max 2 products per order | Run 1: `constraint`, maximum two per order; run 2: `rule`, maximum two per order | FAIL |
| S3 | `non_fact`, structural heading only | Both runs: `non_fact`, heading-only reason | PASS |
| S4 | `unresolved`, approval uncertainty preserved | Both runs: `uncertain` with a `condition`, no question or reason | FAIL |

| Integrity requirement | Local result |
| --- | --- |
| Four-slot fixture validates with real perception parser | PASS |
| Missing and duplicate slots are rejected | PASS |
| Atlas owns evidence, IDs, source wording, inventory, and questions | PASS |
| Real semantic-v1 parser accepts Atlas finalization | PASS |
| All four provider source slots accounted | PASS (four known slots once per run) |
| No unknown provider slot | PASS |
| Exact numeric value `2` preserved by provider | PASS (both runs) |
| `per order` scope preserved by provider | PASS (both runs) |
| Provider uncertainty preserved in final required form | FAIL |

Run 1 used 610 input tokens and 1,159 output tokens with 3,158 ms latency.
Run 2 used 610 input tokens and 971 output tokens with 2,378 ms latency. The
test fixture verifies the finalizer copies trusted S2 wording (including `2`)
and constructs only `{}` candidate payloads.
Candidate payload semantics were not qualified by SEMSPIKE-001.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| RC-SEMSPIKE-001-01 | Frozen target must accept a real authenticated strict request. | Two HTTP 200 strict structured responses from the exact frozen route. | PROVEN |
| RC-SEMSPIKE-001-02 | Four authorized sources validate through real `parseNormalizedDocument(...)`. | `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike/test.mts` -> PASS. | PROVEN |
| RC-SEMSPIKE-001-03 | Exactly one valid provider disposition per S1–S4, with negative accounting checks. | Each run has four known slots, but S4 violates the `uncertain` disposition fields. | FAIL |
| RC-SEMSPIKE-001-04 | Provider preserves all four required semantic decisions. | S2 changes kind in run 2; S4 is neither `unresolved` nor question-bearing in either run. | FAIL |
| RC-SEMSPIKE-001-05 | Atlas finalizes trusted identity/evidence and real parser accepts output. | Local compliant-proposal finalization and parser test passes; both live proposals are rightly rejected before finalization. | FAIL |
| RC-SEMSPIKE-001-06 | Compare two equivalent authenticated runs honestly. | Both terminal invalid proposals and their material differences are retained; repeatability is not qualified. | FAIL |

Validation also passed: `pnpm --filter @atlas/contracts test` and `git diff --check`.

Internal readiness: READY_FOR_CK (terminal `FAIL` evidence is the
ticket-authorized outcome; this is not a self-issued PASS).

## Limitation and next recommendation

The frozen route failed the controlled semantic contract. Do not weaken the
schema or Atlas contracts to compensate. Any retry or alternative experiment
needs separately authored planning; no production adoption or next-stage work
is authorized.
