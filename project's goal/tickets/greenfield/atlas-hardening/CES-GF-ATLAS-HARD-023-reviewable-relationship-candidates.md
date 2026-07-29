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
- Reuse the governed-edge contract established by ATLAS-HARD-021 for workflow
  transitions, dependencies, ordering edges, branches, joins, loops, and other
  semantic relationships.
- Prevent heuristic hints from entering publishable projections as truth.
- Require review for derived relationships and incomplete evidence.
- Require every source-derived relationship to carry exact source evidence.
- Permit a `human_added` relationship without document evidence only when it
  carries reviewer-authored rationale, trusted reviewer identity, decision
  timestamp, and decision revision.
- Display `human_added` origin explicitly in artifacts and UI; reviewer
  clarification must never masquerade as source-extracted evidence.

## Outputs

`candidate-relationship-hints.json`, `relationship-candidates.json`, findings,
and governed relationship references.

## Acceptance criteria

- [ ] Lexical hints are absent from established publishable relationships.
- [ ] Every source-derived candidate carries rationale and source evidence.
- [ ] A human-added candidate without source evidence carries reviewer-authored
      rationale, trusted reviewer identity, decision timestamp, and decision
      revision.
- [ ] Human-added relationships are visibly attributed and never represented
      as source-extracted evidence.
- [ ] Explicit and derived origins remain distinguishable.
- [ ] Derived relationships require review by default.
- [ ] Workflow topology and other semantic relationships share stable identity,
      provenance, evidence/rationale, origin, confidence, review status,
      eligibility, replay, and stale-decision handling.
- [ ] Relationship approval is independent of record approval.
- [ ] Missing targets remain findings rather than silent omissions.

## Tests and evidence

Explicit, derived, heuristic-only, unsupported, ambiguous, conflicting,
source-backed human-added, reviewer-clarification-only human-added,
misattributed human-added, workflow-edge, stale-target, and replay fixtures.

## Out of scope

Multi-target resolution is completed by ATLAS-HARD-024.
