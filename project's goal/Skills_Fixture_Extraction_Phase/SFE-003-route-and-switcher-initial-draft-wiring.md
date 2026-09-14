# SFE-003: Wire the Initial Draft fixture to the project route and switcher

- **State:** complete
- **Review batch:** BATCH-28
- **Depends on:** SFE-000 approved; SFE-002 approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 4.2–4.3, 5–6, 9.1, 9.4; [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md)
- **SFE-000 map entries:** SFE-M0 source isolation; SFE-M4 route/switcher reads; SFE-M5 project/workspace isolation checks
- **Source authority:** Route and switcher data must resolve only from SFE-created fixture identities; see the [SFE workspace-source rule](SFE-README.md#sfe-workspace-source-rule).

## Outcome

Wire the preceding modal-created project's newly generated fixture into the existing route UI so its card can open the Initial Draft and its workspace selector exposes the empty Master and populated Initial Draft as two distinct fixture-owned workspaces. “Project 01” is a scenario label only.

## Scope

- Resolve the project card, project route, workspace selector, and extraction-review destination from the SFE-002 fixture by stable project/workspace IDs.
- Display `Master` and `Initial Draft` as system-generated workspace names; do not make them user-entered names or infer their meaning from card labels.
- Keep Master empty and Initial Draft connected to the extracted candidate and its source grounding.
- Make the Ready-to-review Initial Draft openable through the existing project route and workspace selector after the fixture relationship is valid.
- Preserve no-project-selected behavior and the current route/shell design outside the required adapter and data wiring.

## Out of scope

- Changing extraction content, approving the draft, or publishing Master.
- Creating project 02 or adding the later workspace; SFE-004 and SFE-006 own those steps.
- Migrating unrelated downstream knowledge surfaces beyond the routes needed to open and inspect this Initial Draft.

## Acceptance criteria

- Opening the target card resolves the same modal-created project ID and Initial Draft workspace ID used by SFE-002's extraction fixture.
- The selector shows exactly two workspaces for this initial project: an empty Master and a Ready-to-review Initial Draft. Selecting Initial Draft opens the extraction review route; selecting Master shows no published work.
- Workspace selection retains the project ID and route context. It does not overwrite the PRD lens or use component-local duplicate workspace data.
- The project card shows Ready to review and an enabled review/open action once the route is wired; the Extracting state remains unavailable before SFE-002 completes.
- The route and selector keep extraction candidates visibly separate from accepted Master truth.

## Validation

- Manually follow the project creation and extraction states in the browser, then open the project card and switch between Master and Initial Draft.
- Verify both selector entries resolve from the same fixture-owned workspace inventory and exact stable IDs; verify route context survives switching and reload.
- Check keyboard/pointer operation, focus, status announcement, desktop/narrow layouts, supported themes, and the complete connected project-card/selector surface.

## Remediation validation — BATCH-28 / review round 1

- `node --test packages/atlas-fixtures/tests/contracts.test.mjs` passes 22/22, including an arbitrary completed modal-project record whose stable project and Initial Draft IDs resolve together; the Master content model has zero workflows, facts, changes, and CES items.
- `corepack pnpm --filter @atlas/app lint` passes.
- Browser inspection of `/demo?projectId=safara-project-01&workspaceId=saf-24aysgyw4su6&view=workflow` confirms the selected Initial Draft uses its fixture-owned ID and exposes exactly two selector entries. Reloading with `workspaceId=master` displays the distinct Master state with zero operational-model counts and the explicit `No published work` empty state.

## Remediation validation — BATCH-28 / review round 2

- The route client reads `/api/local-fixtures` and passes its modal-created records into stable project, inventory, and workspace-content resolution; unknown or incomplete records remain unavailable.
- `node --test packages/atlas-fixtures/tests/contracts.test.mjs` passes 22/22, including checks that the persisted Initial Draft projects its extraction candidate count and exact first-candidate source quote, while Master is an empty `Draft` state.
- `corepack pnpm --filter @atlas/app build` passes. `git diff --check` passes. The focused app lint still reports two pre-existing unused `_files` bindings in `apps/atlas/vite.config.ts`; the remediation’s unused selector base record was removed.

## Remediation validation — BATCH-28 / review round 3

- Runtime modal records now flow through both route resolution and `WorkspaceSwitcherDemoHost` inventory resolution.
- Selector changes update the runtime route workspace state immediately while retaining the project ID and URL context; the selected content is re-resolved from the same fixture record.
- `corepack pnpm --filter @atlas/app build` and `git diff --check` pass.
