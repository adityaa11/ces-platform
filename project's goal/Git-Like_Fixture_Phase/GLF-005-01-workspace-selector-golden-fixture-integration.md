# GLF-005-01: Workspace selector golden-fixture integration

- **State:** awaiting_review
- **Review batch:** BATCH-21.1
- **Depends on:** GLF-005, GLF-003-03
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

## Validation record

- `pnpm --filter @atlas/fixtures test` — PASS (25 tests), including stable-ID
  inventory resolution, selected Master route resolution, and Extracting
  fallback/availability behavior.
- `pnpm --filter @atlas/app lint` — PASS.
- `pnpm --filter @atlas/app test` — PASS (8 tests): rendered routes verify
  canonical `workspaceId` propagation through workflow, facts, changes, CES,
  and Sources; Master selection; and the Extracting route explanation/fallback.
- Rendered browser inspection — PASS. At 1280 × 900, the selected Master
  shows its fixture-supplied HEAD and provenance, and all workspace navigation
  links retain `workspaceId=branch-master`. The opened inventory exposes
  Master, Increment 03, and the Extracting refund workspace with their stable
  identities, bases, audit metadata, status, HEAD, and execution provenance.
  Attempting the Extracting row leaves Master selected and announces the
  fixture-owned unavailable reason.
- Responsive/theme inspection — PASS. At 390 × 844, the shared navigation
  opens the selector as a readable, scrollable sheet with keyboard-operable
  search/filter controls and no clipping. Light and Dark inspections preserve
  the same selected, unavailable, provenance, and route-context hierarchy.
- Frontend review gate VIS-001–015 — PASS. The change reuses the approved
  workspace-switcher's semantic token, type, status, focus, and responsive
  system; it adds no local visual treatment or duplicate workspace truth.
