# CES-GF-ATLAS-UI-004 — Governed Model Review and Approval UI

**Stage:** Atlas model review UI
**Status:** In progress — governed production route and React relationship controls implemented; corrected-proposal flows remain

## Objective

Provide human review controls for records, assignments, relationships,
ordering, branches, states, and corrections without mutating the proposal or
letting the frontend calculate eligibility.

## Dependencies

- ATLAS-HARD-026 and ATLAS-UI-000 through ATLAS-UI-003.

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
- Apply CSRF protection to every cookie-authenticated mutation route.
- Require idempotency keys for decision commands and return conflict responses
  for stale revisions.
- Restrict bulk approval to backend-eligible subjects and audit approval,
  correction, relationship, and source-document access actions.
- Never let client-side state masquerade as an approved model.
- Restrict evidence, command, and post-materialization navigation URLs to
  relative or explicitly allowlisted destinations.

## Prototype-validated behavior

- [x] Bulk eligibility and blockers are displayed exactly as supplied by the
      backend.
- [x] The frontend never calculates or widens eligibility.
- [x] Every decision records a trusted human identity and immutable decision
      input.
- [x] Reviewer identity is server-authenticated and cannot be overridden by the
      frontend.
- [x] Every decision is project-authorized, revision-pinned, and idempotent.
- [x] Stale revisions return a conflict and do not partially materialize.
- [x] Bulk approval contains only backend-eligible subjects.
- [x] Approval and protected document-access actions are auditable.
- [x] Pending and rejected edges never appear authoritative.
- [x] Approved views are loaded from approved projections after
      materialization.
- [x] The original proposal remains unchanged.
- [x] Stale, conflicting, and failed decisions produce clear non-success
      states.
- [x] Relationship targets remain independently reviewable.

## Production acceptance

- [x] Decision controls run through authenticated, project-scoped Next.js Route
      Handlers connected to the immutable Atlas review and approved-model
      materialization packages.
- [x] Successful materialization refreshes the synchronized integrated and
      focused React Flow projections without client-authored semantic changes.
- [ ] CSRF, unsafe redirect/command URLs, active document content, and forged
      reviewer fields fail closed and produce audited non-success responses.

## Out of scope

Final production and cross-domain UI qualification is ATLAS-UI-005.

## Implementation evidence

- `/api/atlas/decisions` now authenticates a server session, applies
  constant-time CSRF validation, enforces a server-configured project
  allowlist, and derives reviewer identity/display name only from server
  configuration. The shared command schema rejects forged or extra fields.
- The route revision-checks the immutable proposal and backend eligibility,
  resolves subject entity types on the server, and uses the real Atlas review,
  focused-projection, approved-model, and publication packages. Approve/reject
  commands produce an immutable ledger, an approved shared workspace, an audit
  receipt, and a relative materialized-workspace path.
- Idempotency receipts are server-owned. Stale revisions return 409; unsupported
  correction shapes fail closed until a complete corrected proposal payload is
  available instead of being synthesized by the UI.

- The Approval tab requests exact backend eligibility and blockers for each
  governed relationship. Approve remains disabled when the backend marks a
  subject ineligible; the client never widens eligibility.
- React approval/rejection requires explicit confirmation and a note, submits
  the revision-pinned UI-000 command with same-origin credentials and CSRF,
  distinguishes stale/failed outcomes, and accepts only a safe relative
  materialized-workspace path from the server receipt.

- Review subjects carry backend eligibility, bulk eligibility, blockers,
  allowed actions, confirmation requirements, and command URLs unchanged.
- Relationship review displays endpoints, kind, condition, origin, confidence,
  rationale, blockers, and status per independently addressable target.
- Decision commands include authenticated same-origin credentials, project
  scope, proposal revision, and idempotency key. Their body cannot supply a
  reviewer identity; the server receipt must attest a human reviewer and audit
  event.
- Sensitive topology decisions require confirmation. HTTP 409 is a visible
  stale conflict, and successful decisions navigate only to the backend's
  materialized workspace URL.
- Fifteen UI tests pass and application typecheck passes.
