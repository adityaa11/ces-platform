# CSP-002: CSP-safe application patterns

- **State:** awaiting_review
- **Review batch:** BATCH-14
- **Depends on:** CSP-001
- **Baseline:** [CSP refactor ticket set](CSP-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [AUI-001](AUI-001-foundation-and-fixture-boundary.md); [AUI-009](AUI-009-responsive-and-clarity-pass.md)

## Outcome

Remove Atlas-owned inline execution and inline-style mutations while preserving
the existing theme, navigation, modal, PDF, and responsive behavior.

## Scope

- Remove the inline theme bootstrap from [layout.tsx](../../apps/atlas/app/layout.tsx)
  and use a CSS system-theme fallback plus the existing client-side preference
  control; use a cookie only if server-rendered no-flash behavior is required.
- Remove `suppressHydrationWarning` if it is no longer needed after the theme
  bootstrap is removed.
- Replace body overflow style mutation in `AppShell` with a semantic body or
  root class controlled by shared CSS.
- Replace PDF canvas `.style.width` and `.style.height` writes with intrinsic
  canvas attributes, classes, or another policy-compatible sizing mechanism.
- Confirm that all controls continue to use React event props rather than HTML
  event attributes.
- Keep CSS in the bundled external stylesheet and preserve shared design tokens.

## Explicit exclusions

- Do not alter Vinext-generated hydration scripts; CSP-001 supplies their nonce.
- Do not introduce a new theme product capability or change light/dark visual
  direction.
- Do not change fixture data, routes, roles, lens behavior, or PDF source URLs.
- Do not add `'unsafe-inline'` to `style-src` or `script-src`.

## Acceptance criteria

- No Atlas-owned inline `dangerouslySetInnerHTML` script remains in the app.
- No application code writes `document.*.style.*` or element `.style.*` for the
  changed flows.
- The application remains free of inline HTML event-handler attributes.
- Theme selection and persistence work on public and workspace routes in both
  themes.
- Mobile navigation lock/unlock and modal focus behavior remain unchanged.
- PDF canvas rendering retains page size, zoom, fit-width, and fullscreen
  behavior.
- The app operates with `style-src 'self'` and `style-src-attr 'none'` without
  console CSP violations.

## Validation

- Run source checks for inline scripts, inline event attributes, and runtime
  style mutation patterns.
- Inspect landing, authentication, project library, workspace, modal, and
  source-viewer states in Light and Dark themes.
- Inspect desktop, tablet, and compact mobile layouts, including navigation and
  profile overlays.
- Exercise keyboard focus, Escape/outside dismissal, theme persistence, and PDF
  sizing under CSP Report-Only.
- Run application tests and lint, and record the rendered states before review.

## Review batch: BATCH-14

- **Tickets:** CSP-002 only
- **Review question:** Does the complete Atlas UI remain behaviorally and visually equivalent after removing Atlas-owned inline script and style patterns?
- **Combined acceptance criteria:** All criteria in this ticket, with special attention to shared shell states, theme behavior, modal focus, and PDF canvas layout.
- **Commit range:** The single implementation checkpoint for CSP-002.
