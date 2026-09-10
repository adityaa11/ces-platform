# GLF-004 responsive validation record

- **Checkpoint:** BATCH-20
- **Validated commit:** `9d0818cdc72059d7c5258db4c24cc1eeff90da6e` (final remediation)
- **Theme:** default dark theme; the existing semantic theme tokens also retain the same state/action hierarchy in light theme.
- **Routes:** `/demo` using `owner-ready`; `/demo?stress=project-cards` for the isolated maximum-content render

## Rendered checks

| Viewport | Observed state | Result |
|---|---|---|
| Expanded shell desktop (1200 px viewport; about 866 px grid width after the 256 px sidebar, route padding, and gaps) | The formula chooses two columns, each capped at 400 px rather than stretching three sparse cards. Published, Extracting, and Ready for review retain aligned Master, draft, metric, and action sections. | Pass |
| Collapsed shell desktop (1200 px viewport) | The wider route area permits three columns, capped by the three real projects; cards retain the 304–400 px fit bounds and no internal section stretches to fill surplus width. | Pass |
| Narrow/tablet (768 px viewport) | The grid reflows to two contained columns; descriptions, Master state, progress, metrics, actions, and status treatments remain in their cards. | Pass |
| Mobile (420 px viewport) | The grid is one column. The status badge moves below the title at compact card widths, so `Vendor onboarding revamp` wraps by words and cannot collide with `Ready for review`. | Pass |
| Maximum-content fixture (expanded shell, supported card widths) | `/demo?stress=project-cards` renders the lower-, upper-, and mixed-case 48-character IDs plus 80-character names and 280-character summaries from `projectCardStressFixtures`; identity and text wrap visibly without line clamps, ellipses, or clipping. | Pass |

## Interaction and accessibility checks

- Published Master is presented as accepted truth; Extracting and Ready for review present an empty Master plus Initial Draft state.
- Extracting primary and Share actions are disabled and both reference the same project-specific accessible explanation. Ready for review shows a completed Initial Draft and a disabled `Review workspace unavailable` action with a prototype-boundary explanation; its owner Share action remains available. Only the published project exposes an enabled workspace destination.
- Owner-only Share opens the existing project-scoped sharing dialog when the project is actionable; editor and viewer card compositions do not render Share.
- Primary actions, Share, and status badges retain visible focus treatment and readable names.
- The no-project-selected library shell remains in place; card identity and generated links use `project.id`, not the display label.
