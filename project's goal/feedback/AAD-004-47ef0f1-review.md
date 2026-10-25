# CK review: AAD-004 / Admin Dashboard Phase

- **Ticket / batch:** `AAD-004` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-004-compact-admin-navigation.md`
- **Reviewed commit:** `47ef0f130d2edc3bd251b4c59eac9e46bcde8d73` (`feat(atlas): add AAD-004 compact admin navigation`)
- **GO checkpoint:** `project's goal/feedback/AAD-004-go-checkpoint.md`
- **Ticket state at review:** `awaiting_review`
- **Review type:** first CK review
- **Result:** `PASS`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely and is `awaiting_review`. The GO
checkpoint records the committed review target at `HEAD`; `HEAD` resolves to
`47ef0f130d2edc3bd251b4c59eac9e46bcde8d73`. The AAD-004 implementation,
ticket, checkpoint, and focused-test paths are clean at that commit. The
worktree contains unrelated tracked and untracked material, but none overlaps
the AAD-004 target paths, so the committed review target is unambiguous.

This review covers the complete AAD-004 contract: the 820 px compact drawer
transformation, all ticket-named dismissal and focus behavior, body-scroll
cleanup, keyboard and non-color accessibility cues, reduced-motion behavior,
preservation of shared theme and authorization authorities, the AAD-008 layout
handoff, and the explicit scope exclusions. It does not review AAD-008's
rendered compact-navigation/accessibility lane or any other Admin Dashboard
ticket beyond direct regressions necessary to assess AAD-004.

## Review Contract assessment

| Row | Ticket authority | Required proof | Evidence / validation | Status |
|---|---|---|---|---|
| `RC-AAD004-01` | Outcome; Scope bullet 1; Acceptance criterion 1 | Below 820 px, the desktop rail becomes a readable overlay drawer with a backdrop while the main composition remains one column without the desktop minimum width or horizontal squeeze. | `apps/atlas/app/globals.css:1276` applies `@media (max-width: 820px)`, changes `.admin-shell` to `display: block` with `min-width: 0`, and makes the sidebar a fixed overlay with the bounded drawer width and backdrop. `apps/atlas/tests/admin-dashboard-compact-navigation.test.mjs` asserts the compact rule and layout selectors. | `PROVEN` |
| `RC-AAD004-02` | Scope bullets 2–3; Acceptance criterion 2 | Menu, backdrop, Escape, and current Dashboard selection close the drawer as applicable; focus and body scrolling are restored; keyboard operation remains contained while open. | `apps/atlas/components/admin/AdminShell.tsx:28-66,71,77,81` owns the dismissal handlers, focus transfer/restoration, Tab trap, `admin-navigation-locked` lifecycle, and viewport cleanup. The focused compact-navigation test asserts each named hook. | `PROVEN` |
| `RC-AAD004-03` | Scope bullet 4; Acceptance criterion 3 | Keyboard users can reach, operate, and identify the menu and drawer in both themes, while open, selected, disabled, and coming-soon states are not color-only. | `AdminShell.tsx:71,78,81-88` provides native controls, labels, `aria-expanded`, `aria-controls`, `aria-hidden`/`inert` for compact-closed navigation, `aria-current`, `aria-disabled`, and native disabled destinations. Existing shared `AdminThemeControls` composition and semantic-token CSS remain unchanged outside the compact additions. Focused UI and compact-navigation tests pass. | `PROVEN` |
| `RC-AAD004-04` | Scope bullet 4; Acceptance criterion 4; explicit exclusions | Reduced motion disables non-essential drawer motion, and the compact implementation adds no independent local storage, cookie, router, or identity state. | `apps/atlas/app/globals.css:1278` removes drawer transitions under `prefers-reduced-motion: reduce`. The compact-navigation test rejects local storage, theme persistence, and hard-coded theme colors in the scoped CSS; the committed diff contains no route, guard, identity, or theme-provider change. | `PROVEN` |
| `RC-AAD004-05` | Validation handoff | Focused coverage records closed/open state, backdrop and Escape dismissal, focus restoration, current-page close, body-lock cleanup, disabled destinations, reduced motion, and the compact rendered-layout rule for AAD-008. | `apps/atlas/tests/admin-dashboard-compact-navigation.test.mjs` records the named source-level interaction and CSS observations, including the `@media (max-width: 820px)` rule, fixed overlay rail, and `min-width: 0` shell. | `PROVEN` |

## Validation and evidence

Executed at the reviewed checkout:

```text
corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 9 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint components/admin/AdminShell.tsx tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check HEAD^ HEAD -- apps/atlas/components/admin/AdminShell.tsx apps/atlas/app/globals.css apps/atlas/tests/admin-dashboard-ui.test.mjs apps/atlas/tests/admin-dashboard-compact-navigation.test.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-004-compact-admin-navigation.md" "project's goal/feedback/AAD-004-go-checkpoint.md"
# PASS
```

No direct in-scope regression was identified. The desktop shell remains on its
existing grid geometry above the compact breakpoint, the shared theme controls
remain the theme authority, the protected dashboard route and identity
authority are outside the reviewed diff, and Provider Profiles, Projects, and
Settings remain non-navigating or disabled as required. The local browser
inspection endpoint recorded by GO was unavailable and the route requires an
authenticated Admin session; this review makes no additional visual claim
beyond the committed CSS and focused evidence.

## Frozen Finding Closure Matrix

No ticket-bound deficiency was identified during this first review; therefore
there are no `CK-###` findings or closure clauses to freeze. The five proven
Review Contract rows above are the complete AAD-004 review scope.

## Scope-change observations

None. The rendered compact-navigation and accessibility inspection remains the
separate AAD-008 lane identified by the ticket's validation handoff; it is not
a finding against this AAD-004 checkpoint.

## Decision

`PASS`. The committed AAD-004 work satisfies every applicable ticket-derived
Review Contract row, the required validation passes, and no direct regression
remains. This CK artifact does not authorize AAD-008 or any other successor
implementation.
