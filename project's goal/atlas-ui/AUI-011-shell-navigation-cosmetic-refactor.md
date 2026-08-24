# AUI-011: Shell navigation cosmetic refactor

- **State:** planned
- **Review batch:** BATCH-10
- **Depends on:** AUI-003, AUI-009, AUI-010
- **Baseline:** [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) 2.1, 2.2, 4.1, 7, 9.4, 9.4.1; [AUI-003](AUI-003-account-shell-and-ui-primitives.md); [AUI-009](AUI-009-responsive-and-clarity-pass.md)

## Outcome

Refine the shared Atlas application shell so project context, grouped navigation,
search, and account access are calmer, clearer, and visually consistent at every
target width, while preserving all existing route and fixture wiring.

## Annotated intent

The submitted browser annotations establish the following cosmetic direction:

1. Make the project switcher a clear, compact current-project control.
2. Visually group and label the **Project** destination set separately from the
   **Workspace** destination set.
3. Improve the hierarchy and scanability of both navigation groups without
   changing their destinations or labels.
4. Preserve the anchored account/profile control as a distinct, reliable
   bottom-sidebar region.
5. Refine the project-search affordance in the top bar so it reads as an
   intentional, accessible control.
6. Replace the compact-width textual Menu trigger with the annotated hamburger
   icon, retaining an accessible name.
7. On compact widths, open the shared sidebar as the navigation drawer from
   that hamburger trigger, rather than providing a separate or incomplete menu.

## Scope

- Refactor only the shared shell presentation and its responsive composition:
  sidebar, current-project switcher presentation, group labels and destination
  links, account control treatment, top-bar search treatment, compact menu
  trigger, drawer/backdrop, and their visual states.
- Reuse the existing `AppShell` navigation data, href construction, project
  switcher behavior, profile behavior, fixtures, and shared primitives.
- Retain existing destination text, route parameters, project selection,
  lens state, account actions, role visibility, and desktop/mobile information
  availability.
- Add only interaction behavior necessary for the visual composition: open and
  close drawer state, keyboard/Escape/backdrop dismissal, focus handling, and
  visible focus states.

## Explicit exclusions

- No route, data-contract, fixture, permission, search-result, project-switcher
  selection, PRD-lens, profile-menu, or account-action behavior change.
- No new product destination, navigation item, search capability, or visual
  redesign of library/workspace content.
- No changes to project-card, upload, processing, sharing, workflow, facts,
  CES, or changes-domain presentation except where the shared shell wraps them.

## Acceptance criteria

- At desktop width, the sidebar shows one compact current-project switcher;
  visibly distinct **Project** and **Workspace** groups; all existing destination
  labels; and the signed-in profile control anchored below the scrollable
  navigation content.
- Project and Workspace navigation links preserve their existing URLs, query
  parameters, active-state semantics, and role-aware availability.
- The current-project control retains its existing ready-project selection and
  unavailable-project behavior, with its open, closed, hover, keyboard-focus,
  and current-project states visually coherent.
- The top-bar project-search input remains available and retains its current
  behavior; its label, contrast, focus state, and sizing make it clearly
  usable rather than decorative.
- At compact mobile width, the header exposes an icon-only hamburger button
  with an accessible name, `aria-expanded`, and an explicit relationship to the
  navigation drawer. It replaces the existing visible textual Menu trigger.
- Activating the hamburger opens the same complete sidebar content: project
  switcher, Project group, Workspace group, and profile control. Closing via
  the button, explicit close control, Escape, or backdrop restores focus to the
  hamburger trigger and does not alter the current route or scroll context.
- The mobile drawer blocks interaction with the underlying page, avoids
  clipping or z-index overlap, and keeps each navigation target reachable with
  keyboard and touch input.
- Desktop, tablet, and mobile renderings retain a restrained workspace visual
  language: purposeful surface separation, readable type, consistent spacing,
  no decorative gradients, no extra card framing, and no color-only state cues.

## Validation

- Capture and inspect the shared shell on the project library plus Main
  Workflow, Project Facts, CES Result, and Changes Done routes at desktop,
  tablet, and compact mobile widths.
- Exercise desktop project-switcher open/closed/current/unavailable states,
  navigation active states, and profile control placement.
- Exercise compact drawer closed/open states, every dismissal path, keyboard
  focus containment/restoration, top-bar search focus, and each destination
  link.
- Compare the resulting hrefs and query parameters with the pre-refactor
  behavior, including project ID, view, and PRD-lens context where present.
- Run the existing application checks and record actual rendered inspection in
  the AUI validation-record format before setting this ticket to
  `awaiting_review`.

## Review batch: BATCH-10

- **Tickets:** AUI-011 only
- **Review question:** Does the shared shell now provide clearer project and
  workspace navigation across desktop and mobile, without any route or fixture
  behavior regression?
- **Combined acceptance criteria:** All criteria in this ticket, with special
  attention to equivalent navigation availability, accessible compact drawer
  behavior, and stable route/lens context.
- **Commit range:** The single implementation checkpoint for AUI-011.
