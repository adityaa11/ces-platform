# BATCH-06 Visual Validation

## Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| `AppShell` | Add the project destinations while preserving the project/lens URL context. | Workflow, Project Facts, Changes Done | Active destination; ready-project routing |
| `WorkspaceLens` | Keep a single URL-backed PRD selection and contextual/isolation mode across destinations. | Workflow, Facts, Changes | All PRDs, selected contextual, selected isolation |
| `ProjectKnowledge` | Present grouped facts, increment timeline, provenance, destinations, and source accounting. | Facts and Changes | Closed/open facts; multiple independent open facts; source accounting; selected and isolated lenses |

## Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Project Facts | Closed facts; two facts expanded independently; evidence disclosure; PRD lens; source accounting | Dark, Light | Desktop; mobile (587 px) | Heading, generic description, count card, group-card rhythm, provenance split | Native buttons with `aria-expanded`; evidence uses native `details`; accounting opens the shared focus-managed dialog | Pass — mobile browser inspection confirmed Scope and People and responsibilities remain open together; source accounting focused the dialog. |
| Changes Done | Grouped PRD increments; kinds; source disclosure; typed destinations; header/count placement; mobile menu | Dark | Desktop; mobile (587 px) | One-line title, description before count, timeline density | Native links and disclosure controls; Menu exposes `aria-expanded` and opens project navigation | Pass — mobile browser inspection confirmed Menu reveals Main Workflow, Project Facts, and Changes Done navigation. |
| Main Workflow regression | Project-specific title with generic description | Dark | Desktop | Title/description/count ordering | Existing workflow navigation retained | Pass — reviewed through browser annotation. |

## Design-quality check

- **Reference or approved pattern used:** AUI-007–AUI-010 reference-system analysis; Main Workflow heading hierarchy.
- **Visual direction:** Left-aligned question and generic intent, compact supporting count below the description, grouped reading units, and full-width focused fact detail.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Facts and changes retain project context via the shared lens; expanded facts span the grid to avoid a misleading empty peer column; change increments remain compact and scannable.
- **Known limitations or intentional omissions:** Narrow-screen inspection is completed for Facts and Changes; headings, cards, disclosures, dialog, and project navigation retain their functional order at 587 px.

## Regression learning

- **Any visual defect found after an earlier check:** Header grid placed title/description/count into disconnected cells; opening a fact left an empty adjacent column; fact expansion was single-open only.
- **Previously missed state:** Multiple facts open concurrently and the desktop count-card reading order.
- **New mandatory state for this component:** Verify one-line desktop titles, description-before-count placement, expanded-card grid span, independent fact disclosure, and the mobile navigation toggle before review.
