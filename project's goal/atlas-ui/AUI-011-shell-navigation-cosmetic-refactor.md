# AUI-011: Shell navigation cosmetic refactor

- **State:** awaiting_review
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
8. On compact widths, replace the Atlas wordmark with the hamburger, place the
   project-home control beside it, keep project search centered, and place the
   PRD-lens multi-selector at the far right. This changes only the responsive
   composition, not navigation, search, or lens behavior.
9. On compact widths, retain the PRD-lens icon, count, and chevron in the
   selector; display `1 PRD`, `2 PRDs`, and so on, without the redundant
   `selected` suffix.

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
- At compact mobile width, the header order is hamburger, project home,
  project search, then PRD-lens multi-selector; the Atlas wordmark is not
  shown. Every compact control remains keyboard-accessible and usable.
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

## Visual-validation record

### Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| `AppShell` | Clarify project context and workspace navigation; expose the compact drawer through the shared shell. | Project library and all project workspace destinations. | Persistent desktop rail; off-canvas compact drawer. |
| Shell navigation styles | Establish meaningful group labels, active-link treatment, focus styling, drawer layering, and responsive account treatment. | Every `AppShell` use. | Collapsed desktop rail; full compact drawer. |

### Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Desktop shell: Main Workflow, Project Facts, CES Result, Changes Done | Default and active destination links; current project control; profile menu open. | Dark and Light. | 1280 px desktop. | Project and Workspace labels, project metadata, navigation rows, and anchored profile spacing. | Semantic complementary/navigation labels; `aria-current`; visible focus styling. | Pass — rendered browser checks confirmed the expected H1 and active destination on all four routes. |
| Tablet shell | Persistent navigation, search, PRD lens, active destination links, and profile placement. | Dark. | 800 px tablet. | Persistent workspace rail and readable header controls. | Navigation and search remain available without compact-only controls. | Pass — rendered browser check confirmed the rail, search control, and all workspace links remain visible at tablet width. |
| Compact navigation drawer and header | Closed and open hamburger states; current project; all workspace links; profile region; Escape dismissal; compact header order. | Dark and Light styling reviewed. | 531 px compact mobile. | Hamburger, home, centered search, and PRD lens fit as one accessible header row; drawer keeps readable labels. | Accessible hamburger name and expanded state; drawer close control; focus moved to close; Shift+Tab wraps to the final visible drawer control; dismissal restores focus to the trigger. | Pass — rendered browser check confirmed complete sidebar content, the requested compact header order, visible focus containment, backdrop dimming, and focus restoration. |
| Route and fixture regression | Owner desktop; owner compact; editor and viewer scenarios; all processing states. | Existing test coverage. | Desktop and compact routes. | Not applicable. | Existing role-aware and route rendering coverage retained. | Pass — `pnpm --filter @atlas/app test` passed; it server-rendered `/demo`, each workspace route, editor/viewer, approved-result, and all six processing scenarios. |

### Design-quality check

- **Reference or approved pattern used:** PRD-approved persistent workspace rail with a compact mobile drawer.
- **Visual direction:** Calm, restrained project workspace; compact project context; grouped navigation; one active destination; anchored account control; mobile drawer that preserves context instead of squeezing desktop navigation.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Project context is separated from workspace destinations; active state is distinct without relying only on color; desktop keeps the profile region anchored; compact mode contains the complete sidebar behind a single familiar hamburger trigger.
- **Known limitations or intentional omissions:** Project search remains a presentation-only prototype control, matching the approved reference and without introducing search results or a data contract. Existing route href/query construction, including PRD-lens parameters, remains unchanged and is covered by the rendered-route test suite.

### Regression learning

- **Any visual defect found after an earlier check:** The first compact render retained desktop collapse rules, hiding the project switcher and profile text in the drawer.
- **Previously missed state:** Full compact drawer content after opening from the hamburger trigger.
- **New mandatory state for this component:** Every future shell change must inspect the open compact drawer with project context, workspace links, and profile information all visible.
