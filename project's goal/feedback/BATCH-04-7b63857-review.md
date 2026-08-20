# Review: BATCH-04 - Project library, processing, and sharing

- Reviewed commit range: `8e77123..7b63857`
- Baseline: AUI-004 and AUI-005; UI/UX Prototype PRD 3, 4.2-4.4, 8, 9.1, and 9.4
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/components/ProjectLibrary.tsx` and `apps/atlas/components/AppShell.tsx` | AUI-005 requires a Share panel with invitation, Viewer/Editor selection, collaborator list, access changes, removal confirmation, and Owner/Editor/Viewer states; PRD 4.4 and 9.1 require the sharing flow | Accepted | Implement and expose the complete fixture-driven sharing flow, including owner invite, role selection, collaborator review, permission change, removed-access state, and confirmation for consequential access changes. Ensure the project library provides a clear entry point to Share. |
| F-002 | Important | `project's goal/atlas-ui/` | README and Review Protocol require a visual-validation record before a UI ticket reaches review; the record must identify rendered routes, states, themes, breakpoints, text rhythm, and accessibility checks | Accepted | Add the completed AUI ticket validation record for the affected BATCH-04 surfaces, documenting actual rendered inspection of the project library, create/upload dialog, processing notice, and sharing states across required themes, widths, and interactions. |

## Decision

The project-library implementation provides a partial owner flow for naming a project, selecting PDFs, and showing simulated processing. However, the combined BATCH-04 review question cannot pass while the required sharing/RBAC experience is absent. The checkpoint also lacks the newly mandatory rendered visual-validation evidence. `pnpm test` and `pnpm lint` pass, but those checks do not satisfy the missing product flow or visual-validation gate.
