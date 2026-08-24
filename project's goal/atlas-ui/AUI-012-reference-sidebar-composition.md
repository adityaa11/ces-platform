# AUI-012: Reference sidebar composition

- **State:** awaiting_review
- **Review batch:** BATCH-11
- **Depends on:** AUI-003, AUI-009, AUI-011
- **Baseline:** [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) 2.1, 2.2, 4.1, 7, 9.4, and 9.4.1; user-supplied annotated project-library sidebar reference (25 August 2026)

## Outcome

Refine the shared Atlas desktop navigation rail to match the approved annotated
reference composition: a compact current-project control, separated destination
groups, an anchored account region, deliberate spacing, and a calm professional
surface system.

## Scope

- Refactor the reusable `AppShell`, project switcher, navigation-group styling,
  and profile-control presentation across every existing Atlas route.
- Preserve the current Atlas destination set, route/query behavior, fixture
  wiring, roles, PRD lens, desktop collapse behavior, and compact drawer.
- Treat the reference-only `Sources`, `Members`, and `Settings` destinations as
  visual reference, not new product destinations or screens.

## Acceptance criteria

- Desktop navigation presents a compact current-project switcher before clearly
  labeled groups and an anchored account control.
- Existing Project Library and Workspace links remain available, visibly grouped,
  keyboard-accessible, and preserve their existing URLs and lens context.
- The changed rail uses shared tokens and remains coherent in light/dark themes,
  desktop, tablet, and compact drawer layouts.

## Validation

- Inspect the project library and each workspace route at desktop, tablet, and
  compact widths in both themes, including active, hover, focus, switcher-open,
  and profile-open states.
- Run application tests and lint before review.

## Validation record

- Rendered desktop project-library inspection confirmed the annotated Project and
  Workspace section labels, icon-and-label rows, compact switcher, anchored
  role-based account control, and the primary action in the content heading.
- Light and dark themes were inspected; compact drawer behavior remains supplied
  by the shared shell.
- `pnpm --filter @atlas/app test` and `pnpm --filter @atlas/app lint` passed.
