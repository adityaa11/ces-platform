# CES-GF-ATLAS-UI-004 — Governed Workflow Review and Approval UI

**Stage:** Atlas workflow review UI
**Status:** Planned

## Objective

Provide human review controls for records, assignments, relationships,
ordering, branches, states, and corrections without mutating the proposal or
letting the frontend calculate eligibility.

## Dependencies

- ATLAS-HARD-026 and ATLAS-UI-001 through ATLAS-UI-003.

## Work

- Render backend-owned eligibility and blockers for every review subject.
- Add decision flows for:
  - approve;
  - reject;
  - request correction;
  - reclassify;
  - change assignment;
  - add or remove relationship;
  - split or merge.
- Add a dedicated relationship-review view containing endpoints, kind,
  condition, origin, confidence, evidence, rationale, blockers, and status.
- Require explicit confirmation for derived ordering, branches, state
  transitions, and human-added relationships.
- Keep pending edges dashed/non-authoritative.
- Exclude rejected edges from approved views.
- Submit immutable decisions to the backend and refresh from the materialized
  approved projection.
- Derive reviewer identity from the authenticated server session; never accept
  a client-supplied authoritative `reviewer_id`.
- Scope every read and command to an authorized project and revision.
- Require idempotency keys for decision commands and return conflict responses
  for stale revisions.
- Restrict bulk approval to backend-eligible subjects and audit approval,
  correction, relationship, and source-document access actions.
- Never let client-side state masquerade as an approved model.

## Acceptance criteria

- [ ] Bulk eligibility and blockers are displayed exactly as supplied by the
      backend.
- [ ] The frontend never calculates or widens eligibility.
- [ ] Every decision records a trusted human identity and immutable decision
      input.
- [ ] Reviewer identity is server-authenticated and cannot be overridden by the
      frontend.
- [ ] Every decision is project-authorized, revision-pinned, and idempotent.
- [ ] Stale revisions return a conflict and do not partially materialize.
- [ ] Bulk approval contains only backend-eligible subjects.
- [ ] Approval and protected document-access actions are auditable.
- [ ] Pending and rejected edges never appear authoritative.
- [ ] Approved views are loaded from approved projections after
      materialization.
- [ ] The original proposal remains unchanged.
- [ ] Stale, conflicting, and failed decisions produce clear non-success
      states.
- [ ] Relationship targets remain independently reviewable.

## Out of scope

Final production and cross-domain UI qualification is ATLAS-UI-005.
