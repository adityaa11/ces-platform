# SFE-003: Wire the Initial Draft fixture to the project route and switcher

- **State:** planned
- **Review batch:** BATCH-28
- **Depends on:** SFE-000 approved; SFE-002 approved; GLF-004-01 approved; GLF-005-01 approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 4.2–4.3, 5–6, 9.1, 9.4; [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md); [GLF-004-01](../Git-Like_Fixture_Phase/GLF-004-01-project-route-fixture-recalibration.md); [GLF-005-01](../Git-Like_Fixture_Phase/GLF-005-01-workspace-selector-golden-fixture-integration.md)
- **SFE-000 map entries:** SFE-M4 route/switcher reads; SFE-M5 project/workspace isolation checks

## Outcome

Wire project 01's newly generated golden fixture into the existing route UI so the project card can open the Initial Draft and its workspace selector exposes the empty Master and populated Initial Draft as two distinct fixture-owned workspaces.

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

- Opening the project 01 card resolves the same project ID and Initial Draft workspace ID used by SFE-002's extraction fixture.
- The selector shows exactly two workspaces for this initial project: an empty Master and a Ready-to-review Initial Draft. Selecting Initial Draft opens the extraction review route; selecting Master shows no published work.
- Workspace selection retains the project ID and route context. It does not overwrite the PRD lens or use component-local duplicate workspace data.
- The project card shows Ready to review and an enabled review/open action once the route is wired; the Extracting state remains unavailable before SFE-002 completes.
- The route and selector keep extraction candidates visibly separate from accepted Master truth.

## Validation

- Manually follow the project creation and extraction states in the browser, then open the project card and switch between Master and Initial Draft.
- Verify both selector entries resolve from the same fixture-owned workspace inventory and exact stable IDs; verify route context survives switching and reload.
- Check keyboard/pointer operation, focus, status announcement, desktop/narrow layouts, supported themes, and the complete connected project-card/selector surface.
