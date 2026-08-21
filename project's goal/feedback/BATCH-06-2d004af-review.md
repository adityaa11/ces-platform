# Review: BATCH-06 - Project Facts and Changes Done

- Reviewed commit: `2d004af`
- Baseline: AUI-007; UI/UX Prototype PRD 5.2, 5.4, 6, 9.1, and 9.3; AUI-007–AUI-010 reference-system analysis
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `apps/atlas/tests/rendered-html.test.mjs` | A committed checkpoint must pass relevant validation | Accepted | Update the default demo-shell assertion to match the shared project-destination shell, then run `pnpm test` successfully with Facts/Changes route coverage included. |
| F-002 | Blocker | `apps/atlas/components/ProjectKnowledge.tsx`: `DestinationLink` | Fixture Data-Intent Contract and AUI-007 require relationship-derived navigation that preserves the same `projectId` and shared PRD lens across cross-links | Accepted | Construct destination URLs from the selected workspace project ID and current lens state on both server and client; verify workflow, fact, and CES destinations resolve to the intended project and retain `prd`/`lens` parameters. |
| F-003 | Important | `apps/atlas/components/ProjectKnowledge.tsx`: `Accounting` | Shared workspace validation requires accessible modal interaction; the established Dialog contract includes focus entry, Tab containment, Escape close, and focus restoration | Accepted | Reuse the accessible Dialog behavior or add equivalent focus entry/trap, Escape dismissal, and focus restoration to the source-accounting modal, with focused validation. |
| F-004 | Important | `project's goal/atlas-ui/BATCH-06-visual-validation.md` | AUI-007 validation requires expanded facts and increment timelines at desktop and mobile widths | Accepted | Add actual mobile inspection of Project Facts and Changes Done, including expanded fact rows, timelines, lens states, accounting modal, and cross-links; record the outcomes in the validation record. |

## Decision

The fixture graph, grouped Facts/Changes surfaces, lens controls, evidence disclosures, and source-accounting content are present. However, the application test suite fails, cross-destination links can lose project/lens identity during server rendering, the accounting modal does not meet the shared accessible-modal contract, and the visual record lacks the ticket-required mobile inspection. The checkpoint cannot pass until these findings are remediated.
