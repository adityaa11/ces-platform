# GLF-005-01: Workspace selector golden-fixture integration

- **State:** in_progress
- **Review batch:** BATCH-21.1
- **Depends on:** GLF-005
- **Baseline:** Architecture Checkpoint sections 17, 22.5-22.6, 24; UI/UX Prototype PRD sections 5-6, 9.1, 9.4; Fixture Data-Intent Contract; GLF-003; GLF-004-01; GLF-005

## Outcome

Wire the approved workspace-switcher UI to the golden-fixture branch inventory
and project/route state. The selected workspace provides branch context and
its selected HEAD/provenance, while the PRD lens remains a distinct control.

## Scope

- Resolve every switcher option from fixture-owned workspace/branch records,
  keyed by stable identity rather than display labels.
- Persist the permitted selected workspace alongside project and route context.
- Provide the selected workspace's HEAD and execution provenance to the UI as
  branch context, not as a document filter or approval control.
- Keep PRD-lens state, labeling, and selection independent of workspace state.
- Render extracting workspaces in the inventory but make them unavailable for
  selection/opening. Activating one must explain accessibly that extraction is
  still in progress and the workspace cannot be opened yet.
- Permit a ready-for-review workspace to be selected and opened through the
  fixture-backed route boundary.

## Out of scope

- Creating a workspace or handling PRD uploads; GLF-005-02 owns that intake.
- Migrating Main Workflow, Project Facts, CES, Changes, Sources, or chatbot
  reads to the selected workspace HEAD; GLF-006 owns that migration.
- Production storage, extraction execution, reconciliation, or provider
  integrations.

## Acceptance criteria

- Master and all incremental fixture workspaces render from one fixture-owned
  inventory with their stable IDs, base-workspace metadata, statuses, and
  selected-HEAD provenance.
- Selecting an available workspace preserves the current project and route
  context and does not overwrite the PRD lens.
- An Extracting workspace remains visible but cannot become the selected/opened
  workspace; its attempted activation produces a clear non-blocking status
  explanation.
- When a fixture workspace is Ready for review, it can be selected and opened
  through the same stable-ID adapter.
- The implementation contains no component-local duplicate workspace truth.

## Validation

- Exercise Master, Review/ready, and Extracting records through keyboard and
  pointer interaction, including stable-ID route resolution and the unavailable
  access message.
- Verify selected workspace, selected HEAD/provenance, project context, and
  PRD-lens state remain correctly separated across route transitions.
- Render desktop, narrow, and mobile states in supported themes; record visual
  validation and apply the frontend review gate before review.

## Decision log

- 11 September 2026: A workspace in Extracting state is visible in the
  switcher but cannot be selected or opened. It becomes selectable/openable
  only after its fixture-owned status is Ready for review.
