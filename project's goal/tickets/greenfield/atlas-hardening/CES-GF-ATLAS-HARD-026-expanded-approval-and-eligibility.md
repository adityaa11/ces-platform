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
- Record `predecessor_record_ids` and `successor_record_ids` for every split
  and merge, preserving source lineage and making successor identity explicit.
- Make approved logical identity migration a separate reviewable decision.
- Mark decisions affected by a split, merge, or meaning-changing revision stale
  instead of silently transferring them; retain reusable decisions only when
  their governed target and meaning are unchanged.
- Prevent rejected predecessor records from silently reappearing through a
  successor.
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
- [ ] Split and merge decisions explicitly record predecessor and successor
      record IDs and preserve source lineage.
- [ ] Approved logical identity migration is explicit and reviewable.
- [ ] Affected predecessor decisions become stale and never silently transfer
      to successors.
- [ ] Unaffected decisions remain reusable when their governed target and
      meaning are unchanged.
- [ ] Rejected predecessor records cannot silently reappear after split or
      merge.
- [ ] Split/merge decision replay is deterministic.
- [ ] Derived ordering is not silently bulk-approved.
- [ ] Uncovered claims block affected approval and qualification.
- [ ] Atlas cannot author human approval decisions.
- [ ] Rejected or unresolved proposals cannot enter approved artifacts.
- [ ] Downstream execution remains blocked before materialization.

## Tests and evidence

Mixed bulk sets, exclusions, one-to-many split, many-to-one merge, logical
identity migration, rejected-predecessor recurrence, reassignment,
relationship change, partial target approval, ordering review, stale and
unaffected decisions, and deterministic replay.

## Out of scope

Final Safara and lifecycle qualification remains ATLAS-HARD-015.
