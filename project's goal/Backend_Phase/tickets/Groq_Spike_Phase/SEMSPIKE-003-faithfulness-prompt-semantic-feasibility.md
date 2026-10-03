# SEMSPIKE-003: Faithfulness-prompt semantic extraction feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-03`
- **Baselines:** SEMSPIKE-001 (`FAIL`) and SEMSPIKE-002 (`FAIL`) remain frozen and unmodified.

SEMSPIKE-003 tests exactly one new variable: the user-supplied faithfulness
instruction. It reuses the frozen Groq `openai/gpt-oss-120b` route,
`reasoning_effort=medium`, strict JSON Schema, S1–S4 fixture, intermediate
schema, deterministic finalizer, semantic oracle, source accounting, real
parsers, and acceptance criteria from SEMSPIKE-002. No fixture/schema/validator
change, semantic repair, reconciliation, retrieval, Atlas knowledge, production
runtime integration, route activation, persistence, queue, or worker change is
allowed.

## Review Contract

| Row | Required proof |
| --- | --- |
| `RC-SEMSPIKE-003-01` | Two authenticated exact-route strict requests with redacted metrics. |
| `RC-SEMSPIKE-003-02` | Identical four-source fixture validates through real `parseNormalizedDocument(...)`. |
| `RC-SEMSPIKE-003-03` | Strict schema and exactly-once source accounting, including negative checks. |
| `RC-SEMSPIKE-003-04` | S1 `workflow_step`; S2 `constraint` preserving customer/2/per-order scope; S3 `non_fact`; S4 question-bearing `unresolved`. |
| `RC-SEMSPIKE-003-05` | Atlas-owned finalization passes the real `parseSemanticExtractionResult(...)`. |
| `RC-SEMSPIKE-003-06` | Honest equivalent-run and baseline comparison; preserve material differences. |

Security seams are unchanged: only fixture S1–S4 reaches Groq; provider output
is untrusted; Atlas owns all IDs/evidence; credentials remain environment-only;
artifacts and report contain no API key or Authorization material; no spike code
enters production. Report terminal `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or
`ENVIRONMENT_BLOCKED` with Review Contract Closure, then stop for CK.
