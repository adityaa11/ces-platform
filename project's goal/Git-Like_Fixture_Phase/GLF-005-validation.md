# GLF-005 validation: Reference-led workspace selector

- **Ticket / batch:** GLF-005 / BATCH-21
- **State:** awaiting_review
- **Reference:** `UI References/atlas_workspace_switcher_calibrated.html`

## Verified outcome

- Project and Workspace are distinct labeled sidebar controls, with Workspace
  directly beneath Project.
- The Workspace trigger presents name, lifecycle status, and recency without
  conflating lifecycle with selection.
- The expanded menu follows the calibrated layout: header, search, filters,
  grouped Published truth / Active workspace / Other workspaces audit cards,
  scrollable body, and fixed audit footer with New workspace action.
- Rows include stable injected IDs, base workspace, PRD count, creator, and
  modifier audit metadata, displayed HEAD, and execution provenance supplied
  by the injected model. An Extracting-equivalent Processing row remains
  visible and announces why it cannot open.
- Users (created by or modified by), Status, Created date, and Modified date
  are keyboard-operable filters. Their selected counts, clear actions, and
  live result count update the grouped inventory without changing the injected
  workspace records.
- The selector is mounted in the normal Main Workflow, Project Facts/Changes,
  and Sources workspace shells. Its current presentation adapter does not
  perform fixture inventory reads, route writes, persistence, or PRD-lens
  control; GLF-005-01 retains those integration concerns.

## Checks

- `pnpm --filter @atlas/app lint` — PASS
- `pnpm --filter @atlas/app build` — PASS
- Browser render and interaction review — PASS for trigger, open menu,
  selection styling, grouped audit inventory, displayed HEAD/provenance,
  user filtering (Sari: 2 of 5 results), date-filter controls, unavailable
  message, and fixed footer.
