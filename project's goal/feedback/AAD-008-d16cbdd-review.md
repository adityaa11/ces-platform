# CK review: AAD-008 / Admin Dashboard Phase

- **Ticket / batch:** `AAD-008` / `Admin Dashboard Phase`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-008-compact-navigation-visual-accessibility-review.md`
- **Reviewed commit:** `d16cbdd59eb21bc378ba5c3ce8f86def99fa24d0` (`test(atlas): record AAD-008 compact dashboard review`)
- **Review type:** first CK review
- **Result:** `PASS`

## Review boundary and preconditions

The frozen ticket is explicitly `awaiting_review`. The committed GO
checkpoint and its browser review harness are included in the reviewed commit,
which is the current `HEAD`; the ticket, checkpoint, and browser-test paths
have no working-tree changes. Other unrelated worktree changes do not overlap
the AAD-008 target, so the review target is unambiguous.

Review was limited to the compact authenticated Dashboard navigation, its
ticket-authorized evidence, and direct Admin Dashboard regressions. Desktop
composition, route authority, sign-in behavior, theme persistence, other
Admin pages, new destinations, data, metrics, and redesign remain out of
scope.

## Review Contract assessment

| Row | Ticket authority | Required proof | CK evidence | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD008-01` | Outcome; Scope bullet 1; acceptance criterion 1 | Authenticated light/dark compact one-column layout at narrow and reflow widths, with no squeezed rail, clipping, or horizontal scroll and reachable identity/content. | Compose Playwright captures at `390x844` and `640x720`; browser document-width assertion; direct inspection of `aad-008-light-390-closed.png`, `aad-008-light-390-open.png`, `aad-008-dark-390-open.png`, and `aad-008-dark-640-reflow-open.png`. | `PROVEN` |
| `RC-AAD008-02` | Scope bullet 2; acceptance criterion 2 | Menu open, current-page close, backdrop close, and Escape close are keyboard operable; focus and body state are restored; no inaccessible overlay remains. | Authenticated browser assertions in `apps/atlas/tests/browser/admin-dashboard-compact-review.spec.mjs`; live Compose execution passed. | `PROVEN` |
| `RC-AAD008-03` | Scope bullet 2; acceptance criteria 1–2 | Labels, visible focus, non-color state cues, unavailable/disabled items, and compact identity/footer are accessible in both themes. | Light/dark authenticated assertions and direct screenshot inspection; `AdminShell.tsx` semantics and shared `:focus-visible` rule. | `PROVEN` |
| `RC-AAD008-04` | Scope bullet 2; acceptance criterion 2 | Reduced motion removes non-essential drawer motion and dismissal restores focus/body state. | Compose browser emulation of reduced motion, computed transition assertion `<= 0.001s`, Escape dismissal, and `aad-008-dark-640-reduced-motion-open.png`. | `PROVEN` |
| `RC-AAD008-05` | Scope bullet 3; explicit out-of-scope; validation handoff | Compact VIS review and rendered disposition are recorded without reopening desktop, authority, feature, or redesign work. | GO frontend-gate table, bounded diff, and this ticket-bounded review; no scope-change observation required. | `PROVEN` |
| `RC-AAD008-06` | Validation handoff | Viewport, theme/drawer, keyboard, reduced-motion, browser, lint, regression, build, and diff outcomes are recorded for independent review. | GO checkpoint plus the executed validation listed below; five named Compose captures. | `PROVEN` |

## Validation and rendered evidence

Executed during this review:

```text
corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-dashboard-compact-review.spec.mjs
# PASS

corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 10 tests, 0 failures

docker compose exec -T -e ATLAS_ADMIN_EMAIL -e ATLAS_ADMIN_PASSWORD atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-dashboard-compact-review.spec.mjs
# PASS: 1 test, 0 failures

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check -- apps/atlas/tests/browser/admin-dashboard-compact-review.spec.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-008-compact-navigation-visual-accessibility-review.md" "project's goal/feedback/AAD-008-go-checkpoint.md"
# PASS
```

The Compose service was healthy during the live browser run. The five named
captures were produced under the ignored Playwright result directory
`apps/atlas/test-results/admin-dashboard-compact-re-94e29-s-reflow-and-reduced-motion/`
and inspected directly. They show the compact menu in light and dark themes,
drawer overlay behavior, visible focus, disabled/coming-soon labels, identity
footer, and the 640 px reflow/reduced-motion states without visible clipping.

## Frozen Finding Closure Matrix

No `CK-###` finding is issued. Every applicable Review Contract row is
`PROVEN`; therefore there are no unresolved clauses or closure oracles to
freeze, and no CFC remediation is authorized or required.

## Scope-change observations

None. No ticket change, provider/runtime/deployment target, architecture or
product decision, policy resolution, or predecessor reopening is required.

## Decision

`PASS`. The committed AAD-008 checkpoint satisfies the frozen compact
navigation, interaction, accessibility, rendered-evidence, and validation
obligations. This CK record does not broaden scope or alter accepted truth.
