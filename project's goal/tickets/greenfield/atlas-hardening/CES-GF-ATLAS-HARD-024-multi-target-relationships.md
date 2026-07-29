# CES-GF-ATLAS-HARD-024 — Multi-Target Relationships

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Allow one relationship meaning to apply to zero, one, or several valid targets
without selecting only the highest-ranked target or duplicating its source
record.

## Dependencies

- ATLAS-HARD-022 and ATLAS-HARD-023.

## Work

- Add deterministic multi-target proposals with three identity layers:
  `relationship_intent_id` for shared meaning,
  `target_candidate_id` for each proposed target association, and
  `approved_relationship_id` for each edge later materialized by
  ATLAS-HARD-026.
- Distinguish independent valid targets from competing alternatives.
- Carry target-level evidence, rationale, confidence, review status, and
  blockers.
- Preserve unresolved zero-target candidates.
- Produce target-level review subjects and blockers without materializing
  authoritative relationships; materialization belongs exclusively to
  ATLAS-HARD-026.

## Outputs

Relationship intents, target candidates, target-level evidence and blockers,
conflict findings, and review-subject contracts consumed by ATLAS-HARD-026.

## Acceptance criteria

- [ ] Zero-, one-, and multi-target relationships are representable.
- [ ] Several valid targets are not collapsed to one winner.
- [ ] Competing alternatives remain visibly unresolved.
- [ ] Each target is independently traceable and reviewable.
- [ ] Accepting or rejecting one target does not change the intent identity or
      invalidate unrelated target decisions.
- [ ] Intent, target candidate, and approved edge identities are distinct.
- [ ] HARD-024 produces no authoritative approved relationship.
- [ ] Canonical records are not duplicated per target.
- [ ] Rejected targets cannot appear in approved projections.

## Tests and evidence

Shared validation, cross-workflow confidentiality, competing operations,
missing targets, partial approval, rejection, and deterministic ordering.

## Out of scope

Projection rendering is handled by ATLAS-HARD-025.
