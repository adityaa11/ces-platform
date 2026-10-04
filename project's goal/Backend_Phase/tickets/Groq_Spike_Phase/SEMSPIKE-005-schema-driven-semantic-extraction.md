# SEMSPIKE-005: Schema-driven semantic extraction feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-05`
- **Implementation context:** [SEMSPIKE-005 schema-driven semantic extraction context](../../SEMSPIKE-005-schema-driven-semantic-extraction-implementation-context.md)
- **Primary start gate:** accepted `BSS-V2-004-02`, existing `NormalizedDocument v1` and `atlas.semantic.extract/v1` parsers, and an invokable authenticated Groq route.
- **Predecessor bypass:** `SEMSPIKE-004` and other semantic-spike ticket states are not execution prerequisites. Treat prior spike artifacts as comparison evidence only; preserve them unchanged.

## Outcome

Answer one bounded question: can Groq `openai/gpt-oss-120b` produce Atlas-correct S1-S4 semantic proposals when Atlas concepts are defined by descriptions in a provider-facing Zod schema, using a deliberately small system instruction?

This is an isolated feasibility experiment, not a production route or a redesign of `atlas.semantic.extract/v1`. It does not test reconciliation, provider selection, or the BSS-V2-004-03 production qualification itself.

```text
NormalizedDocument v1 fixture
  -> Atlas-owned bounded S1-S4 slots
  -> Zod semantic proposal schema and descriptions
  -> z.toJSONSchema(...) strict Groq structured output
  -> same Zod schema parses provider output
  -> deterministic Atlas finalizer
  -> unchanged parseSemanticExtractionResult(...)
```

The provider proposes semantic content only. Atlas retains authority over source accounting and identity, evidence, semantic keys, candidate IDs, the final semantic-v1 envelope, and all accepted truth.

## Frozen scope and boundaries

- Keep the experiment isolated under `scripts/groq-semantic-spike-005/`; place live evidence under ignored `.atlas-data/groq-semantic-spike-005/`.
- Reuse the frozen S1-S4 fixture and validate it through the real `parseNormalizedDocument(...)` path. Atlas code owns the source-slot correspondence and enforces each slot exactly once.
- Use a spike-local Zod dependency. Do not add Zod to `@atlas/contracts` or as a hidden production dependency of Agents Bridge.
- Use the Zod schema as the source for the provider JSON Schema. Preserve and inspect its semantic descriptions in generated ignored `provider-schema.json`.
- Use the conceptual Zod shapes from Sections 13-14 of the implementation context: a `sourceResults` array with one `{ sourceSlot, extraction }` result for each S1-S4, and a discriminated union for the six minimum kinds. Enforce exactly-once slot accounting independently of the array length.
- Keep the minimum concepts to `workflow_step`, `constraint`, `rule`, `condition`, `unresolved`, and `non_fact`. Add another concept only if required to represent a frozen source faithfully, and document why.
- Use strict JSON Schema structured output and parse each response with the same Zod schema that generated it.
- Finalize deterministically into the current semantic-v1 shape and validate with the unchanged `parseSemanticExtractionResult(...)`.
- Do not repair or reclassify semantic errors, retry adaptively, change the oracle, or change the frozen provider/model/settings to obtain a pass.
- Do not modify `NormalizedDocument v1`, Docling, `packages/atlas-contracts/src/semantic.ts`, semantic parsers, production routes, workers, persistence, or earlier spike artifacts.
- Do not add production routing, reconciliation, retrieval, embeddings, batching, large-PRD extraction, provider fallback, quota, or cost-ledger work.

## Provider profile and request boundary

Make exactly two equivalent authenticated live calls:

| Setting | Frozen value |
| --- | --- |
| Provider | Groq |
| Model | `openai/gpt-oss-120b` |
| `reasoning_effort` | `medium` |
| Streaming | `false` |
| Structured output | strict JSON Schema generated from the spike-local Zod schema |
| Credential | `GROQ_API_KEY` environment variable only |
| Calls | exactly two; no retry, fallback, or mutation between runs |

Use these exact source strings and slot assignments after the real perception parser validates the fixture:

| Slot | Source |
| --- | --- |
| S1 | `The customer submits an order.` |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` |
| S3 | `3.2 Purchase Rules` |
| S4 | `Approval may be required before processing.` |

The system instruction should be limited to the supplied sources, the schema descriptions as the semantic definitions, no unsupported inference, and returning the required structured result. Do not reintroduce the large ontology prompt from SEMSPIKE-002/003. The user message carries only the authorized fixture input. Do not send oracle answers, expected classifications, or extra source material.

Retain raw provider output before parsing in ignored evidence. Record provider, model, HTTP status, latency, token counts when returned, reasoning effort, structured-output mode, Zod parse result, source accounting result, final parser result, and semantic oracle result. Never write the API key, Authorization header, or secret-bearing environment data to logs or artifacts.

## Frozen semantic oracle

Both runs must preserve every required distinction:

| Slot | Required result | Required meaning |
| --- | --- | --- |
| S1 | `workflow_step` | Customer submits an order; preserve actor, action, and object without invented uncertainty or conditions. |
| S2 | `constraint` | Preserve customer, maximum exactly `2`, product, and per-order scope. A generic `rule` is insufficient. |
| S3 | `non_fact` | Treat `3.2 Purchase Rules` as structural context, not a business proposition. |
| S4 | `unresolved` | Preserve that approval may be required before processing, identify the missing condition, and ask a non-empty clarification question limited to that missing information. Do not convert it to a resolved rule or invent a condition. |

A schema-valid response alone does not pass. No deterministic rule may turn an incorrect model choice into an oracle result.

## Required implementation proof

Before live calls, implement local checks proving:

- generated JSON Schema retains semantic descriptions for at least `workflow_step`, `constraint`, `unresolved`, and `non_fact`;
- a known-correct S1-S4 proposal parses through Zod;
- missing, duplicate, unknown, or repeated source slots are rejected;
- malformed/nonconforming provider output is rejected;
- a known-correct proposal finalizes deterministically and passes the real semantic-v1 parser;
- existing semantic-contract tests remain unchanged and pass.

The finalizer may attach trusted source/evidence data, derive system identifiers and semantic keys, map validated fields, and reject invalid output. It must not semantically repair provider output.

## Review Contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMSPIKE-005-00` | Apply the explicit predecessor-ticket bypass. | No workflow blocker is raised solely because SEMSPIKE-004 or another semantic-spike ticket is missing, incomplete, unapproved, or uninspected. |
| `RC-SEMSPIKE-005-01` | Start from real `NormalizedDocument v1` and account for S1-S4 exactly once. | Real parser passes; no missing, duplicate, or unknown slot. |
| `RC-SEMSPIKE-005-02` | Generate provider schema from Zod and carry descriptions through. | Generated schema evidence contains the required semantic descriptions. |
| `RC-SEMSPIKE-005-03` | Run two authenticated calls with the frozen route/settings and minimal instruction. | Both requests use the exact profile and complete without adaptive changes. |
| `RC-SEMSPIKE-005-04` | Validate original provider output using the generating Zod schema, with no semantic repair. | Both responses parse; invalid-shape and slot-accounting cases fail closed. |
| `RC-SEMSPIKE-005-05` | Evaluate both runs against S1-S4. | Both satisfy the complete frozen semantic oracle, including S2 quantity/scope and S4 unresolved condition/question. |
| `RC-SEMSPIKE-005-06` | Finalize with Atlas-owned IDs, evidence, and accounting, then use the unchanged semantic parser. | Both finalized results pass `parseSemanticExtractionResult(...)`. |
| `RC-SEMSPIKE-005-07` | Preserve equivalent-run comparison, credential safety, and complete evidence. | Material differences are recorded; reports/artifacts are secret-safe; directly affected tests and `git diff --check` pass. |

## Security readiness

**Status:** `applicable`

| ID | Readiness item |
| --- | --- |
| `SR-005-IB-01` | Only the authorized, non-confidential S1-S4 fixture crosses to Groq; no DocumentStore discovery or database access is added. |
| `SR-005-IB-02` | Preserve the frozen provider, model, reasoning effort, strict structured-output mode, and exactly two calls. |
| `SR-005-IB-03` | Keep code and evidence spike-local; no production import or route activation. |
| `SR-005-TB-01` | Source fixture crosses the Atlas-to-Groq trust boundary as a bounded proposal request. |
| `SR-005-TB-02` | Provider output remains untrusted until Zod and deterministic structural/accounting validation; schema validity does not grant truth authority. |
| `SR-005-SA-01` | `GROQ_API_KEY` and Authorization material remain environment/request-only and are excluded from logs and artifacts. |
| `SR-005-ID-01` | Preserve run identity/order and redacted frozen configuration so the two executions can be compared. No user identity is required. |
| `SR-005-ES-01` | Keep provider execution, raw-output preservation, schema parsing, deterministic finalization, semantic evaluation, and reporting distinct. |
| `SR-005-PC-01` | Do not modify authoritative semantic-v1 contracts/parsers or perception contracts. |
| `SR-005-PC-02` | Do not give the provider source/evidence/candidate identity or accepted-truth authority. |
| `SR-005-PC-03` | Do not add semantic repair, adaptive retry, fallback model, production routing, or persistent provider state. |
| `SR-005-VS-01` | Verify fixture/request scope, schema descriptions, route/run identity, parser behavior, raw-output preservation, secret safety, isolation, and oracle evidence. |
| `SR-005-UP-01` | No further security policy is selected by this feasibility ticket. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-005-RB-01` | `SR-005-IB-01`, `SR-005-TB-01` | Does the provider receive only authorized fixture content? | Parsed fixture and redacted request metadata (`RC-SEMSPIKE-005-01`, `-03`). |
| `SR-005-RB-02` | `SR-005-IB-02`, `SR-005-ID-01` | Are both calls distinguishable and on the exact frozen route/settings? | Redacted per-run metrics and request-shape inspection (`RC-SEMSPIKE-005-03`, `-07`). |
| `SR-005-RB-03` | `SR-005-TB-02`, `SR-005-ES-01` | Is raw output validated without semantic repair, reclassification, or authority transfer? | Zod/parser/finalizer behavior and negative checks (`RC-SEMSPIKE-005-04`, `-06`). |
| `SR-005-RB-04` | `SR-005-SA-01` | Are credentials and Authorization material absent from logs, report, and evidence? | Artifact and logging inspection (`RC-SEMSPIKE-005-07`). |
| `SR-005-RB-05` | `SR-005-IB-03`, `SR-005-PC-01`, `SR-005-PC-02` | Is the experiment isolated and are Atlas authorities unchanged? | Import/dependency/path inspection and unchanged production contracts (`RC-SEMSPIKE-005-06`, `-07`). |
| `SR-005-RB-06` | `SR-005-PC-03` | Are semantic repair, retries, fallback, and production integration absent? | Runner and request review plus run records (`RC-SEMSPIKE-005-03` through `-07`). |
| `SR-005-RB-07` | `SR-005-VS-01` | Do both unmodified outputs meet the frozen S1-S4 oracle? | Per-run oracle matrices and preserved structured outputs (`RC-SEMSPIKE-005-04`, `-05`). |

## Terminal result and report

Record exactly one result: `PASS`, `FAIL`, or `ENVIRONMENT_BLOCKED`.

- `PASS` requires both equivalent live runs to pass the real perception parser, strict provider output, Zod validation, exact source accounting, every semantic oracle row, deterministic finalization, the unchanged semantic-v1 parser, cross-run consistency, credential inspection, affected tests, and `git diff --check`.
- `FAIL` applies to an authenticated provider result that fails parsing, accounting, semantic evaluation, finalization, or contract validation. A semantic failure is a valid terminal experiment result; do not tune or retry.
- `ENVIRONMENT_BLOCKED` applies only when environmental/provider failure prevents obtaining valid model output. An HTTP success with an oracle miss is `FAIL`.

Write the committed report to `project's goal/feedback/SEMSPIKE-005-schema-driven-semantic-extraction-feasibility.md`. Include terminal result, branch/commit/worktree state, provider profile, changed variable and frozen baselines, generated-schema evidence, both run matrices and safely quoted outputs, Zod and Atlas parser results, token/latency observations, cross-run comparison, credential/redaction inspection, Review Contract closure, comparison with SEMSPIKE-001/002/003, limitations, and one next recommendation. Preserve raw outputs only in ignored evidence.

On completion, set this ticket to `awaiting_review` and stop for CK. A pass qualifies only the provider-facing schema approach as feasibility evidence and informs a separately planned BSS-V2-004-03. It does not authorize production integration. A failure must preserve the specific failed distinction; do not weaken the oracle or reopen the semantic contract.
