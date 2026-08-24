# AUI-013: Unselected project navigation state

- **State:** awaiting_review
- **Review batch:** BATCH-12
- **Depends on:** AUI-012
- **Baseline:** [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) 2.1, 4.1, 7, 9.1, and 9.4; user-approved project-selection behavior (25 August 2026)

## Outcome

Show an explicit **No project selected** shell state after login. Until a ready
project is selected through the project switcher or a project card, the four
project-content destinations are visibly disabled and have no route target.

## Acceptance criteria

- The project library initially shows **No project selected** in the switcher.
- Main Workflow, Project Facts, CES Result, and Changes Done are visibly
  disabled and non-navigable without a selected ready project.
- Selecting a ready project from either existing control restores all four
  destinations with their existing URLs and query/lens behavior.

## Validation

- Inspect default, selected, compact drawer, and keyboard states.
- Run application tests and lint before review.

## Validation record

- Desktop inspection confirmed the unselected switcher copy and four visibly
  disabled project-content rows; selecting `projectId=safara` restored all four
  links and the current-project label.
- `pnpm --filter @atlas/app test` and `pnpm --filter @atlas/app lint` passed.
