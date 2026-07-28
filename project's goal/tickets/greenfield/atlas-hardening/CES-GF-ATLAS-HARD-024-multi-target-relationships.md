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

- Add deterministic multi-target proposals.
- Distinguish independent valid targets from competing alternatives.
- Carry target-level evidence, rationale, confidence, review status, and
  blockers.
- Preserve unresolved zero-target candidates.
- Materialize only human-accepted target decisions.

## Outputs

Multi-target candidates, target decisions, conflict findings, and approved
relationship materialization contracts.

## Acceptance criteria

- [ ] Zero-, one-, and multi-target relationships are representable.
- [ ] Several valid targets are not collapsed to one winner.
- [ ] Competing alternatives remain visibly unresolved.
- [ ] Each target is independently traceable and reviewable.
- [ ] Canonical records are not duplicated per target.
- [ ] Rejected targets cannot appear in approved projections.

## Tests and evidence

Shared validation, cross-workflow confidentiality, competing operations,
missing targets, partial approval, rejection, and deterministic ordering.

## Out of scope

Projection rendering is handled by ATLAS-HARD-025.
