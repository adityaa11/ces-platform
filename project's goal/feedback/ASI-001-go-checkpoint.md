# ASI-001 GO checkpoint — isolated Admin sign-in visual frame

- **Ticket authority:** [ASI-001](../atlas-ui/ticket/Admin_Sign_In_Phase/ASI-001-isolated-admin-sign-in-ui.md)
- **Ticket state:** `awaiting_review`
- **Implementation commit:** `HEAD` at this checkpoint
- **Review target:** the committed ASI-001 route, presentation component, and scoped Admin styles

## Bounded change set

- Added the direct App Router route `/admin/sign-in`.
- Added a dedicated `AdminSignIn` presentation component with semantic,
  editable email/password inputs and a non-submitting form.
- Added only `.admin-sign-in-*` scoped presentation rules while reusing Atlas
  semantic tokens and the existing `ThemeProvider` / `atlas-theme` authority.
- Did not modify public authentication components, public navigation, backend
  endpoints, session handling, or any other Admin route.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence and command | Status |
| --- | --- | --- | --- | --- |
| `RC-ASI-001-01` | Outcome; Scope; Acceptance: direct route | `/admin/sign-in` renders directly and refreshes without session-dependent redirect. | `pnpm --filter @atlas/app build` completed successfully and listed `? /admin/sign-in`; browser opened `http://localhost:3001/admin/sign-in` directly. | `PROVEN` |
| `RC-ASI-001-02` | Scope; Responsive and visual fit | Approved header, form surface, copy, desktop/mobile hierarchy, background, surfaces, and documented compact omissions. | Rendered inspection at desktop/light and 375 × 812 compact/dark. Compact view preserved a 456 px-bounded form, hid `Private access` and right footer metadata, and reported `scrollWidth === clientWidth === 360`. | `PROVEN` |
| `RC-ASI-001-03` | Theme ownership; Acceptance: shared theme behavior | Both accessible theme controls invoke the existing Atlas provider and reflect explicit selection. | Browser click on `Dark theme`: `data-theme="dark"`, dark `aria-pressed="true"`, light `aria-pressed="false"`; no Admin theme key or provider exists. | `PROVEN` |
| `RC-ASI-001-04` | Form and interaction states | Native labelled, required email/password controls; keyboard-reachable named controls; no submission, password mode change, validation, or result reveal before ASI-002. | Rendered accessibility tree exposed labels, native text fields, and named controls. Clicking Sign In left the URL at `/admin/sign-in`; password remained `type="password"`; status region remained hidden. | `PROVEN` |
| `RC-ASI-001-05` | Explicitly out of scope; shared invariants | No auth/API/session/navigation implementation; no public Admin entry point; no additional Admin route; public auth selectors remain untouched. | Source inspection of added route/component found no `fetch`, router, auth client, storage, endpoint, or public-navigation usage. Diff contains only `/admin/sign-in`, `AdminSignIn`, and `.admin-sign-in-*` rules. Browser check of `/sign-in` retained its public `.auth-card` and had no Admin frame. | `PROVEN` |
| `RC-ASI-001-06` | Validation handoff; implementation brief UI-10 | Build, scoped lint, diff hygiene, and actual rendered states are recorded. | `pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx app/admin/sign-in/page.tsx` passed; `pnpm --filter @atlas/app build` passed; `git diff --check -- apps/atlas/app/globals.css` passed. | `PROVEN` |

## Visual-validation record

### Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
| --- | --- | --- | --- |
| `ThemeProvider` and Atlas semantic tokens | Reused without modification for the Admin frame. | Existing Atlas routes plus `/admin/sign-in`. | Icon-shaped light/dark controls call the existing provider. |
| `.admin-sign-in-*` stylesheet namespace | Provides the isolated visual frame without touching public auth selectors. | `/admin/sign-in` only. | Desktop and compact composition. |

### Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `/admin/sign-in` | Default, theme selected/unselected, native input focus styling, non-submitting action | Light and dark | Desktop; 375 × 812 compact | Context line, kicker, title, explanation, labels, notice, and footer wrap/read in hierarchy | Native labels, input types/autocomplete, accessible theme/password/action names, visible focus rules, reduced motion | Pass; rendered browser inspection. |

### Design-quality check

- **Reference or approved pattern used:** supplied Admin sign-in standalone and light/compact previews.
- **Visual direction:** sparse, bounded single-form surface with one dominant action; grid/rings remain supporting context.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** pass; form remains centered and bounded rather than stretched; no Admin link was added to public navigation.
- **Known limitations or intentional omissions:** validation, password visibility mutation, and informational-result revelation are frozen for ASI-002; no authentication is implemented.

### Regression learning

- **Any visual defect found after an earlier check:** Vinext did not attach the route CSS Module, so the same scoped rules were moved into `globals.css` using the exclusive `.admin-sign-in-*` namespace.
- **Previously missed state:** none.
- **New mandatory state for this component:** none; ASI-004 remains the phase's formal visual/accessibility review gate.

## Validation note

The full `pnpm --filter @atlas/app lint` was attempted. It currently fails only
in pre-existing unrelated files: `components/RuntimeFixtureRoute.tsx`, two
`scripts/perception-*.mjs` files, and `vite.config.ts`. No failure is reported
for ASI-001 files; the focused ESLint command above passes.

Internal readiness: READY_FOR_CK
