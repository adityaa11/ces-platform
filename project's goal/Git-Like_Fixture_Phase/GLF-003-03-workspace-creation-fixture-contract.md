# GLF-003-03: Workspace-creation fixture contract

- **State:** awaiting_review
- **Review batch:** BATCH-19.3
- **Depends on:** GLF-003-02 approved, GLF-004-01
- **Baseline:** Architecture Checkpoint sections 5, 10, 12, 17, 22.1-22.6, 24; UI/UX Prototype PRD sections 3, 4.3, 9.1, 9.2, 9.5; Fixture Data-Intent Contract; GLF-003; GLF-003-02; GLF-005-02

## Outcome

Extend the fixture boundary with a transient, fixture-owned workspace-creation
contract. A request records its generated workspace identity, selected base
workspace, private base-HEAD snapshot, and PRD-file metadata; it produces an
Extracting workspace record without changing the immutable Safara golden bundle
or representing extraction output as accepted truth.

## Scope

- Define a UI-facing workspace-creation request and generated-workspace result
  contract in `@atlas/fixtures`.
- Require stable project identity, workspace name, generated workspace ID,
  selected base-workspace ID, internally captured base-HEAD revision ID, and
  one or more PDF metadata entries.
- Define the generated ID format as `<three-character-project-prefix>-<12
  lowercase-base32 UUID-derived token>` and provide deterministic collision
  handling for fixture tests.
- Resolve the selected base workspace by stable ID and validate that its
  ancestry is Master-rooted before accepting a request.
- Produce exactly one fixture-owned Extracting workspace record and one
  extraction/reconciliation request sharing the generated stable ID. The
  record must be unavailable for selection/opening until a fixture-owned
  Ready-for-review state is supplied.

## Out of scope

- Altering the immutable Safara golden bundle, its accepted assertions,
  revisions, materialized current state, or projections.
- Real file storage, PDF parsing, extraction, reconciliation, provider calls,
  publishing, or changing a branch HEAD as a consequence of a request.
- Modal layout or interaction; GLF-005-02 owns that UI.

## Acceptance criteria

- The contract rejects missing PDFs, non-PDF metadata, unknown project/base
  workspace IDs, malformed generated IDs, duplicate IDs, and a base lineage
  that cannot resolve to Master.
- The generated request and resulting Extracting workspace share exactly one
  stable workspace ID, selected base-workspace ID, and captured base-HEAD ID.
- A generated Extracting workspace is visible to the switcher adapter but is
  explicitly unavailable for selection/opening, with a fixture-owned reason.
- The generated record and request are transient fixture state; the Safara
  golden bundle remains byte-for-byte and relationship-wise unchanged.
- The contract exposes no user-editable base HEAD, status, audit, or execution
  result fields.

## Validation

- Test Master and incremental workspaces as bases, including verified
  Master-rooted lineage and base-HEAD capture.
- Test ID format, deterministic collision retry, invalid PDF and missing-PDF
  failures, stable-ID equality, unavailable Extracting access, and a supplied
  Ready-for-review availability transition.
- Run fixture topology/provenance regression tests to prove the generated
  Safara golden bundle is unchanged.

## Decision log

- 11 September 2026: The previously approved GLF-003 contract is frozen. This
  extension is a separate checkpoint because workspace creation introduces new
  fixture relationships not owned by the accepted Safara golden bundle.

## Validation record

- `pnpm --filter @atlas/fixtures test` — PASS (23 tests).
- Contract coverage exercises Master and incremental bases, captured base HEAD,
  collision retry, missing/non-PDF rejection, stable-ID equality, and the
  unavailable Extracting lifecycle state.
- Regeneration completed during the fixture suite with no diff to the Safara
  golden bundle or reconciliation output.
