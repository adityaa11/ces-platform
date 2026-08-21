# BATCH-07 Visual Validation

## Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| CES Result | Render fixture-derived policy coverage, provenance, destinations, and approvals. | CES Result | All PRDs; selected PRD; owner approval states |
| AppShell navigation | Add the fourth workspace destination. | Workflow, Facts, CES Result, Changes Done | Active CES destination; mobile menu |

## Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| CES Result | All four coverage cards; evidence disclosure; workflow/fact/unresolved destinations; independent Atlas and CES approval gates | Dark, Light | Desktop (1280 px); mobile (573 px) | Heading, count, summary, policy-card and approval-gate hierarchy | Native disclosures; labelled links; confirmed Dialog focus entry | Pass — rendered inspection showed 1 each of covered, needs review, out-of-scope, and unresolved in both themes; each owner approval action opened its matching confirmation dialog. |
| Selected and isolate PRD CES lens | PRD 2 selection; isolate mode; derived one-item count; preserved destination lens; lens popover heading and explicit close control | Dark, Light | Desktop (1280 px); mobile (573 px) | Lens label, popover controls, and filtered summary remain legible | Lens trigger reports selected state; labelled `Close PRD lens` control dismisses the popover; fact navigation retained `projectId`, `prd`, and `lens=isolate` | Pass — rendered inspection showed CES-ACC-01 only, isolate filtering, the close control, and the linked Project Facts destination in both themes. |
| Role and approved fixtures | Owner actions, editor/viewer read-only treatment, and approved-result state | Dark, Light | Desktop (1280 px) | Approval copy and action placement | Non-owner action is not rendered; approved fixture supplies both approved states | Pass — editor and viewer rendered no approval actions in both themes; approved-result rendered both approved states in both themes. |

## Design-quality check

- **Reference or approved pattern used:** AUI-007–AUI-010 reference-system analysis; shared workspace heading and source-evidence pattern.
- **Visual direction:** policy coverage is summarized before cards; each card separates policy rule, interpretation, capability need, and any decision.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** coverage, source evidence, destinations, and two deliberate approval decisions remain distinct rather than implying a prescribed solution.
- **Known limitations or intentional omissions:** The planned mobile profile bottom-sheet work belongs to AUI-009 and is not part of this checkpoint.

## Regression learning

- **Any visual defect found after an earlier check:** the first CES route lacked component styling and full coverage states.
- **Previously missed state:** a selected PRD must recompute both policy cards and summary counts.
- **New mandatory state for this component:** verify all coverage states, each approval gate, cross-link context, and selected-PRD counts before review.
