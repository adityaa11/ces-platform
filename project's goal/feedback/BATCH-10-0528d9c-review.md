# Review: BATCH-10 - Shell navigation cosmetic refactor

- Reviewed commit: `0528d9c1af0758de3c15936813a10e6b8c763b3a`
- Baseline: [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 2.1, 2.2, 4.1, 7, 9.4, and 9.4.1; [AUI-003](../atlas-ui/AUI-003-account-shell-and-ui-primitives.md); [AUI-009](../atlas-ui/AUI-009-responsive-and-clarity-pass.md); [AUI-011 acceptance criteria and validation](../atlas-ui/AUI-011-shell-navigation-cosmetic-refactor.md)
- Result: `CHANGES_REQUESTED`
- Review round: 3 (final remediation review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/components/AppShell.tsx:24`; `apps/atlas/components/WorkflowWorkspace.tsx:37`; `apps/atlas/components/ProjectKnowledge.tsx:23`; rendered `/demo?projectId=safara&view=facts&prd=safara-increment-02&lens=isolate` | AUI-011 acceptance criteria and validation: Workspace navigation must preserve project ID, view, PRD-lens context, and query parameters | Accepted | Ensure the server-rendered and hydrated Workspace links retain the current `projectId`, `prd`, and `lens` parameters while changing only `view`. The inspected rendered links still resolve to `/demo?projectId=safara&view=workflow|facts|ces|changes`, so clicking them exits the active PRD lens. |
| F-002 | Important | `apps/atlas/components/AppShell.tsx:29-38`; compact 531px workflow render after selecting `PRD 1` | AUI-011 compact header and PRD-lens validation: the compact header must present the current lens state clearly and accessibly | Accepted | Make the compact PRD-lens label derive from the live lens state. After selecting PRD 1, the URL and popover checkbox update, but the header continues to display `All PRDs` because `data-full-label` is retained from the initial text and the document-wide observer rewrites the controlled label. The header must show `1 PRD` while selected and return to `All PRDs` when cleared. |

## Decision

The remediation resolves the prior search-control, focus-boundary, Light-theme contrast, responsive-validation, and BATCH-10 state-tracking findings. Automated checks pass (`pnpm test`, `pnpm lint`); tablet inspection confirms the rail/search layout, and compact inspection confirms the drawer and header composition. BATCH-10 remains `CHANGES_REQUESTED` because F-001 is an unresolved Blocker and F-002 is an Important introduced compact-state defect. Existing uncommitted working-tree changes were not evaluated.
