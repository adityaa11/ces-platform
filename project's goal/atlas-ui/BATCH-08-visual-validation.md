# BATCH-08 Visual Validation

## Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| AppShell and workspace navigation | Keep the top bar, responsive navigation, and account control reachable throughout the connected workspace. | Main Workflow, Project Facts, CES Result, Changes Done | Expanded desktop sidebar; compact mobile navigation drawer |
| ProfileMenu and Dialog | Provide the anchored desktop account popover and compact-mobile modal account sheet. | Every project workspace destination | Desktop popover; mobile bottom sheet; Light and Dark themes |

## Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Connected workspace navigation | Main Workflow, Project Facts, CES Result, and Changes Done each rendered with their shared navigation, PRD lens, source evidence, destination links, and approval states. | Light, Dark | Desktop (1280 px); tablet (768 px); compact mobile (573 px) | Workspace eyebrow, page heading, summary, cards, evidence and approval sections remained separated and readable. | Named landmark navigation and destinations remained available. | Pass — rendered inspection confirmed all four connected destinations and their accumulated PRD, evidence, source-accounting, change, CES, and approval content; the tablet CES layout retained its navigation, coverage summary, evidence links, and approval states. |
| Desktop profile/session control | Closed trigger and opened anchored account popover; Light-theme toggle; Escape dismissal. | Dark, Light | Desktop (1280 px) | Name, email, role, theme controls, and account actions stay grouped in the sidebar/menu. | Trigger exposed `aria-expanded`; Escape closed the popover and focus returned to its trigger. | Pass — the control remained in the sticky sidebar's bottom region while workspace content was inspected; the open popover was visible and not clipped. |
| Compact-mobile profile/session control | Opened navigation drawer, then opened the Account menu modal sheet; inspected its close control, role, theme controls, and account actions. | Dark, Light | Compact mobile (573 px) | The account sheet retains a distinct heading and action grouping at the bottom of the compact layout. | Rendered modal exposed `role="dialog"`, `aria-modal`, a labelled heading, and explicit Close dialog control; source-backed dialog test verifies focus entry/containment, Escape, and trigger-focus restoration. | Pass — the mobile navigation trigger revealed the avatar/profile trigger; Account menu rendered as a dimming modal bottom sheet over the underlying workspace, rather than a clipped popover. |

## Design-quality check

- **Reference or approved pattern used:** AUI-009 acceptance criteria; UI/UX Prototype PRD 2.1, 7, 8, and 9.3; AUI-007–AUI-010 reference-system analysis.
- **Visual direction:** Persistent workspace context on wide layouts, with focused drawer and modal-sheet composition on compact screens.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** The page-level top bar remains visible, desktop account controls are isolated from scrollable content at the sidebar bottom, and compact account actions shift into a dedicated modal layer.
- **Known limitations or intentional omissions:** The record is a rendered inspection at representative desktop and compact-mobile sizes; the automated dialog test supplements the observed keyboard behavior.

## Regression learning

- **Any visual defect found after an earlier check:** The checkpoint previously had no committed rendered-state record for the profile flow.
- **Previously missed state:** Compact navigation must be opened before confirming access to the mobile profile trigger and sheet.
- **New mandatory state for this component:** Inspect desktop popover and compact-mobile modal sheet separately in both themes, including open/closed, Escape, focus restoration, clipping, and connected workspace context.
