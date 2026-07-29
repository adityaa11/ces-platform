# CES-GF-ATLAS-HARD-026 — Expanded Approval and Bulk Eligibility

**Stage:** Canonical model and workflow projection refinement
**Status:** Reopened — approval contracts exist, approved topology replay is incomplete

## Objective

Extend immutable human approval and backend-owned bulk eligibility from
semantic records to terminology, assignments, relationships, targets, and
workflow ordering.

## Dependencies

- ATLAS-HARD-011 through ATLAS-HARD-013.
- ATLAS-HARD-022 through ATLAS-HARD-025.

## Work

- Support terminology, reclassify, split, merge, assignment, relationship,
  target, and ordering decisions.
- Record `predecessor_record_ids` and `successor_record_ids` for every split
  and merge, preserving source lineage and making successor identity explicit.
- Require each split or merge to create a new immutable corrected proposal
  revision containing complete schema-valid successor records. Decisions must
  reference the source and successor proposal revisions, migration rationale,
  predecessor and successor IDs, logical-identity migration, stale decisions,
  and reusable unaffected decisions.
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
- Resolve every successor ID to a complete immutable record payload before
  materialization; approval decisions cannot construct partial authoritative
  records from identifiers alone.

## Outputs

Expanded `approval-eligibility.json`, `approval-decisions.json`,
`approved-project-model.json`, approved assignments and relationships,
`approved-terminology-registry.json`, approved focused projections, and
`approval-report.md`.

## Acceptance criteria

- [x] Every approvable entity has backend-calculated eligibility and blockers.
- [x] Assignment and relationship decisions have immutable IDs.
- [x] Split and merge decisions explicitly record predecessor and successor
      record IDs and preserve source lineage.
- [x] Every successor resolves within a new immutable corrected proposal
      revision to a complete schema-valid record.
- [x] Split and merge decisions reference both source and successor proposal
      revisions plus migration rationale.
- [x] Approved logical identity migration is explicit and reviewable.
- [x] Affected predecessor decisions become stale and never silently transfer
      to successors.
- [x] Unaffected decisions remain reusable when their governed target and
      meaning are unchanged.
- [x] Rejected predecessor records cannot silently reappear after split or
      merge.
- [x] Split/merge decision replay is deterministic.
- [x] Materialization fails closed when any successor payload is missing,
      incomplete, schema-invalid, or revision-mismatched.
- [x] Derived ordering is not silently bulk-approved.
- [x] Uncovered claims block affected approval and qualification.
- [x] Atlas cannot author human approval decisions.
- [x] Rejected or unresolved proposals cannot enter approved artifacts.
- [x] Downstream execution remains blocked before materialization.

## Tests and evidence

Mixed bulk sets, exclusions, one-to-many split, many-to-one merge, logical
identity migration, rejected-predecessor recurrence, reassignment,
relationship change, partial target approval, ordering review, stale and
unaffected decisions, and deterministic replay.

## Out of scope

Final Safara and lifecycle qualification remains ATLAS-HARD-015.

## Reopened acceptance gaps

The Safara output did not demonstrate that accepted assignments and
relationships are replayed into connected approved workflow projections.

- [ ] Emit approved workflow assignments and approved relationships.
- [ ] Materialize approved workflow-detail and project-overview projections.
- [ ] Include approved edges and exclude pending or rejected edges.
- [ ] Materialize human-added edges only from immutable reviewer decisions.
- [ ] Preserve the original proposed model unchanged.
- [ ] Prove deterministic replay from immutable proposal plus decisions.
- [ ] Store Safara evidence for partial multi-target approval and stale
      decision handling.
- [ ] Accepted multilingual equivalence decisions materialize one governed
      semantic concept without losing any exact original document
      representation.
- [ ] Rejected equivalence decisions keep concepts separate and preserve their
      independent identities and evidence.

### Safara qualification thresholds

- [ ] Approved assignments and relationships are materialized 100% according
      to accepted decisions.
- [ ] Pending and rejected edge leakage into approved projections equals zero.
- [ ] Approved workflow-detail and overview projections contain every accepted
      topology edge.
- [ ] Human-added approved edges resolve only from immutable reviewer
      decisions.
- [ ] Replaying identical proposal and decision inputs produces identical
      approved artifact hashes.

## Implementation evidence

Atlas now calculates expanded eligibility for records, assignments,
cross-cutting controls, relationship intents and targets, workflow edges, and
terminology proposals. Immutable human-only decisions cover approval,
reclassification, reassignment, relationship/order changes, terminology,
logical-identity migration, split, and merge. Replay distinguishes stale
meaning-changing targets from reusable unaffected decisions.

Split/merge decisions require a later immutable proposal revision and complete
schema-valid successor records; the materializer refuses to publish structural
changes directly from identifiers. Expanded materialization publishes approved
records, assignments, relationships, terminology, lifecycle-neutral focused
projections, and `approval-report.md` from proposal plus human ledger only.
The CLI emits backend-owned `approval-eligibility.json` before review.

Verification:

- Builds: proposed-project-model, Atlas review, Atlas intent graph,
  approved-project-model, and CLI typecheck.
- `corepack pnpm vitest run packages/proposed-project-model/src/index.test.ts packages/atlas-review/src/proposal-decisions.test.ts packages/approved-project-model/src/hardened.test.ts packages/atlas-intent-graph/src/index.test.ts apps/cli/src/atlas.test.ts`
- 25 focused tests passed.
