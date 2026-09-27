# IDSER-011: Live Mistral acceptance checkpoint

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-11`
- **Depends on:** IDSER-010 `PASS` and its reviewed IDSER prerequisites.
- **Baseline:** SRC-IDSER-01 sections 12.5, 42 scenario I, 43-45; AC-41/42/43/44 plus end-to-end phase invariants. See [README](README.md).
- **Execution environment:** Real Compose stack and configured actual Mistral API through existing BSS-008 adapter.

## Outcome

Prove that actual Mistral OCR and structured extraction/reconciliation execute
through the production worker and authenticated Atlas handoffs to complete a
multi-PRD bundle at `Ready for review`. This is a mandatory acceptance gate.

## Scope and credential gate

- Add/document a repeatable live acceptance harness and secret-safe evidence record using at least two synthetic/non-confidential PDF PRDs in one newly created authenticated production project.
- Supply a real `MISTRAL_API_KEY` through the existing secret/environment configuration consumed by `agents-bridge` and `agents-bridge-worker`. Do not ask for a secret in a ticket or copy it into source, skill definitions, business records, browser responses, commands, logs, snapshots or review artifacts.
- Use configured `MISTRAL_API_BASE_URL`, `MISTRAL_STRUCTURED_MODEL`, `MISTRAL_OCR_MODEL`, `MISTRAL_ZDR_APPROVED` and inherited limit/retry settings. Record non-secret model/endpoint identity and outcome through the approved provenance boundary.
- Verify actual production configuration rather than dumping the environment or `docker compose config` with expanded secrets. No mock endpoint, TestRuntime, local pseudo-model or alternate provider qualifies.
- Missing/unavailable credentials or unreachable provider are `BLOCKED` as appropriate; invalid/rejected credentials or implementation failures are `FAIL`/`BLOCKED` according to evidence. Never mark this gate skipped and then mark the phase complete.
- Deterministic suites remain secret-free and authoritative for exact semantic classification. This live run proves integration, contract validity, provenance and bounded lifecycle, not brittle model wording.

## Required live procedure

1. Record reviewed HEAD, all prerequisite PASS references, Compose health and applied migrations. Confirm real provider configuration without exposing secrets.
2. Create a real project through the authenticated production creation flow with at least two synthetic PDFs. Record safe project/workspace/bundle/document/execution IDs and source hashes, upload order and initial state.
3. Observe D1 BSS-009 `MistralProvider.perceive(...)` and Atlas NormalizedDocument acceptance, followed by `atlas.semantic.extract/v1` via `MistralProvider.structured(...)`.
4. Verify Atlas deterministic extraction validation and candidate/evidence/index persistence, then D1 `atlas.semantic.reconcile/v1` via the same structured capability and authenticated result delivery.
5. Confirm D1 processed completion before D2 is scheduled; observe D2 real OCR, extraction and reconciliation with only the bounded relevant incoming D1/current-D2 context authorized by Atlas.
6. Verify all candidate/evidence/source-accounting/reconciliation references and provider provenance resolve to the actual run; inspect persisted full results and addressable records using bounded summaries in evidence.
7. Confirm bundle completion validation, workspace `ready_for_review`, card `Ready for review`, `2 of 2 PRDs processed` (or N/N for a larger run), and 100%.
8. Verify Master remains empty, published fact count stays zero, production review action remains truthfully unavailable and no out-of-scope review/projection/resolution/publication/conversation/CES state exists.

The live project should contain related synthetic statements so the D2 selector
can demonstrate a real bounded prior-neighborhood handoff. Do not require a
particular sentence or relationship label from nondeterministic model output;
assert schema/reference validity and record what the provider actually returned.
If no meaningful candidates or intended prior-neighborhood evidence is produced,
investigate and qualify the scenario rather than claiming unobserved coverage.

## Required evidence

| Evidence | Acceptance expectation |
|---|---|
| Environment | Reviewed HEAD, healthy existing services, migration results and exact secret-safe commands |
| Provider | Configured/actual model and endpoint provenance for OCR and both semantic skills, provider success/usage where available; no key |
| Execution | Existing worker handled both skills; no TestRuntime; document/stage ordering and Atlas-authorized context IDs/counts/bytes |
| Persistence | Complete validated extraction/reconciliation JSON retained, stable candidates/evidence/index/relationships and authenticated acceptance |
| Lifecycle | N/N processed, completion gate passed, card/workspace ready, unresolved results retained if produced |
| Authority | No Bridge direct trusted-state mutation; empty Master and no prohibited downstream state |
| Combined proof | IDSER-010 deterministic counts/regressions plus this live outcome, limitations and any unrelated skips |

Provider provenance fields must use existing approved storage/usage boundaries.
If OCR endpoint information is not a persisted NormalizedDocument field, record
secret-safe execution evidence alongside the configured model and actual adapter
path; do not redesign BSS-009 merely for a new provenance column.

## Acceptance criteria

1. Real credentials are supplied through the existing Bridge environment boundary and never appear in persisted business data or evidence.
2. At least two PDFs execute real BSS-009 OCR and both real semantic structured skills through existing MistralProvider methods and the existing worker.
3. Provider outputs pass actual Atlas schemas, exact evidence/source accounting and authorized relationship-reference validation.
4. The persisted sequence/context and completion evidence proves the procedural bundle pipeline, authenticated result handoff and ready-for-review state.
5. No model output is promoted to accepted/resolved truth; Master and downstream excluded features remain untouched.
6. Phase completion requires this gate and IDSER-010 both PASS. Credential/provider blockage is recorded honestly and leaves IDSER incomplete.

## Validation

- Run the live harness in Compose; record exact command and actual result rather than a proposed invocation.
- Inspect non-secret execution/provider provenance and persisted scope/relationship/count summaries.
- Confirm browser card behavior for the live persisted project and negative authority state.
- Re-run affected deterministic checks only if the live run requires code/configuration changes that invalidate prior evidence; preserve checkpoint/HEAD traceability.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** BSS-008 secrets/privacy/provider config, BSS-009 OCR, Atlas internal acceptance and IDSER bounded context.
- **Trust boundaries / assets:** synthetic source-derived context reaches actual external Mistral; API/service credentials and provider evidence require safe handling.
- **Identity context:** exact reviewed HEAD, bundle/document/stage IDs, source hashes, skill versions and actual provider provenance.
- **SEAM-IDSER-011-01:** Explicit live credential gate and secret-safe execution evidence separate actual provider qualification from mocked proof.
- **COUPLING-IDSER-011-01:** No secret dumps, confidential source substitution without approved controls, fallback runtime or skipped live gate counted as phase completion.
- **Unresolved security policy:** confidential deployment material/privacy approval is outside this synthetic checkpoint.
- **Planning findings:** credential availability is not assessed during ticket authoring; this is an execution-time prerequisite, not a reason to leave the ticket set unwritten.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-011-01 | SEAM-IDSER-011-01 | Do actual provider and persistence records prove OCR plus both structured skills on two PDFs? Secret-safe live evidence. |
| REV-READY-IDSER-011-02 | COUPLING-IDSER-011-01 | Is evidence free of secrets and completion withheld if the live gate fails/blocks? Configuration handling and final status review. |

## Review checkpoint

**Question:** Has the complete authorized production path actually succeeded
with real Mistral while preserving all Atlas authority and hard-stop rules?

**Implementation checkpoint:** Not started. Record reviewed implementation HEAD,
live evidence and consolidated review. Only after all required PASS checkpoints
may the ticket set state become `complete`.
