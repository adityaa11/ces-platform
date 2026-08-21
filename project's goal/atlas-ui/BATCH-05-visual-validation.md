# BATCH-05: Main Workflow visual-validation record

- **Checkpoint:** BATCH-05 implementation
- **Ticket:** AUI-006
- **Date:** 21 August 2026

## Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| `WorkflowWorkspace` | Complete the source-grounded Main Workflow navigation model | `/demo?projectId=safara&view=workflow`; journey overview, semantic pages, PRD lens, evidence | All PRDs, selected contextual lens, isolated lens, focused page, node selected |
| `AppShell` project navigation | Retain selected fixture project identity in the available workflow destination | Selected ready workspace | No selection, selected ready project |
| Fixture PRD metadata | Supply source-history dates through the fixture boundary | Focused semantic pages | Three representative PRD increments |

## Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Workflow overview | All PRDs counts, ordered 01–05 journey, separate support, project-preserving Main Workflow navigation | Dark | Desktop, 390 × 844 | Context label, operational question, model-count, stage and support spacing | Ordered-workflows region and project navigation link inspected | Pass — all model counts, five ordered stages, and separate support rendered |
| PRD lens | Closed/open; PRD 2 selected; contextual and isolated modes; impact statement | Dark | Desktop | Popover header, item metadata, impact copy, and action placement | Trigger exposes state; selectable PRD controls and checkbox label inspected | Pass — selected lens reports affected pages; isolation retains relevant stages |
| Focused semantic page | Open stage; grouped page picker; affected previous/next controls; breadcrumb; source dates; select a node; paired evidence and close state | Dark | Desktop | Breadcrumb, heading, role/result, source-history, node sequence, and provenance rhythm | Semantic navigation, evidence buttons, and labelled affected-page controls inspected | Pass — selected PRD state survives page entry and evidence shows Atlas reading plus exact wording |
| Narrow workflow | Overview at 390 × 844 | Dark | Mobile | Ordered stage cards stack without losing hierarchy or controls | Main Workflow remains available in the narrow shell | Pass — title and ordered-workflow region remain usable at mobile width |

## Design-quality check

- **Reference or approved pattern used:** The AUI-006 reference model: accumulated overview → grouped semantic page → direct provenance reading.
- **Visual direction:** Project and source context precede the operational story; focused verification follows without an all-project graph.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Journey stages explain order and business results before detail; breadcrumb, pager, source history, and evidence provide progressively deeper context.
- **Known limitations or intentional omissions:** Project Facts, Changes Done, and CES Result remain separate planned tickets and are intentionally not exposed as active destinations in this batch.

## Regression learning

- **Any visual defect found after an earlier check:** The shell previously exposed project labels whose routes did not preserve the selected project; the workflow link now retains `projectId`.
- **Previously missed state:** Contextual lens navigation needed explicit affected-page previous/next controls rather than only an affected-page count.
- **New mandatory state for this component:** Validate isolated source filtering from overview through focused page and node evidence, including the empty-state explanation when a selected source does not contribute.
