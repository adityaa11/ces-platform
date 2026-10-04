# SEMSPIKE-006: Semantic IR live extraction qualification

- **State:** `awaiting_review`
- **Review batch:** `SEMSPIKE-BATCH-06`
- **Implementation context:** [SEMIR context §§40–61](../../SEMIR-context.md)
- **Start gate:** SEMIR-001 through SEMIR-004 `PASS`; complete offline release-gate evidence; explicit `go`; an invokable authenticated frozen Groq route.

## Outcome

Answer one constrained question: can `openai/gpt-oss-120b` transform a frozen, diverse set of source-grounded specification units into Semantic IR v0 twice while preserving semantic force, explicit knowledge gaps, evidence, and cross-run semantic consistency—without repair?

This is provider qualification only. The provider proposes untrusted source meaning; Atlas owns source authorization/accounting, schema/evidence validation, oracle evaluation, report, and all later truth/reconciliation decisions.

## Frozen provider profile

| Setting | Value |
| --- | --- |
| Provider | Groq |
| Model | `openai/gpt-oss-120b` |
| Streaming | `false` |
| Reasoning effort | `medium` |
| Output | Strict JSON Schema generated from the SEMIR-002 Zod contract |
| Credential | `GROQ_API_KEY` via environment only |
| Requests | Exactly two equivalent authenticated calls |
| Retry/fallback/repair | None |

The prompt must be frozen before Run 1. It may provide generic semantic policy, the generated schema, and only authorized source units. It must not include fixture answers, case-specific hints, oracle expectations, lexical shortcuts, prior output, post-failure corrections, Master facts, or context retrieval.

## Frozen live corpus and execution

Select approximately 12 context-free cases from SEMIR-001 after its freeze. The subset must include simple proposition, obligation, permission, possibility, nested possibility plus obligation, prohibition/negation, explicit condition, missing component, quantity/threshold, state transition, example/rationale, and non-semantic structure. Include all three `may` contrasts:

- `Users may export reports.`
- `Reports may contain personal information.`
- `Approval may be required before processing.`

For each identical run, retain ignored raw output and evaluate in this order:

```text
provider/HTTP success
  -> strict structured-output parse
  -> generating Zod parse
  -> exact source accounting
  -> evidence validation
  -> semantic oracle
  -> cross-run semantic comparison
```

No later stage may repair an earlier failure. The second request is independent: never include Run 1 output in Run 2.

## Terminal classification

- `PASS`: both runs complete and pass structural parsing, accounting, evidence, every critical semantic requirement, and cross-run semantic equivalence without repair.
- `FAIL`: an authenticated execution produces an invalid structure, accounting/evidence miss, semantic miss, or critical cross-run instability. Record one evidence-backed category: `IR_REPRESENTATION_FAILURE`, `SCHEMA_VALIDATION_FAILURE`, `EVIDENCE_GROUNDING_FAILURE`, `PROVIDER_STRUCTURAL_FAILURE`, `PROVIDER_SEMANTIC_FAILURE`, or `PROVIDER_STABILITY_FAILURE`.
- `ENVIRONMENT_BLOCKED`: authentication, provider outage, pre-semantic request rejection, or external infrastructure prevents meaningful execution. An HTTP-success semantic miss is `FAIL`.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMSPIKE-006-01` | Offline gate and freeze are real start conditions. | All SEMIR predecessors have `PASS` evidence; prompt, 12-case subset, schema, provider settings, and request shape are recorded before Run 1. |
| `RC-SEMSPIKE-006-02` | Requests are exactly bounded. | Exactly two independent non-streaming calls use only the frozen route/model/settings and authorized source units; no retry/fallback/repair occurs. |
| `RC-SEMSPIKE-006-03` | Raw responses fail closed structurally. | Both original outputs pass strict output and generating Zod parse, or terminal failure is accurately recorded without mutation. |
| `RC-SEMSPIKE-006-04` | Source and evidence boundaries hold. | Exact source accounting and evidence validation pass per run; no output cites an unauthorized unit. |
| `RC-SEMSPIKE-006-05` | Semantic force and incompleteness are preserved. | Every critical live-oracle dimension passes, including all `may` contrasts, nested modality, negation, condition/trigger, threshold, discourse, and unresolved meaning. |
| `RC-SEMSPIKE-006-06` | Independent semantic stability is proven. | Run 1/2 need not be byte-identical but are equivalent on all frozen critical dimensions; a critical difference is terminal `FAIL`. |
| `RC-SEMSPIKE-006-07` | Evidence/report and isolation are complete. | Ignored artifacts are secret-safe; report separates structural, evidence, semantic, stability, and terminal result; affected tests and `git diff --check` pass. |

## Evidence and report

Use ignored roots such as `.atlas-data/semantic-ir-v0/` and `.atlas-data/semantic-ir-spike-006/` for generated schema, redacted request metadata, raw responses, per-run evaluations, and summary. Never write `GROQ_API_KEY`, authorization headers, full environment dumps, or unapproved source content.

Commit the summary report to `project's goal/feedback/SEMSPIKE-006-semantic-ir-live-qualification.md`. It must separately state `STRUCTURAL RESULT`, `EVIDENCE RESULT`, `SEMANTIC RESULT`, `CROSS-RUN STABILITY`, and `TERMINAL RESULT`; include frozen profile/subset/prompt identity, run matrices, timing/token observations when available, failure category, review-contract closure, secret/redaction inspection, limits, and exactly one next planning recommendation.

## Security readiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-006-IB-01` | Only the frozen, non-confidential authorized subset crosses Atlas-to-Groq; no DocumentStore, Master, or project-fact discovery is added. |
| `SR-006-IB-02` | Preserve exact provider/model/mode/schema/prompt/two-run identity; changes require separate human-authorized qualification. |
| `SR-006-TB-01` | Provider output is untrusted until strict parse, Zod, accounting, evidence, oracle, and stability checks pass. |
| `SR-006-SA-01` | `GROQ_API_KEY` and authorization material remain environment/request-only and absent from logs, reports, committed files, and artifacts. |
| `SR-006-ID-01` | Preserve redacted run identity/order/configuration and artifact integrity so independent generations are comparable. |
| `SR-006-ES-01` | Keep request construction, raw preservation, structural/evidence validation, oracle, stability comparison, and reporting distinct. |
| `SR-006-PC-01` | Do not activate production behavior, semantic repair, retry/fallback, canonicalization, reconciliation, persistence, or old-parser coupling. |
| `SR-006-VS-01` | Verify predecessor gate, source scope, request count/profile, parsing, evidence, oracle, stability, isolation, and secret safety. |
| `SR-006-UP-01` | Broader provider privacy, retention, residency, tenancy, and future context policy remain intentionally unresolved. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-006-RB-01` | `SR-006-IB-01`, `SR-006-TB-01` | Did only authorized fixture units cross the boundary and remain untrusted after receipt? | Parsed slot manifest, redacted request metadata, validation sequence. |
| `SR-006-RB-02` | `SR-006-IB-02`, `SR-006-ID-01` | Are there exactly two independently identifiable frozen-profile runs? | Run records and configuration/prompt fingerprints. |
| `SR-006-RB-03` | `SR-006-SA-01` | Are credentials/authorization and unsafe source artifacts excluded? | Artifact/log/git inspection. |
| `SR-006-RB-04` | `SR-006-ES-01`, `SR-006-PC-01` | Is no validator repairing meaning or coupling the spike to production truth/routes? | Runner, validator, dependency, and route review. |
| `SR-006-RB-05` | `SR-006-VS-01` | Do both untouched outputs satisfy all frozen semantic/evidence/stability criteria? | Per-run and cross-run oracle matrices. |

## Handoff

After committing the summarized report and closing the frozen rows, set `awaiting_review` and stop for CK. A pass may support only separately authored planning for bounded context-aware qualification. A fail preserves the failing distinction and does not authorize prompt expansion or a model/provider change.
