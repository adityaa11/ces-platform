# Review: BATCH-05-00 - Shared shell and fixture selection

- Reviewed commit: `fcf8e2c`
- Baseline: AUI-006 BATCH-05-00 prerequisite; Fixture Data-Intent Contract; UI/UX Prototype PRD 5.1, 6, 9.1, and 9.3
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/components/ProjectLibrary.tsx`: project card link | Fixture Data-Intent Contract requires ready-project navigation to preserve `projectId` and route to `/demo?projectId=<id>&view=workflow`; AUI-006 requires project selection to unlock the workflow destination | Accepted | Build the workflow link from the fixture project ID, e.g. `/demo?projectId=${project.id}&view=workflow`, and verify that selecting each ready fixture project resolves the matching workspace. |
| F-002 | Important | `apps/atlas/components/AppShell.tsx`: `libraryProjects` and `current` | Fixture relationship rule and BATCH-05-00 require typed fixture project IDs and removal of UI-local project records | Accepted | Remove the local `libraryProjects` records and synthetic `id: "selected"`; receive the scenario/project list and selected project identity from shared fixture contracts, preserving stable IDs, routes, status, and workspace relationships. |
| F-003 | Important | `apps/atlas/tests/rendered-html.test.mjs` | A committed checkpoint must pass relevant validation; the rendered-route test still asserts the removed `Workspace navigation` and `aria-controls="profile-menu"` markup | Accepted | Update the rendered tests to assert the new shared-shell/project-switcher contract and add coverage for project-ID workflow navigation; `pnpm test` must pass. |
| F-004 | Important | `project's goal/atlas-ui/` | Required visual-validation record must document the shared-shell states before review | Accepted | Add a BATCH-05-00 visual-validation record covering project selection, workflow route availability, profile/project switcher open and closed states, outside click, Escape, focus, expanded/collapsed sidebar, themes, desktop/mobile widths, and selected/unselected states. |

## Decision

The shared-shell refactor is directionally present, but the committed checkpoint is not reviewable: the application test suite fails on stale shell assertions, project-card navigation drops the required project identity and therefore cannot open the workflow, and the shell still invents local project records instead of consuming fixture relationships. The required BATCH-05-00 visual-validation evidence is also absent. Fixture contract tests and lint pass, but they do not offset these in-scope failures.
