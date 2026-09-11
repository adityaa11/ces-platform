# GLF-005-02 validation record

- **Ticket / review batch:** GLF-005-02 / BATCH-21.2
- **Validation date:** 11 September 2026
- **Fixture-contract suite:** 26/26 passed
- **App lint:** passed
- **App build and rendered-route suite:** 8/8 passed

## Rendered and interaction checks

| Check | Route / condition | Observed outcome |
|---|---|---|
| Modal entry and field contract | `/demo?projectId=safara&view=workflow`, Workspace switcher, desktop | The `+ New workspace` action opens the shared focus-managed dialog. It presents only Workspace name, Base workspace, and PRD PDFs, with visible required labels; no ID, base-HEAD, status, audit, or purpose fields are exposed. |
| Base selection | New workspace dialog | Master and Increment 03 are available as fixture-owned base choices. The explanation says Atlas snapshots the selected base HEAD internally. |
| Empty validation | New workspace dialog, empty submit | Name and PRD errors render as separate `role="alert"` messages without clearing the selected base. |
| Fixture handoff | `createFixtureWorkspace` contract tests | A valid request generates a collision-checked `saf-<12 lowercase base32>` ID, captures the chosen base ID and HEAD, and creates one matching Extracting record and extraction request. The generated row is unavailable with its fixture-owned explanation. |
| Stable branch identity | Fixture inventory base adapter | The creation contract accepts `branch-master` and `branch-increment-003`, the stable IDs surfaced by the selector, while preserving Master-rooted lineage. |
| Desktop visual check | Light theme, desktop | The dialog is centered above the audit inventory; field hierarchy, explanatory copy, and one primary action remain readable. |
| Narrow visual check | Light and Dark themes, 390 × 844 | The modal portals above the transformed drawer, retains all fields and the action without horizontal overflow, and uses a readable single-column form. |
| Accessibility and dismissal | Shared Dialog plus rendered modal | Native labelled fields, visible focus treatment, non-color error alerts, focus entry/containment, Escape, backdrop dismissal, and trigger-focus restoration use the existing Dialog contract. |

## Frontend review gate

| Gate | Result | Evidence |
|---|---|---|
| VIS-001–005 | PASS | Reuses Atlas dialog, token, surface, and grouped settings-form patterns. |
| VIS-006–009 | PASS | Labels, supporting text, alerts, disabled/loading submit state, and one primary action are explicit and readable. |
| VIS-010–011 | PASS | The portal avoids drawer clipping; mobile reflow has no horizontal overflow and retains accessible dialog semantics. |
| VIS-012–015 | PASS | The calm operational workspace hierarchy, density, and Light/Dark semantic tokens remain consistent. |

## Decision

The prototype creates only transient fixture-owned extraction requests. It does
not upload files to external storage, run extraction, publish a branch, or
make downstream knowledge surfaces read from the generated workspace.
