# GLF-005-02: New workspace modal and fixture handoff

- **State:** approved
- **Review batch:** BATCH-21.2
- **Depends on:** GLF-005-01, GLF-003-03
- **Baseline:** Architecture Checkpoint sections 5, 10, 12, 17, 22.1-22.6, 24; UI/UX Prototype PRD sections 5-6, 9.1, 9.4; Fixture Data-Intent Contract; GLF-003; GLF-003-03; GLF-005; GLF-005-01

## Outcome

Build the accessible New workspace modal and create one fixture-owned
extraction/reconciliation request from a named workspace, an existing selected
base workspace, and at least one uploaded PRD PDF. The user does not manage
revision internals; Atlas generates identity and snapshots the base HEAD.

## Scope

- Open the modal from the workspace switcher's New workspace action with
  accessible focus, dismissal, loading, validation, error, and success states.
- Collect a required Workspace name, a required Base workspace selector, and
  one or more required PRD PDFs. The base selector may use any existing
  workspace; each workspace is ultimately rooted in Master.
- Generate the stable workspace ID internally as
  `<three-character-project-prefix>-<12-character-lowercase-base32-token>`.
  The token is UUID-derived and compact; users neither enter nor edit it.
- Capture the selected base workspace's current HEAD internally for the
  fixture-owned request. Do not expose the base HEAD as a form field or require
  users to understand revision identifiers.
- Call the GLF-003-03 fixture contract to create the Extracting workspace
  record and extraction/reconciliation request using the generated stable
  workspace ID, selected base workspace, internally captured base HEAD, and
  uploaded-PDF metadata.
- After success, show the new workspace in the switcher with Extracting status.
  It remains unavailable for selection/opening until its fixture-owned status
  becomes Ready for review.

## Out of scope

- A user-entered workspace ID, Base HEAD field, purpose/change-summary field,
  user-edited status/audit metadata, or workspace creation without PRD PDFs.
- Production upload storage, live extraction, reconciliation execution,
  arbitrary user-upload processing, publishing, or provider integrations.
- Migrating downstream knowledge surfaces to selected-HEAD reads; GLF-006 owns
  that work.

## Acceptance criteria

- The modal presents only Workspace name, Base workspace, and PRD PDFs as
  user-entered fields, with required markers, accessible labels, visible
  validation, and keyboard-operable controls.
- At least one PDF is required; missing-file and non-PDF failures are visible
  and announced without clearing valid input.
- Workspace ID is generated once from the current project prefix plus a compact
  12-character lowercase base32 UUID-derived token, is collision-checked in
  the fixture store, and is never inferred from the display name.
- A valid submit creates exactly one Extracting workspace record and one
  fixture-owned extraction/reconciliation request with the same stable ID and
  captured base-workspace/base-HEAD relationship.
- Success announces the created workspace and its extraction-in-progress
  status. The new row is visible in the switcher; activation explains that it
  cannot be opened until Ready for review.
- The modal's actions, loading, error, success, focus, dismissal, responsive,
  and theme states comply with the frontend review gate.

## Validation

- Exercise empty, invalid-file, duplicate generated-ID retry, loading, error,
  and successful submission paths; verify the generated ID and base snapshot
  relationship across the fixture request and workspace record.
- Verify all existing-workspace base choices, including Master and an
  incremental workspace, preserve an auditable Master-rooted lineage.
- Verify the created Extracting workspace is visible but unavailable, then use
  a Ready-for-review fixture state to verify permitted selection/opening.
- Render and inspect desktop, narrow, and mobile modal/switcher states in
  supported themes; record visual validation and apply the frontend review gate
  before review.

## Decision log

- 12 September 2026: BATCH-21.2 is approved after the final PASS review of
  remediation commit `10f7a92`; GLF-005 closes this ticket set.
- 11 September 2026: Users may choose any existing workspace as the base; the
  workspace model must retain its Master-rooted lineage.
- 11 September 2026: At least one PDF is required because a new workspace
  exists to extract and reconcile PRD material against its selected base.
- 11 September 2026: On successful handoff, the new workspace appears in the
  switcher as Extracting. It cannot be selected or opened until it is Ready for
  review.

## Validation record

See [GLF-005-02 validation](GLF-005-02-validation.md).
