# Review: BATCH-12 - Unselected project navigation state

- Reviewed commit: `ea02b5e911076dfe82061820ea7470dad17a0074`
- Ticket: `AUI-013`
- Baseline: [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 2.1, 4.1, 7, 9.1, and 9.4; [AUI-012 reference sidebar composition](../atlas-ui/AUI-012-reference-sidebar-composition.md); [AUI-013 acceptance criteria and validation](../atlas-ui/AUI-013-unselected-project-navigation-state.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1 (initial checkpoint review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/components/AppShell.tsx:27`; hydrated desktop shell after selecting the ready Safara project from either `apps/atlas/components/ProjectLibrary.tsx:51` control; rendered `/demo?projectId=safara&view=workflow` at 1280px | AUI-013 acceptance criterion 3 and AUI-012 acceptance criterion 2: selecting a ready project must restore all four existing workspace destinations with their project ID, query, and lens behavior | Accepted | After either project-card or project-switcher selection at desktop width, the hydrated Main Workflow, Project Facts, CES Result, and Changes Done links must retain `projectId=safara` (plus any active `prd`/`lens` parameters) while changing only `view`. Current rendered links become `/demo?view=workflow|facts|ces|changes`; clicking Project Facts navigates to `/demo?view=facts` and renders the unselected Projects page instead of Project Facts. The server-rendered HTML contains the project ID, so the regression is specifically observable after client hydration/navigation. |

## Validation

- `pnpm test` passed: fixture tests, production build, and application tests all passed.
- `pnpm lint` passed.
- Desktop `/demo` inspection confirmed `No project selected`, four visible `aria-disabled` non-navigable project rows, and the ready/processing project-switcher states.
- Compact 531px inspection confirmed the drawer exposes the selected project, workspace links, profile control, and compact project-switcher selection path.
- Existing uncommitted working-tree changes were not evaluated.

## Decision

BATCH-12 remains `CHANGES_REQUESTED`. The unselected shell state is present and both selection controls reach the selected workspace, but the hydrated desktop shell loses the selected project from every workspace destination. This violates the core restored-navigation requirement and must be corrected before approval.
