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

- Add workflow and cross-cutting assignment contracts that reuse the shared
  governance envelope established by ATLAS-HARD-021: stable association ID,
  origin, evidence, rationale, confidence, review status, bulk-approval
  eligibility, blockers, and proposal revision.
- Support zero, one, or multiple workflow and operation targets without
  duplicating records.
- Preserve authentication, authorization, audit, privacy, retention, and
  similar controls as cross-cutting where appropriate.
- Keep assignment membership backend-owned.

## Outputs

Canonical `workflow-assignments.json` and
`cross-cutting-assignments.json` bundle components, findings, and
content-addressed proposed-model manifest references. Duplicated embedded
collections are prohibited.

## Acceptance criteria

- [ ] One record may appear in several workflows without duplication.
- [ ] Cross-cutting controls are not forced into one workflow.
- [ ] Assignments have independent review status and immutable IDs.
- [ ] Assignment contracts reuse the shared governance envelope rather than
      defining divergent evidence or eligibility behavior.
- [ ] Each assignment collection has one canonical serialized location and
      proposed-model references are revision-pinned and content-addressed.
- [ ] Derived or ambiguous assignments block bulk approval.
- [ ] Reassignment preserves canonical record identity.
- [ ] Frontend projection requires no assignment heuristics.

## Tests and evidence

Single-, multi-, zero-, and competing-target assignments, cross-cutting
controls, reassignment, low confidence, and deterministic ordering.

## Out of scope

Entity relationships are handled by ATLAS-HARD-023 and ATLAS-HARD-024.
