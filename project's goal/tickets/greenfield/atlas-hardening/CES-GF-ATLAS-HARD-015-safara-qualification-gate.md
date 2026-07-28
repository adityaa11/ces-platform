# CES-GF-ATLAS-HARD-015 — Safara Qualification Gate

**Stage:** Atlas hardening production gate
**Status:** Reopened; blocked by ATLAS-HARD-016 and ATLAS-HARD-017

## Objective

Prove the complete hardening lifecycle against the reviewed Safara oracle and
block production approval UI integration until every mandatory gate passes.

## Dependencies

- ATLAS-HARD-001 through ATLAS-HARD-014.
- ATLAS-HARD-016 and ATLAS-HARD-017 corrective production integration.
- Completed and reconciled DAPE-008R real-provider evidence.

## Work

- Run deterministic fixture qualification and the approved redacted
  real-provider path.
- Measure main-rule recall, workflow representation, broader normative recall,
  final reviewed coverage, source grounding, distortion, ambiguity/conflict
  surfacing, determinism, pre-approval graph availability, authority flags, and
  downstream blocking.
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
- Deterministic output, pre-approval graph, non-authoritative proposal, and
  blocked downstream execution before publication.

## Acceptance criteria

- [ ] Every mandatory gate passes with stored evidence.
- [x] Failures identify the responsible pipeline stage and remain non-success.
- [ ] Proposed and approved artifact suites validate end to end.
- [ ] Human review is recorded; Atlas does not self-certify.
- [ ] Existing DAPE, Atlas, CLI, and greenfield regressions remain green.
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

## Implementation evidence

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

## Acceptance blocker

The repository's `DAPE-008R-status.md` still records **Not run**, and no
redacted real-provider qualification report or reviewer acceptance is stored.
Therefore the mandatory evidence, end-to-end artifact, human-review, and full
regression acceptance boxes above remain deliberately unchecked.
