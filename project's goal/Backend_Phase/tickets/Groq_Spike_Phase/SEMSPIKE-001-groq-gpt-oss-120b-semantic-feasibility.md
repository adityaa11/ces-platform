# SEMSPIKE-001: Groq GPT-OSS-120B bounded semantic extraction feasibility

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-01`
- **Primary source:** [SEMSPIKE-001 implementation context](../../atlas-semspike-001-groq-gpt-oss-120b-implementation-context.md), sections 1–35
- **Dependencies:** existing `parseNormalizedDocument(...)`, `parseSemanticExtractionResult(...)`, `NormalizedDocument v1`, and `atlas.semantic.extract/v1`; none may change
- **Frozen target:** Groq `openai/gpt-oss-120b`, `GROQ_API_KEY`, `reasoning_effort=medium`, non-streaming strict JSON Schema, no tools/web search/code execution/MCP/agent loop

## Outcome and authority

Run a small, reproducible live experiment that sends exactly the authorized
four-source fixture to Groq and answers one question: can the provider propose
bounded source meaning that Atlas deterministically finalizes into a valid
current semantic-v1 extraction result?

```text
real parseNormalizedDocument(...)
  -> S1..S4 temporary slots only
  -> Groq semantic proposal
  -> trusted Atlas slot mapping and deterministic finalizer
  -> real parseSemanticExtractionResult(...)
```

Groq proposes meaning only. Atlas remains the authority for source identity,
source accounting, locators, evidence, candidate IDs, semantic-v1 envelope,
validation, persistence, review, publication, and accepted truth. The provider
never receives action authority or any Atlas identity/persistence context.

## Frozen scope

### In scope

- Add isolated code only beneath `scripts/groq-semantic-spike/` (for example,
  `fixture.ts`, `intermediate-schema.ts`, `groq-client.ts`, `finalize.ts`,
  `run.ts`, and `README.md`). Prefer a bounded direct HTTP call; do not add a
  production Groq SDK dependency solely for this experiment.
- Construct exactly four non-empty fixture text blocks, with deterministic
  page-one locators `spike-text-001` through `spike-text-004`, validate the
  fixture through the real `parseNormalizedDocument(...)`, and map temporary
  slots `S1`–`S4` only inside Atlas spike code.
- Send only each slot's number, structural kind, and text. The model must
  return the deliberately tiny, strict intermediate shape; every object uses
  `additionalProperties: false`. Allowed candidate kinds are the existing
  semantic-v1 vocabulary, never a parallel vocabulary.
- Reject missing, duplicate, unknown, or invalid source-slot dispositions.
  Missing model output is never treated as `non_fact`.
- Deterministically construct candidates, source inventory, questions,
  evidence, exact `source_wording`, and stable candidate IDs such as
  `spike.s1.c1`; use `{}` for candidate `payload`. Evidence excerpts must come
  from the validated fixture, not a model paraphrase.
- Execute the exact request at least twice; record secret-safe per-run
  provider/model/HTTP status/latency/token usage when returned/reasoning mode/
  structured-output mode/counts/parser result and all accounting/schema/
  semantic deviations. Preserve material run differences as evidence.
- Write ignored local artifacts under `.atlas-data/groq-semantic-spike/` and
  the committed summary report at
  `project's goal/feedback/SEMSPIKE-001-groq-gpt-oss-120b-semantic-extraction-feasibility.md`.

### Controlled semantic oracle

| Slot | Source and structural kind | Required result |
| --- | --- | --- |
| S1 | `The customer submits an order.` — paragraph | `candidate`: `workflow_step`, no resolution needed |
| S2 | `Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.` — paragraph | `candidate`: `constraint`, preserving customer, exact `2`, product, and per-order scope |
| S3 | `3.2 Purchase Rules` — heading | `non_fact`: structural context, never a business fact |
| S4 | `Approval may be required before processing.` — paragraph | `uncertain`: `unresolved`, `needs_resolution=true`, with an approval-condition clarification question |

Each source result has exactly `slot`, `disposition`, `candidates`,
`non_fact_reason`, `question`, and `question_reason`. `candidate` needs one or
more candidates and an empty non-fact reason; `non_fact` needs no candidates,
a reason, and empty question fields; `uncertain` needs candidates, a question
and reason, and all relevant candidates marked `needs_resolution=true`.

Final inventory classifications remain semantic-v1's `candidate` or
`non_fact`: S1/S2/S4 are `candidate`; S3 is `non_fact`; `uncertain` remains
transport-only. S4's final question gets trusted S4 evidence. All four entries
must be present exactly once.

### Explicitly excluded

- Production Groq adapter, provider route activation, BSS-V2 qualification or
  ticket-state changes, semantic-worker changes, provider fallback, pricing,
  database writes, queues, replay/fencing, or SDK/runtime migration.
- Changes to `NormalizedDocument v1`, semantic-v1, existing parsers, source
  accounting, candidate/evidence authority, review semantics, or persistence.
- Reconciliation, Knowledge Index, embeddings/vector database, retrieval,
  Main Workflow, Project Facts/Context, CES Result, human review, full Safara
  extraction, and multilingual qualification beyond S2's narrow sanity check.
- Full PDFs, real workspace/Master/review state, user credentials, database
  state, the complete semantic-v1 schema, secrets, or provider authentication
  material in the model request or committed evidence.

## Review contract

| Row | Exact bounded behavior | Binary evidence and closure oracle |
| --- | --- | --- |
| `RC-SEMSPIKE-001-01` | Make a real authenticated call to exactly the frozen Groq model and configuration. | Secret-safe request metadata and terminal structured response. **PASS iff** `openai/gpt-oss-120b` accepts the configured strict structured request; documentation/model labels are insufficient. |
| `RC-SEMSPIKE-001-02` | Build the controlled four-source input through the existing perception contract. | Fixture plus real `parseNormalizedDocument(...)` result. **PASS iff** all four authorized source units validate without a new perception contract/parser. |
| `RC-SEMSPIKE-001-03` | Require exactly one valid provider disposition for each S1–S4. | Intermediate-schema result and negative accounting checks. **PASS iff** no slot is missing, duplicate, unknown, silently synthesized, or invalidly classified. |
| `RC-SEMSPIKE-001-04` | Preserve the four required semantic decisions and their source meaning. | Source-by-source observed matrix. **PASS iff** S1 workflow step, S2 constraint with `2`/per-order scope, S3 non-fact, and S4 unresolved uncertainty are all preserved without invented meaning. |
| `RC-SEMSPIKE-001-05` | Atlas, rather than Groq, produces all semantic-v1 identity and evidence fields. | Deterministic finalizer output and real parser result. **PASS iff** trusted evidence/exact wording/IDs/inventory/questions are Atlas-owned and unchanged `parseSemanticExtractionResult(...)` accepts the result. |
| `RC-SEMSPIKE-001-06` | Compare two equivalent live executions and report the outcome truthfully. | Run-1/run-2 decision comparison, report, affected tests, and `git diff --check`. **PASS iff** no material disagreement or limitation is hidden by post-processing. |

## Terminal classification and stop conditions

Classify exactly one outcome: `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`. `PASS` needs every review row, semantic-v1 parser
acceptance, source-grounded evidence, no contract/route change, and materially
consistent runs. `PASS_WITH_LIMITS` is allowed only when the core hypothesis
succeeds and a non-blocking limitation (such as equivalent normalized wording)
is explicit. `FAIL` covers wrong disposition, lost numeric/scope meaning,
false resolution, omitted/invented slots, invalid finalization, or a need to
weaken an Atlas contract. `ENVIRONMENT_BLOCKED` is reserved for a credential,
exact-model/capability, outage, quota, or network condition that prevents
meaningful semantic execution; it is not a model-quality result.

Stop as `SCOPE_CHANGE` if completion would require an Atlas contract or
perception change, a production worker/route/provider, reconciliation,
Knowledge Index, embeddings, database/queue work, full Safara content, a new
semantic vocabulary, or changed authority/review semantics.

## Security readiness

```text
SecurityReadiness
status: applicable
inheritedBoundaries:
  - BOUNDARY-SEMSPIKE-001-SOURCE: only the controlled non-confidential four-source fixture reaches Groq.
  - BOUNDARY-SEMSPIKE-001-AUTHORITY: Groq output is an untrusted proposal; it cannot create Atlas truth, review, publication, or workspace resolution.
  - BOUNDARY-SEMSPIKE-001-IDENTITY: Atlas alone creates source IDs, locators, evidence, candidate IDs, and persistence identity.
  - BOUNDARY-SEMSPIKE-001-SECRETS: GROQ_API_KEY remains environment-only and absent from logs, artifacts, and reports.
sensitiveAssets:
  - ASSET-SEMSPIKE-001-SOURCE: fixture wording, source IDs, locators, and exact evidence excerpts.
  - ASSET-SEMSPIKE-001-CONTRACT: unchanged semantic-v1 and perception-contract authority.
  - ASSET-SEMSPIKE-001-CREDENTIAL: the Groq API credential and Authorization material.
identityContext:
  - IDCTX-SEMSPIKE-001-ATLAS: trusted S1–S4 mapping must be the only route to final evidence and IDs.
extensionSeams:
  - SEAM-SEMSPIKE-001-TRANSPORT: the spike-only strict intermediate schema isolates provider reasoning from Atlas contracts.
  - SEAM-SEMSPIKE-001-FINALIZATION: deterministic finalization and real parser invocation remain the audit point.
  - SEAM-SEMSPIKE-001-OBSERVABILITY: redacted run metrics and semantic comparison retain inspectable provider evidence.
prohibitedCouplings:
  - COUPLING-SEMSPIKE-001-PRODUCTION: spike modules must not enter production runtime, routing, worker, queue, or persistence paths.
  - COUPLING-SEMSPIKE-001-CONTRACT: no weakened parser, accounting rule, source identity, or deterministic filling of missing provider meaning.
  - COUPLING-SEMSPIKE-001-SECRETS: no credential/header in source, reports, or local diagnostics.
verificationSeams:
  - VERIFY-SEMSPIKE-001-SOURCE: exact four-slot validation and negative source-accounting tests prove bounded source handling.
  - VERIFY-SEMSPIKE-001-AUTHORITY: deterministic trusted-evidence construction and the real semantic-v1 parser prove Atlas authority.
  - VERIFY-SEMSPIKE-001-SECRETS: artifact/report inspection proves credential-safe evidence.
unresolvedSecurityPolicy:
  - POLICY-SEMSPIKE-001-FUTURE: production retention, access control, residency, provider governance, and route policy remain intentionally unresolved.
planningFindings: []
reviewBindings:
  - REV-SEMSPIKE-001-01 -> VERIFY-SEMSPIKE-001-SOURCE: confirm no material beyond S1–S4 reached Groq and every slot is accounted exactly once.
  - REV-SEMSPIKE-001-02 -> VERIFY-SEMSPIKE-001-AUTHORITY: confirm Atlas—not Groq—constructs identities/evidence and the real parser is final authority.
  - REV-SEMSPIKE-001-03 -> VERIFY-SEMSPIKE-001-SECRETS: confirm no API key or Authorization data is committed or reported.
```

## Validation and handoff

Run controlled-fixture validation, live run 1, live run 2, intermediate-schema
validation, Atlas finalization, the real semantic-v1 parser, directly affected
Atlas contract tests, and `git diff --check`. Do not stop after an HTTP response
or provider-schema success.

The report must state the terminal result; provider/model/reasoning/strict-mode
configuration; authenticated-live-inference yes/no; that `NormalizedDocument
v1`, semantic v1, production semantic worker, and production route remained
unchanged; that Knowledge Index and reconciliation were not implemented/tested;
the required source and integrity matrices; final parser result; repeatability;
token/latency observations; limitations; and one next recommendation. It must
also state: `Candidate payload semantics were not qualified by SEMSPIKE-001.`

A successful ticket stops after review readiness. Its only permitted follow-up
recommendation is separately authored planning for the next bounded stage; it
does not authorize that stage or production adoption.
