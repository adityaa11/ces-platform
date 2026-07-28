# CES-GF-ATLAS-HARD-022 — Reviewable Workflow Assignments

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Represent backend-owned, independently reviewable assignments from canonical
records to workflows and operations, including multi-workflow and
cross-cutting applicability.

## Dependencies

- ATLAS-HARD-019 through ATLAS-HARD-021.

## Work

- Add workflow and cross-cutting assignment contracts.
- Include origin, evidence, rationale, confidence, review status, eligibility,
  and blockers.
- Support zero, one, or multiple workflow and operation targets without
  duplicating records.
- Preserve authentication, authorization, audit, privacy, retention, and
  similar controls as cross-cutting where appropriate.
- Keep assignment membership backend-owned.

## Outputs

`workflow-assignments.json`, `cross-cutting-assignments.json`, findings, and
proposed-model references.

## Acceptance criteria

- [ ] One record may appear in several workflows without duplication.
- [ ] Cross-cutting controls are not forced into one workflow.
- [ ] Assignments have independent review status and immutable IDs.
- [ ] Derived or ambiguous assignments block bulk approval.
- [ ] Reassignment preserves canonical record identity.
- [ ] Frontend projection requires no assignment heuristics.

## Tests and evidence

Single-, multi-, zero-, and competing-target assignments, cross-cutting
controls, reassignment, low confidence, and deterministic ordering.

## Out of scope

Entity relationships are handled by ATLAS-HARD-023 and ATLAS-HARD-024.
