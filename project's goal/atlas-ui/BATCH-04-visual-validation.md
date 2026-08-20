# BATCH-04: Visual-Validation Record

- **Checkpoint:** Remediation for review of `7b63857`
- **Tickets:** AUI-004, AUI-005
- **Date:** 21 August 2026

## Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| `ProjectLibrary` | Project creation, processing feedback, and private project sharing | `/demo`; owner, editor, and viewer fixture scenarios | Owner exposes New project and Share; Editor exposes New project only; Viewer is read-only |
| `Dialog` | Reused for creation, sharing, and consequential access confirmation | Create project, Share project, confirm role/remove access | Modal focus trap, Escape close, focus restoration |
| Theme tokens and workspace primitives | Light/Dark appearance and responsive card/dialog behavior | Project library, profile menu, project cards, dialogs | Semantic Light and Dark tokens |

## Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Project library | Populated owned and shared cards; owner-only Share entry; processing notice after named create | Light, Dark | Desktop | Workspace eyebrow/title/supporting-copy rhythm; card metadata and action spacing | Share is a native button; status notification is live | Pass — rendered browser inspection; create dialog and processing notice exercised |
| Create project | Open, name entry, submit, processing transition | Dark | Desktop | Label/input/action spacing | Focus-trapped dialog and Escape behavior covered by dialog test | Pass — created “Access review project” and observed processing notice |
| Share panel | Open/close, invite `alex@example.com`, Viewer/Editor selection, active and invited collaborators | Light, Dark | Desktop, tablet, mobile | Invitation fields, collaborator rows, metadata, and action spacing | Focus-trapped dialog; Escape dismissed the panel | Pass — rendered browser inspection in both themes and viewport overrides |
| Consequential access | Remove action, confirmation dialog, confirm, removed-access row | Light | Desktop, mobile | Confirmation-copy and action spacing | Confirmation requires explicit button activation | Pass — observed “Access removed” after confirmation |
| Role fixtures | Owner, Editor, Viewer permissions | Dark | Desktop | Project-card hierarchy and ownership cues | Owner: Share/New project; Editor: New project only; Viewer: neither | Pass — `/demo?scenario=editor-ready` and `/demo?scenario=viewer-ready` rendered and inspected |

## Design-quality check

- **Reference or approved pattern used:** Collaborative-workspace sidebar and a compact, permission-focused sharing dialog.
- **Visual direction:** Calm workspace hierarchy, restrained surface elevation, one primary invitation action, and clear access-state rows that remain legible across themes.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Project actions are separate from library navigation; sharing remains in a focused dialog; access changes are separated from invitation and require confirmation.
- **Known limitations or intentional omissions:** PDF selection and processing are fixture simulations. No real email, storage, or permissions service is invoked.

## Regression learning

- **Any visual defect found after an earlier check:** Light active navigation text previously inherited a dark text value.
- **Previously missed state:** Closed profile menu in Light mode.
- **New mandatory state for this component:** Validate the visible selected navigation state with every overlay closed in both themes.
