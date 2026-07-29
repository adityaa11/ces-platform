# CES-GF-ATLAS-HARD-022 — Reviewable Workflow Assignments

**Stage:** Canonical model and workflow projection refinement
**Status:** Implemented

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

- [x] One record may appear in several workflows without duplication.
- [x] Cross-cutting controls are not forced into one workflow.
- [x] Assignments have independent review status and immutable IDs.
- [x] Assignment contracts reuse the shared governance envelope rather than
      defining divergent evidence or eligibility behavior.
- [x] Each assignment collection has one canonical serialized location and
      proposed-model references are revision-pinned and content-addressed.
- [x] Derived or ambiguous assignments block bulk approval.
- [x] Reassignment preserves canonical record identity.
- [x] Frontend projection requires no assignment heuristics.

## Tests and evidence

Single-, multi-, zero-, and competing-target assignments, cross-cutting
controls, reassignment, low confidence, and deterministic ordering.

## Out of scope

Entity relationships are handled by ATLAS-HARD-023 and ATLAS-HARD-024.

## Implementation evidence

The proposed model now carries independently governed workflow and
cross-cutting assignments with stable IDs and the shared governance envelope.
Backend derivation supports zero, one, or multiple workflow targets without
record duplication, marks non-explicit membership review-required, and
preserves authorization, security, retention, and data-integrity controls as
cross-cutting assignments. Atlas emits canonical
`workflow-assignments.json` and `cross-cutting-assignments.json`.

Verification:

- `corepack pnpm --filter @company/ces-proposed-project-model build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/proposed-project-model/src/index.test.ts packages/approved-project-model/src/hardened.test.ts apps/cli/src/atlas.test.ts`
- 13 focused tests passed.
