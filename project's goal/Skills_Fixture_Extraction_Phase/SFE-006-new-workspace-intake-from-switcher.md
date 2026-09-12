# SFE-006: Create a new workspace from the project 02 switcher

- **State:** planned
- **Review batch:** BATCH-31
- **Depends on:** SFE-000 approved; SFE-005 approved; GLF-003-03 approved; GLF-005-02 approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 5–6, 9.1, 9.4; [GLF-003-03](../Git-Like_Fixture_Phase/GLF-003-03-workspace-creation-fixture-contract.md); [GLF-005-02](../Git-Like_Fixture_Phase/GLF-005-02-new-workspace-modal-and-fixture-handoff.md); [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md)
- **SFE-000 map entries:** SFE-M1 upload capture only; SFE-M5 request/workspace ID, file path, hash, and base-HEAD checks

## Outcome

Use the + New workspace action in project 02's workspace switcher to create a fixture-owned extraction request from the user's submitted workspace details, selected base, and PDF 02. The new workspace begins in Extracting and receives its own source directory.

## Scope

- Open the existing New workspace modal from the project 02 workspace switcher. Preserve every submitted field, selected base workspace, and PDF metadata in the fixture request.
- Use Master as the selected base in the target scenario. Capture its current HEAD internally; do not expose or let the user edit the revision ID.
- Generate a stable workspace ID using the approved compact format and bind the request, workspace record, processing job, and file path to that ID.
- Create `docs/PRD/project-safara-02/<new-workspace-id>/` and copy PDF 02 there using its original safe filename and verified content hash.
- Add the new workspace as Extracting in the project 02 selector. Keep the Published project card/Master status distinct from the new workspace's processing status.

## Out of scope

- Running PDF 02 extraction or changing the accepted Master; SFE-007 owns extraction and reconciliation.
- Creating another project card or changing the project 02 identity.
- Production storage, live providers, or user-editable base HEAD/workspace IDs.

## Acceptance criteria

- The modal is opened from + New workspace and the created request includes the selected project 02 ID, entered workspace fields, Master base ID/HEAD, and PDF 02 metadata.
- The new workspace ID is collision-checked, follows the approved format, and matches across workspace, request, job, route, and source path.
- PDF 02 is stored at `docs/PRD/project-safara-02/<new-workspace-id>/<uploaded-filename.pdf>`; its hash matches the uploaded bytes and no file is written to another workspace directory.
- The switcher shows Master, historical Initial Draft, and the new Extracting workspace. The new workspace is visible but unavailable for opening until its fixture-owned state becomes Ready for review.
- Project 02's published Master/card remains Published while the new workspace is independently Extracting; project 01 remains unchanged.
- Missing/non-PDF files, invalid base IDs, duplicate generated IDs, and failed file writes leave no partial workspace or mismatched file record.

## Validation

- Exercise the modal from the switcher with Master selected; verify form state, generated ID, captured Master HEAD, new switcher row, and workspace-scoped file hash.
- Test missing and invalid PDF, invalid/unknown base, generated-ID collision, submit failure, and unavailable Extracting selection.
- Verify project 02 still resolves its Published Master and Initial Draft, and project 01 state is unchanged.
- Inspect the connected selector/modal states at desktop and narrow widths, supported themes, and keyboard/focus paths.
