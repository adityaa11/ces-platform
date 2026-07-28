# CES-GF-ATLAS-HARD-023 — Reviewable Relationship Candidates

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Replace directly published lexical edges with evidence-backed, independently
reviewable relationship candidates while retaining heuristics only for
discovery and debugging.

## Dependencies

- ATLAS-HARD-019, ATLAS-HARD-021, and ATLAS-HARD-022.

## Work

- Separate heuristic hints, relationship candidates, governed model
  references, and projection edges.
- Add relationship kind, origin, evidence, rationale, confidence, review
  status, eligibility, and blockers.
- Support `explicit`, `derived`, `heuristic_hint`, and `human_added` origins.
- Prevent heuristic hints from entering publishable projections as truth.
- Require review for derived relationships and incomplete evidence.

## Outputs

`candidate-relationship-hints.json`, `relationship-candidates.json`, findings,
and governed relationship references.

## Acceptance criteria

- [ ] Lexical hints are absent from established publishable relationships.
- [ ] Every candidate carries rationale and source evidence.
- [ ] Explicit and derived origins remain distinguishable.
- [ ] Derived relationships require review by default.
- [ ] Relationship approval is independent of record approval.
- [ ] Missing targets remain findings rather than silent omissions.

## Tests and evidence

Explicit, derived, heuristic-only, unsupported, ambiguous, conflicting,
human-added, stale-target, and replay fixtures.

## Out of scope

Multi-target resolution is completed by ATLAS-HARD-024.
