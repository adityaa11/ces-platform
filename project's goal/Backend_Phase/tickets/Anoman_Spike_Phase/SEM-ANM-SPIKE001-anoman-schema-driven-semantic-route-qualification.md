# SEM-ANM-SPIKE001: Anoman schema-driven semantic route qualification

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-BATCH-001`
- **Implementation context:** [SEM-ANM-SPIKE001 implementation context](../../SEM-ANM-SPIKE001-implementation-context.md)
- **Start gate:** accepted `BSS-V2-004-02` `NormalizedDocument v1` boundary, unchanged `atlas.semantic.extract/v1`, all local deterministic tests passing, explicit `go`, and local Anoman configuration.

## Outcome and frozen scope

Answer two sequential questions for exactly one route:

1. Can Anoman accept a strict JSON-schema-style response contract for
   `gemini-2.5-flash` and return a response accepted directly by its originating
   Zod schema?
2. If so, can the same strict path produce Atlas-correct semantic proposals for
   frozen S1-S4 slots, twice, which a deterministic finalizer can adapt into the
   unchanged `atlas.semantic.extract/v1` contract?

This is not a production semantic-route ticket. It must not redesign
`NormalizedDocument v1`, Docling behavior, IDSER persistence, reconciliation,
review/publication semantics, `atlas.semantic.extract/v1`, candidate kinds,
source inventory semantics, or evidence semantics. The model owns no Atlas IDs,
source/evidence identity, accepted truth, canonical truth, workspace/Master
state, reconciliation, winner selection, supersession, or conflict resolution.

## Frozen provider profile

| Setting | Frozen value |
| --- | --- |
| Gateway / endpoint | Anoman AI / `https://api.anoman.io/v1/chat/completions` |
| Model | `gemini-2.5-flash` |
| Streaming / temperature | `false` / `0` |
| Work class | Background semantic qualification |
| Credential | `ANOMAN_API_KEY` loaded from repository `.env` |
| Gate A | One authenticated strict-schema call |
| Gate B | Two equivalent authenticated strict-schema calls, only after Gate A pass |
| Fallback / retry / repair | None |

Do not substitute `gemini-2-5-flash`, `gemini-2-5-flash-lite`, OpenRouter,
another Anoman route, model, or provider. A missing `ANOMAN_API_KEY` must fail
closed with a clear configuration result; no second shell-only credential may be
required when `.env` is available. Verify `.env` is ignored before live use.

## Gate A — transport and strict-schema qualification

Create one spike-local Zod schema:

```ts
const TransportQualificationSchema = z.object({
  status: z.literal("ANOMAN_OK"),
  count: z.literal(1),
}).strict();
```

Generate the provider JSON Schema from that same Zod source. Attempt the
strictest documented/observed Anoman-compatible form of `response_format` with
`type: "json_schema"`, schema name `transport_qualification`, and `strict:
true`. Do not hand-maintain a separate provider schema.

Gate A is `STRICT_SCHEMA_PASS` only when authentication succeeds, strict schema
mode is accepted, the terminal model response is directly machine-parseable,
the original Zod parser accepts it with no unknown fields, and its exact marker
values are returned. Markdown fences, `json_object`, prompt-only JSON, regex
extraction, fence stripping, JSON repair, corrective retry, or fallback cannot
be counted as a pass. Otherwise record one bounded sub-result:
`STRICT_SCHEMA_UNSUPPORTED`, `STRICT_SCHEMA_REJECTED`,
`STRICT_SCHEMA_MALFORMED_RESPONSE`, `AUTHENTICATION_BLOCKED`, `RATE_LIMITED`,
or `ENVIRONMENT_BLOCKED`, preserve safe diagnostics, and stop before Gate B.

## Gate B — schema-driven semantic qualification

Gate B uses the exact route, credentials, strict-output mechanism, temperature,
and endpoint that passed Gate A. Its fixture is spike-local but must first pass
the real `parseNormalizedDocument(...)` parser. Deterministically prepare these
four and only these source slots:

| Slot | Source | Required meaning |
| --- | --- | --- |
| S1 | `The customer submits an order.` | Workflow step: customer submits order; no material unresolved information. |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` | Constraint: customer, maximum **2** products, **per order**; preserve numeric value and scope. |
| S3 | `3.2 Purchase Rules` | Non-fact document structure; invent no business proposition. |
| S4 | `Approval may be required before processing.` | Governing-rule-compatible meaning with `possible` modality, before-processing ordering, absent applicability condition, and material unresolved applicability. |

Use a compact, Zod-authored, descriptively documented discriminated proposal
union for `workflow_step`, `constraint`, `rule`, and `non_fact`. Its root has
exactly four `{ sourceSlot, extraction }` entries. Enforce S1-S4 each exactly
once, with no duplicate, unknown, or omitted slot. The model-facing schema must
not expose Atlas IDs, source/evidence IDs, workspace/provenance bookkeeping,
persistence metadata, reconciliation, or publication state.

The product-independent instruction may only require extraction from authorized
source slots, source grounding, uncertainty/limit preservation, no invented
conditions, and schema-conforming output. It must not name Atlas, contain the
S1-S4 oracle/expected answers, or use near-copy examples.

Perform exactly two equivalent calls: same model, endpoint, schema,
instruction, fixture, slots, strict mode, and temperature. No adaptive prompt
change, corrective call, fallback, or Run 1 output sharing is permitted.

## Validation and deterministic finalization

For each terminal Gate B response, evaluate in this order:

```text
strict-mode acceptance and terminal response
  -> original semantic-proposal Zod parse
  -> exact S1-S4 slot accounting
  -> deterministic Atlas finalizer
  -> parseSemanticExtractionResult(...)
  -> frozen S1-S4 oracle
```

The finalizer owns generated Atlas IDs, deterministic semantic keys,
source-slot-to-real-source mapping, evidence/source inventory, question and
evidence bookkeeping, provider provenance, and Atlas envelope assembly. It may
perform only deterministic, semantics-preserving surface normalization. It must
not repair malformed provider output, alter a semantic kind, invent content,
turn possibility into certainty, infer an applicability condition, or replace
provider judgment.

The oracle must reject: S4 `modality = required`; S4
`applicabilityCondition = "before processing"`; S4 without material missing
applicability information; S2 that loses `2` or `per order`; S3 as a business
fact; and S1 that requests material clarification merely because submission
method is absent.

## Deterministic test and artifact requirements

Implement spike-local deterministic tests covering:

- `.env` credential loading without secret logging, missing-key fail-closed
  behavior, and `.env` ignore status;
- Zod-to-JSON-Schema generation, strict request construction, original-Zod
  response validation, and unknown-field rejection;
- real normalized-document fixture parsing; exact/duplicate/missing/unknown
  source-slot checks; and finalizer source-identity preservation;
- malformed response fail-closed behavior, finalizer non-invention, valid Atlas
  semantic-parser acceptance, and all S1-S4 oracle negatives above;
- safe telemetry/artifact sanitization, no retry/fallback/prompt mutation, and
  affected regression tests plus `git diff --check`.

Use isolated implementation such as `scripts/sem-anm-spike001/` and ignored
evidence under `.atlas-data/sem-anm-spike001/`. Capture `gate-a-transport.json`,
`semantic-run-1.json`, `semantic-run-2.json`, and `summary.json` in
secret-safe form. Never preserve API keys, authorization headers, raw secrets,
unbounded customer PRDs, or confidential content.

For every live call, record when exposed: served model, HTTP status, finish
reason, latency, input/output/reasoning/visible/total token counts,
`_anoman.weighted_tokens`, `_anoman.cost_usd`, routing mode/regions/provider
type, guardrail summaries, and cache status. Preserve gateway and provider
region separately; do not infer processing residency. A null billing field does
not prove zero cost.

## Terminal classification and report

Record exactly one final classification:

- `PASS`: Gate A passes; both Gate B outputs pass original Zod validation,
  S1-S4 oracle, deterministic Atlas finalization, and the Atlas parser; all
  required safe evidence exists.
- `PASS_WITH_LIMITS`: all PASS requirements hold, but a material non-oracle
  limitation such as latency variance, weighted-token consumption, observed
  cross-region routing, or non-blocking guardrail concern remains.
- `FAIL`: the route executes but fails strict schema, structure, semantics,
  final Atlas parsing, or requires repair.
- `ENVIRONMENT_BLOCKED`: meaningful qualification cannot run because of a
  correct-local-setup credential failure, entitlement/account block, outage,
  hard rate limit, or external network/environment failure. Provider capability
  incompatibility is `FAIL`, not `ENVIRONMENT_BLOCKED`.

Commit the sanitized report at
`project's goal/feedback/SEM-ANM-SPIKE001-anoman-schema-driven-semantic-route-qualification.md`.
It must include terminal result, checkpoint, provider/model, `.env` credential
source (never value), Gate A result, generated-schema and normalized-fixture
evidence, S1-S4 matrix, Zod and Atlas parser results, usage/latency/cost,
routing/region and guardrail observations, cross-run comparison, redaction
inspection, Review Contract closure, and exactly one recommendation.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-ANM-001` | Begin from a real `NormalizedDocument v1` boundary. | The fixture passes `parseNormalizedDocument(...)`; deterministic slots are bounded to S1-S4. |
| `RC-ANM-002` | Keep `ANOMAN_API_KEY` secret-safe and `.env` based. | Missing-key negative passes; no key/header appears in logs, artifacts, reports, or diff. |
| `RC-ANM-003` | Prove or disprove real strict-schema compatibility without fallback. | Gate A request/result is recorded; original Zod validates on pass or bounded failure evidence is preserved. |
| `RC-ANM-004` | Use a compact Zod-authored proposal schema distinct from Atlas authority. | Generated schema inspection shows semantic descriptions and no model-owned Atlas bookkeeping. |
| `RC-ANM-005` | Run the frozen S1-S4 semantic test twice. | Both runs preserve S1 workflow, S2 exact constraint, S3 non-fact, and S4 possible/unresolved applicability. |
| `RC-ANM-006` | Validate without semantic repair. | Original Zod accepts live output; malformed and semantic-repair negatives fail closed. |
| `RC-ANM-007` | Finalize deterministically into unchanged Atlas semantic authority. | Both final results pass `parseSemanticExtractionResult(...)`; no production-contract rewrite occurs. |
| `RC-ANM-008` | Preserve safe operational evidence. | Every live call has available usage, latency, routing, guardrail, and regional telemetry safely captured. |
| `RC-ANM-009` | Preserve frozen execution identity. | Config/fingerprint evidence proves no fallback, adaptive retry, or prompt mutation. |
| `RC-ANM-010` | Maintain repository and security hygiene. | `.env` is ignored; no secrets are committed; affected tests and `git diff --check` pass. |

## Security readiness

**Status:** `applicable`

| ID | Readiness item |
| --- | --- |
| `SR-ANM-IB-01` | Preserve `BSS-V2-004-02`, `NormalizedDocument v1`, and `atlas.semantic.extract/v1` as inherited authority; only the approved synthetic S1-S4 fixture crosses the external boundary. |
| `SR-ANM-IB-02` | Preserve frozen gateway/model/endpoint/strict-mode/two-run identity. Any route, model, schema, prompt, or call-budget change requires planning authority. |
| `SR-ANM-TB-01` | Treat Anoman output as untrusted until original Zod validation, source accounting, deterministic finalization, Atlas parsing, and semantic oracle evaluation complete. |
| `SR-ANM-SA-01` | Keep `ANOMAN_API_KEY`, authorization headers, environment data, and confidential content request-local and absent from artifacts, reports, logs, and diffs. |
| `SR-ANM-ID-01` | Preserve redacted configuration, schema/prompt/fixture fingerprints, call identity, and terminal evidence for comparable independent runs. |
| `SR-ANM-ES-01` | Keep request building, raw-result preservation, safe telemetry, schema validation, finalization, oracle, and reporting as separate seams. |
| `SR-ANM-PC-01` | Do not weaken contracts, repair semantic meaning, retry/fallback, transfer Atlas authority, activate production behavior, or couple the spike to reconciliation/publication. |
| `SR-ANM-VS-01` | Verify parser boundary, strict-schema mode, source scope, two-run isolation, sanitization, validation chain, oracle, telemetry, and regression hygiene. |
| `SR-ANM-UP-01` | Provider retention, tenancy, production privacy policy, durable residency guarantees, economics limits, and broader guardrail policy remain unresolved. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-ANM-RB-01` | `SR-ANM-IB-01`, `SR-ANM-TB-01` | Did only approved fixture content cross the boundary and remain untrusted? | Fixture/parser proof, redacted request manifest, and validation sequence from `RC-ANM-001`, `-005`, `-006`, `-007`. |
| `SR-ANM-RB-02` | `SR-ANM-IB-02`, `SR-ANM-ID-01` | Are all live calls identifiable and frozen to one route/profile? | Freeze record, request/config fingerprints, and per-call telemetry from `RC-ANM-003`, `-005`, `-009`. |
| `SR-ANM-RB-03` | `SR-ANM-SA-01` | Are credentials and authorization material excluded everywhere? | Credential/sanitizer tests, `.gitignore` check, artifact/report/log/diff inspection from `RC-ANM-002`, `-010`. |
| `SR-ANM-RB-04` | `SR-ANM-ES-01`, `SR-ANM-PC-01` | Does the implementation validate without repair or Atlas-authority transfer? | Schema/finalizer/negative-test review and contract diff from `RC-ANM-004`, `-006`, `-007`. |
| `SR-ANM-RB-05` | `SR-ANM-VS-01` | Does Gate A and each eligible Gate B result meet the frozen qualification protocol? | Gate result, per-run S1-S4 oracle matrix, telemetry records, and regression results from all RC rows. |

## Handoff and hard stop

After the terminal result, safe evidence, report, and all applicable review rows
are complete, set this ticket to `awaiting_review` and stop for CK. CK reviews
only this frozen contract and direct regressions. CFC may repair only an
explicitly authorized frozen finding. HMN alone may authorize scope expansion,
additional live-call budget, or provider/model/requirement changes. Do not
continue into `BSS-V2-004-03` or HB-01 through HB-09.
