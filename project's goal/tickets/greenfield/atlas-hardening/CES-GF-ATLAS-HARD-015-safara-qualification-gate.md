# CES-GF-ATLAS-HARD-015 — Final Safara Qualification Gate

**Stage:** Atlas hardening production gate
**Status:** Blocked pending ATLAS-HARD-021 through ATLAS-HARD-027 remediation, ATLAS-UI-001 through ATLAS-UI-005 qualification, and final rerun
**Execution order:** Final delivery gate — execute last

## Objective

Prove the complete hardening lifecycle against the reviewed Safara oracle and
block production approval UI integration until every mandatory gate passes.

## Dependencies

- ATLAS-HARD-001 through ATLAS-HARD-014.
- ATLAS-HARD-016 and ATLAS-HARD-017 corrective production integration.
- ATLAS-HARD-018 through ATLAS-HARD-026 canonical-model and projection
  refinement.
- ATLAS-HARD-027 golden main-workflow projection and domain-neutral regression.
- ATLAS-UI-001 through ATLAS-UI-005 workflow review UI implementation and
  production qualification.
- Completed and reconciled DAPE-008R real-provider evidence.

## Work

- Run deterministic fixture qualification and the approved redacted
  real-provider path.
- Measure main-rule recall, workflow representation, broader normative recall,
  final reviewed coverage, source grounding, distortion, ambiguity/conflict
  surfacing, determinism, pre-approval graph availability, authority flags, and
  downstream blocking.
- Prove claim-level completeness, identity stability, multilingual
  equivalence, assignment correctness, relationship correctness, and focused
  projection correctness.
- Attribute each failure to parsing, extraction, classification, normalization,
  deduplication, assignment, projection, review, or publication.
- Store redacted evidence, commands, versions, hashes, exit codes, and reviewer
  acceptance.
- Add the production integration gate to the authoritative roadmap/CI boundary.
- Report Safara results strictly as qualification of that fixture and of the
  extraction/review/publication lifecycle, never as proof of general domain
  coverage.
- Define the follow-on multi-domain qualification suite using structurally
  different domains, vocabulary, actors, state models, calculations, approval
  boundaries, and graph shapes; production-domain-generality claims remain
  blocked until that later suite passes.

## Required gates

- 10/10 primary Safara rules after bounded retry.
- 100% workflow-area representation.
- At least 90% broader normative recall before review and 100% after review.
- Zero unsupported or materially distorted approved records.
- 100% approved-record source references and preserved exact text where
  available.
- 100% ambiguity/conflict surfacing.
- Every normative atomic claim has a valid disposition and no uncovered claim
  remains.
- Stable record IDs survive duplicate discovery, retry, ordering, language,
  and workflow-assignment changes.
- Same-meaning multilingual representations produce one governed semantic
  concept and one projected node while preserving every exact original
  document representation.
- Lexical hints are not published as established relationships; derived and
  multi-target relationships remain reviewable.
- Project overview contains only major process semantics while workflow detail,
  rules and controls, traceability, and exceptions preserve the complete model.
- Deterministic output, focused pre-approval projections, non-authoritative
  proposal, and blocked downstream execution before publication.

## Acceptance criteria

- [ ] Every mandatory gate passes with stored evidence.
- [x] Failures identify the responsible pipeline stage and remain non-success.
- [x] Proposed artifact suite validates end to end; approved publication remains
      gated on human review.
- [ ] Human review is recorded; Atlas does not self-certify.
- [ ] Existing DAPE, Atlas, CLI, and greenfield regressions remain green.
- [ ] All ATLAS-HARD-018 through ATLAS-HARD-026 and ATLAS-UI-001 through
      ATLAS-UI-005 acceptance criteria pass.
- [ ] ATLAS-HARD-027 golden overview and domain-neutral regression pass.
- [x] Production approval UI integration remains blocked until acceptance.
- [x] Qualification reports contain no claim that Safara alone proves
      domain-agnostic extraction.
- [x] A separately tracked multi-domain gate and minimum cross-domain acceptance
      criteria are documented before closing the program.

## Outputs and evidence

Qualification report, oracle mapping, artifact hashes, redacted provider report,
failure variants for every gate, reviewer acceptance, and roadmap gate update.
The report must distinguish “Safara/lifecycle qualified” from
“multi-domain qualified.”

## Out of scope

Production approval UI implementation. Execution of the multi-domain suite
follows Safara acceptance, but defining its gate and preventing premature
generality claims are included here.

## Pre-refinement baseline evidence

This evidence documents the previous pipeline and is retained for comparison
only. It does not satisfy the reopened qualification gate.

- `packages/atlas-quality-evidence` contains a strict, deterministic Safara
  qualification report contract and mandatory-gate calculator.
- Failed gates remain failed and identify parsing, extraction, classification,
  normalization, deduplication, assignment, projection, review, or publication.
- Reports require a human reviewer, fixture and real-provider evidence hashes,
  artifact hashes, the Safara-only claim scope, and an explicit false general
  domain-coverage claim.
- `MULTI_DOMAIN_QUALIFICATION_PLAN.md` defines the later cross-domain gate.
- Workspace typecheck and build pass. The Atlas qualification tests pass.
- The full workspace test run passes 326 tests; two unrelated
  `bootstrap-runner` process-timeout tests exceed 15 seconds on Windows.

## Reopened qualification blocker

The pre-refinement live pipeline ran with `gemini-3.1-flash-lite` and paused
for review. That user-check suite contains 113 generic candidates,
106 normalized records, zero duplicate normalized statements, 106 typed graph
nodes, and 18 evidence-grounded relationships (`governs`, `constrains`, and
`produces`). Candidate consolidation retains every contributing candidate ID
and source-unit ID. Relationship projection requires shared source evidence
and lexical support; it does not invent workflow order.

Those baseline artifacts are stored locally under
`.ces/generated/atlas-user-check`. They remain non-authoritative and downstream
execution remains blocked. They predate ATLAS-HARD-018 through ATLAS-HARD-026
and cannot be accepted as evidence for the reopened gate, even if reviewed.

HARD-015 remains open until tickets 018 through 026 are implemented, the
Safara qualification suite is rerun, every mandatory semantic and projection
gate passes, and new approval and downstream-blocking evidence is generated
and accepted by a human reviewer.

## Post-HARD-018-to-HARD-026 qualification update

The live Safara rerun produced canonical workflow inventory artifacts, but it
did not produce connected workflow topology:

- 11 workflows, 25 operations, and 384 workflow assignments were emitted;
- 19 relationship candidates remained correctly non-authoritative;
- `workflow-edges.json` was empty;
- every workflow-detail projection had an empty `edges` collection;
- approved relationship replay into approved focused projections was not
  demonstrated.

ATLAS-HARD-021 through ATLAS-HARD-026 are therefore reopened. HARD-015 remains
blocked until their new acceptance gaps are closed and the Safara gate is
rerun.

The rerun must enforce the measurable thresholds recorded in each reopened
ticket, including non-empty governed topology, assignment precision, complete
relationship governance, multi-target review evidence, deterministic Mermaid
projections, and zero pending/rejected edge leakage into approved artifacts.

Verification:

- Workspace typecheck passes.
- Focused canonical CLI, Bridge integration, proposed-model, and intent-graph
  suites pass.
- The broad non-bootstrap test run completed 307 passing tests before one
  Vitest worker exceeded the Windows Node heap; no test assertion failed in
  the completed suites.
