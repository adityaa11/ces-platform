# AUI-004: Project library, upload, and processing experience

- **State:** awaiting_review
- **Review batch:** BATCH-04
- **Depends on:** AUI-003
- **Baseline:** UI/UX Prototype PRD 4.2-4.3, 9.1, 9.4

## Outcome

Let a user find projects, create a named project, select PRD PDFs, and understand simulated processing without leaving the project library confused.

## Scope

- Implement empty and populated Figma/Google Drive-style project libraries.
- Implement New project, project naming, PDF selection/drag state, and upload-validation states.
- Implement project-card/row metadata and state.
- Implement the persistent lower-left processing notification with all required stages.

## Acceptance criteria

- Owned and shared projects are distinguishable.
- A project remains visible while processing continues.
- Processing stages, success, failure, and needs-attention states are unambiguous.
- The UI makes clear that upload and extraction are simulated fixture states.

## Validation

- Exercise empty, populated, successful, failed, and needs-attention scenarios.
- Check the notification and upload flow at desktop and mobile widths.
- See [BATCH-04 visual-validation record](BATCH-04-visual-validation.md).
