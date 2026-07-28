# CES-GF-ATLAS-HARD-026 — Expanded Approval and Bulk Eligibility

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Extend immutable human approval and backend-owned bulk eligibility from
semantic records to assignments, relationships, targets, and workflow
ordering.

## Dependencies

- ATLAS-HARD-011 through ATLAS-HARD-013.
- ATLAS-HARD-022 through ATLAS-HARD-025.

## Work

- Support reclassify, split, merge, assignment, relationship, target, and
  ordering decisions.
- Calculate eligibility and blockers in the backend for every approvable
  entity.
- Exclude ambiguous, conflicting, unsupported, source-missing,
  classification-required, correction-requested, low-confidence, and
  uncovered-claim items.
- Require review for derived assignments, relationships, and ordering.
- Materialize approved models and projections only from immutable proposals
  plus human decisions.

## Outputs

Expanded `approval-eligibility.json`, `approval-decisions.json`,
`approved-project-model.json`, approved assignments and relationships,
approved focused projections, and `approval-report.md`.

## Acceptance criteria

- [ ] Every approvable entity has backend-calculated eligibility and blockers.
- [ ] Assignment and relationship decisions have immutable IDs.
- [ ] Derived ordering is not silently bulk-approved.
- [ ] Uncovered claims block affected approval and qualification.
- [ ] Atlas cannot author human approval decisions.
- [ ] Rejected or unresolved proposals cannot enter approved artifacts.
- [ ] Downstream execution remains blocked before materialization.

## Tests and evidence

Mixed bulk sets, exclusions, split/merge, reassignment, relationship change,
partial target approval, ordering review, stale decisions, and replay.

## Out of scope

Final Safara and lifecycle qualification remains ATLAS-HARD-015.
