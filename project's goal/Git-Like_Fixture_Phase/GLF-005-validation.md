# GLF-005 validation: Workspace selector

- **Ticket / batch:** GLF-005 / BATCH-21
- **State:** awaiting_review
- **Baseline:** Architecture Checkpoint sections 17, 22.5–22.6, 24; UI/UX
  Prototype PRD sections 5–6, 9.1, 9.4; Fixture Data-Intent Contract;
  GLF-003; GLF-004-01.

## Implementation boundary

- `WorkspaceSwitcher` owns overlay, search, selection presentation, keyboard
  focus, escape/outside dismissal, status presentation, and unavailable-access
  feedback only.
- The host injects `WorkspaceSwitcherModel` and receives a stable-ID selection
  callback. The component has no fixture import, route change, persistence,
  PRD-lens state, or local workspace inventory.
- `/demo?preview=workspace-switcher` is a presentation-only host used for this
  checkpoint. It does not establish data authority and does not wire the golden
  fixture. That is GLF-005-01 scope.

## Validation evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Static quality | PASS | `pnpm --filter @atlas/app lint` completed without findings. |
| Production build | PASS | `pnpm --filter @atlas/app build` completed successfully. |
| Desktop rendering | PASS | Preview rendered the sidebar trigger, contextual overlay, searchable inventory, metadata, selected row, lifecycle badges, and one primary New workspace action. |
| Pointer and selection state | PASS | Selecting Master changed the injected selected context and announced the change while retaining Published as independent lifecycle metadata. |
| Unavailable-access state | PASS | Activating Extracting `Refund rules PRD-04` retained the selected workspace and announced: extraction is still in progress and the workspace cannot be opened. |
| Keyboard/accessibility | PASS | Trigger, search, rows, close action, and New workspace action expose accessible names; menu focuses search on open, restores focus on dismissal, and Escape closes it. Status and unavailable reason are textual rather than color-only. |
| Theme and responsive contract | PASS | The component uses existing semantic surface, text, border, focus, action, warning, and status tokens; desktop is an anchored sidebar popover and the narrow layout becomes a bottom sheet with vertically stacked footer controls. |

## Frontend review gate

`PASS` — VIS-002 through VIS-015 are satisfied for this bounded component:
the entity-library/scope-lens inventory has one clear selection action,
information hierarchy is compact and readable, state is text-supported,
interaction and keyboard focus are complete, the responsive transformation is
explicit, and the existing Atlas token and type system is reused.

## Review request

Review BATCH-21 against the committed checkpoint. GLF-005-01 must not begin
until this checkpoint receives a `PASS` review and the user says `go`.
