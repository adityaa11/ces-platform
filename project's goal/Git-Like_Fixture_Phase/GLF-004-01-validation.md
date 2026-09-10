# GLF-004-01 validation record

- **Checkpoint:** BATCH-20.1
- **Scope:** Fixture-owned project-route resolution and scenario-preserving switcher destinations.
- **Visual system:** Existing Atlas Entity Library and Workspace surfaces; no visual tokens, layout rules, or downstream knowledge views changed.

## Automated validation

| Check | Result |
|---|---|
| `corepack pnpm --filter @atlas/fixtures test` | Pass — 21/21, including stable-ID route resolution for published, extracting, ready-for-review, and unknown records. |
| `corepack pnpm --filter @atlas/app test` | Pass — 8/8, including editor scenario preservation and unavailable-project fallback. |
| `corepack pnpm --filter @atlas/app lint` | Pass |
| `git diff --check` | Pass |

## Rendered checks

| Route | Observed state | Result |
|---|---|---|
| `/demo?scenario=editor-ready&projectId=safara&view=workflow` | The selected workspace is Safara by its stable ID, retains the editor scenario and PRD-lens context in navigation links, and shows editor Raka Pratama without owner-only sharing controls. | Pass |
| `/demo?projectId=vendor-onboarding&view=workflow` | The fixture-owned ready-for-review record has no workspace adapter, so the route returns to the valid no-project-selected library state. Workspace links stay disabled, while the visible card explains the unavailable review workspace. | Pass |

## Frontend review gate

- **VIS-001–006, VIS-012–014:** Pass — the implementation reuses the existing Entity Library and workspace visual contract; it introduces no new visual treatment or local styling.
- **VIS-007–011:** Pass — fixture lifecycle actions remain explicit, unavailable destinations are disabled rather than dead links, keyboard/accessibility semantics remain native, and existing responsive composition is unchanged.
- **VIS-015:** Not independently changed; the route and fixture boundary are presentation-neutral and retain the established semantic theme tokens.

## Deferred boundary

Main Workflow, Project Facts, CES Result, Changes Done, Sources, and chatbot-read data retain their existing fixture read paths. Branch/HEAD-aware reads remain deferred to GLF-006.
