# CES-GF-ATLAS-HARD-015 — Safara Qualification Gate

**Stage:** Atlas hardening production gate
**Status:** Planned

## Objective

Prove the complete hardening lifecycle against the reviewed Safara oracle and
block production approval UI integration until every mandatory gate passes.

## Dependencies

- ATLAS-HARD-001 through ATLAS-HARD-014.
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
- [ ] Failures identify the responsible pipeline stage and remain non-success.
- [ ] Proposed and approved artifact suites validate end to end.
- [ ] Human review is recorded; Atlas does not self-certify.
- [ ] Existing DAPE, Atlas, CLI, and greenfield regressions remain green.
- [ ] Production approval UI integration remains blocked until acceptance.

## Outputs and evidence

Qualification report, oracle mapping, artifact hashes, redacted provider report,
failure variants for every gate, reviewer acceptance, and roadmap gate update.

## Out of scope

Production approval UI implementation and multi-domain qualification, which
follows Safara acceptance.
