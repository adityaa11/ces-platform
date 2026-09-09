# GLF-004 responsive validation record

- **Checkpoint:** BATCH-20
- **Validated commit:** remediation candidate following `d7c5f6c`
- **Theme:** default light theme
- **Route:** `/demo` using the `owner-ready` fixture scenario

## Rendered checks

| Viewport | Observed state | Result |
|---|---|---|
| Desktop (1200 px wide) | Published, Extracting, and Ready for review cards render in one aligned three-card row; Master state, optional Initial Draft progress, metrics, primary action, and owner Share action remain in the shared card frame. | Pass |
| Narrow/tablet (768 px wide) | The card grid changes to two columns while descriptions, Master state, progress, metrics, actions, and status treatments remain contained within their cards. | Pass |
| Mobile (420 px wide) | The grid is one column. The status badge moves below the title at compact card widths, so `Vendor onboarding revamp` wraps by words and cannot collide with `Ready for review`. | Pass |

## Interaction and accessibility checks

- Published Master is presented as accepted truth; Extracting and Ready for review present an empty Master plus Initial Draft state.
- Extracting is disabled with an accessible explanation, including its Share action. Ready for review has completed processing and exposes enabled Open project and Share actions.
- Owner-only Share opens the existing project-scoped sharing dialog when the project is actionable; editor and viewer card compositions do not render Share.
- Primary actions, Share, and status badges retain visible focus treatment and readable names.
- The no-project-selected library shell remains in place; card identity and generated links use `project.id`, not the display label.
