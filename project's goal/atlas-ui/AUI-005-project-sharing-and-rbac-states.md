# AUI-005: Project sharing and RBAC states

- **State:** approved
- **Review batch:** BATCH-04
- **Depends on:** AUI-003
- **Baseline:** UI/UX Prototype PRD 3, 4.4, 8, 9.1, 9.4

## Outcome

Make private-project ownership, sharing by email, and Owner/Editor/Viewer permissions easy to understand.

## Scope

- Implement a Share panel with invitation, role selection, collaborator list, access changes, and removal confirmation states.
- Represent owner, editor, viewer, not-shared, and removed-access experiences with fixtures.
- Make protected documents and project content visibly private by default.

## Acceptance criteria

- The owner can simulate inviting an email as Viewer or Editor.
- Owner-only controls are distinguishable from Editor and Viewer experiences.
- The UI clearly communicates that only explicitly invited users can access a project.
- Consequential access changes require a confirmation state.

## Validation

- Exercise fixture scenarios for each role and membership state.
- Check keyboard and mobile interaction with the Share panel.
- See [BATCH-04 visual-validation record](BATCH-04-visual-validation.md).
