# BATCH-05-00: Shared-shell visual-validation record

- **Checkpoint:** Remediation for review of `fcf8e2c`
- **Ticket:** AUI-006, BATCH-05-00 prerequisite
- **Date:** 21 August 2026

## Changed shared components

| Component | Fixture relationship used | Intentional states |
|---|---|---|
| `ProjectLibrary` | `scenario.projects[]` by stable `project.id` | Ready project links to its workflow; processing project has no workflow destination |
| `AppShell` | Scenario project list, selected `projectId`, and selected workspace | Library has no selected project; workspace identifies the selected fixture project |
| `ProfileMenu` | Scenario session | Open/closed profile menu and Light/Dark theme controls |

## Rendered-state inspection

| Surface | States actually inspected | Result |
|---|---|---|
| Project library | No selected project; ready Safara card and processing Member portal card; ready workflow URL `/demo?projectId=safara&view=workflow` | Pass — ready item is a link with its fixture ID; processing item is informational only |
| Project switcher | Closed and open; ready and unavailable fixture states; selected/unselected state; Escape and outside-click dismissal | Pass — the open menu exposes the ready fixture link and labels the processing item without inventing a route |
| Profile menu | Open/closed; Escape dismissal; Light and Dark theme selection | Pass — both themes applied and Escape returned the menu to its closed state |
| Sidebar | Expanded and collapsed desktop states | Pass — the visible sidebar control changed between `Collapse sidebar` and `Expand sidebar` and restored the expanded shell |
| Responsive shell | Desktop and 390 × 844 narrow viewport | Pass — the narrow viewport retained the Menu entry and the same shell controls |

## Design-quality check

- Project identity is carried by fixture IDs, never display names or UI-local records.
- The library intentionally has no current project; workflow context appears only after a valid ready-project route resolves.
- Overlay controls remain dismissible with keyboard and pointer behavior, while sidebar and theme state stay legible at desktop and narrow widths.
