# Review: BATCH-14 - CSP-safe application patterns

- Reviewed commit: `cc5189d1b7e927e4f117d431b9c1ebe49326b0f4`
- Ticket: `CSP-002`
- Baseline: [CSP refactor ticket set](../atlas-ui/CSP-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [AUI-001 foundation and fixture boundary](../atlas-ui/AUI-001-foundation-and-fixture-boundary.md); [AUI-009 responsive and clarity pass](../atlas-ui/AUI-009-responsive-and-clarity-pass.md); [Atlas UI/UX Prototype Review Protocol](../Atlas_UI_UX_Review_Protocol.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1 (initial checkpoint review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `apps/atlas/app/layout.tsx:18-21`; `apps/atlas/components/AuthScreen.tsx:5`; `apps/atlas/components/AppShell.tsx:54`; rendered `/sign-in` and `/demo?projectId=safara&view=sources` after selecting Light on `/` | CSP-002 acceptance criterion: theme selection and persistence must work on public and workspace routes in both themes; scope requires preserving the existing preference control while replacing the bootstrap | Accepted | Apply the persisted theme preference globally on every route, including authentication and workspace pages where `ThemeSelector` is not mounted. After selecting Light, navigating to or reloading `/sign-in`, `/demo`, and each workspace destination must remain Light (and Dark must remain Dark), rather than reverting to the system theme. Add route-level regression coverage. The current auth/workspace responses have no `data-theme` and render the dark system fallback despite the persisted Light choice. |
| F-002 | Important | `apps/atlas/components/ThemeSelector.tsx:7-25`; rendered public `/` with a persisted Light preference | CSP-002 acceptance criterion: theme behavior must remain correct and semantically clear in both themes; frontend review gate requires theme parity and no misleading selected state | Accepted | Make the initial server/client render hydration-safe and keep the control’s `aria-pressed` and active styling synchronized with the actual root theme. With Light persisted, the page becomes Light (`data-theme="light"`), but the rendered selector remains on Dark (`aria-pressed="true"` / `theme-active`) and the browser reports a React hydration-mismatch error. The visible and accessible selected state must show Light without a hydration warning. |

## Validation

- `pnpm test` passed: all fixture tests, the production build, and all six
  application tests passed.
- `pnpm --filter @atlas/app lint` passed.
- Source scans found no Atlas-owned `dangerouslySetInnerHTML` script, runtime
  `document.*.style.*` or canvas `.style.width/.style.height` mutation, or
  lowercase inline HTML event-handler attribute in application source.
- Browser inspection covered the desktop project library in Dark and Light,
  the 573px compact navigation drawer, drawer body scroll locking and focus,
  mobile profile-sheet dialog semantics, Escape/focus restoration, and outside
  dismissal.
- Browser inspection covered the source viewer at desktop and mobile widths;
  PDF loading, page navigation, 100% zoom, fit width, fullscreen entry/exit,
  canvas sizing, and horizontal overflow all behaved correctly with no viewer
  error state.
- Browser console inspection on `/` after the persisted Light selection
  recorded a React hydration-mismatch error matching F-002. The same browser
  session showed the persisted-theme fallback defect in F-001.
- Existing uncommitted working-tree changes were not evaluated.

## Decision

BATCH-14 remains `CHANGES_REQUESTED`. The CSP-safe pattern migration is present
and the navigation/PDF interactions remain functional, but theme persistence
does not cover all required routes and the public theme control can misreport
the active theme after hydration. These Important findings must be resolved
before the checkpoint can pass.
