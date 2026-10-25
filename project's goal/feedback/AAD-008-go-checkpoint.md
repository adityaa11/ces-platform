# GO checkpoint: AAD-008 / Admin Dashboard Phase

- **Ticket / batch:** `AAD-008` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-008-compact-navigation-visual-accessibility-review.md`
- **Dependencies consumed:** AAD-004 CK `PASS` (`47ef0f1`), AAD-005 CK `PASS` (`23d769c`)
- **Implementation state:** `awaiting_review`

## Bounded change

Added `apps/atlas/tests/browser/admin-dashboard-compact-review.spec.mjs`, an authenticated browser review of the existing compact Admin navigation. It uses the local Compose `atlas` service and local credential environment only; it does not alter account, identity, route, theme, or drawer implementation state. The test captures ignored Playwright screenshots for compact light and dark states, a 640 px reflow equivalent, and reduced motion. No production Dashboard source changed.

## Rendered evidence

| Viewport / theme / state | Observed result |
| --- | --- |
| `390x844`, light, drawer closed | The compact header exposes a labeled menu control with visible keyboard focus. The desktop rail is absent, the main surface is one column, and document width does not overflow. |
| `390x844`, light, drawer open | The drawer is a complete overlay rail with Dashboard selection, visible `Coming soon` text, disabled destinations, reachable identity footer, and an exposed backdrop. |
| `390x844`, dark, drawer open | Drawer hierarchy, selected-state outline, unavailable label, disabled-state cues, identity footer, and backdrop remain readable and non-color-dependent. |
| `640x720`, dark, drawer open | The compact overlay and bounded one-column content remain usable at the 200%-zoom equivalent reflow width without horizontal overflow or clipping. |
| `640x720`, dark, reduced motion | The open drawer has no perceptible transition (computed duration at or below `0.001s`) and Escape restores the menu focus and body scroll state. |

The generated images are `aad-008-light-390-closed.png`, `aad-008-light-390-open.png`, `aad-008-dark-390-open.png`, `aad-008-dark-640-reflow-open.png`, and `aad-008-dark-640-reduced-motion-open.png` under the ignored Playwright result for this browser test. GO inspected each final settled capture directly.

## Frontend review gate

| Gate | Disposition | Evidence |
| --- | --- | --- |
| VIS-001–007 | PASS | The accepted Atlas Admin shell and minimal workspace-welcome pattern remain unchanged; compact review adds no local visual language, data, metrics, or competing action. |
| VIS-008–009 | PASS | `aria-expanded`, `aria-current`, visible `Coming soon` text, native disabled buttons, light/dark selected treatment, keyboard focus, current-page close, backdrop close, and Escape close are exercised in the authenticated render. |
| VIS-010 | PASS | At 390 px and the 640 px 200%-zoom-equivalent reflow width, the desktop rail becomes an overlay drawer and the document has no horizontal overflow. |
| VIS-011 | PASS | Native control/link semantics, menu and navigation labels, focus movement/restoration, Shift+Tab trapping, body-lock cleanup, disabled-state semantics, and reduced-motion behavior are asserted in the real route. |
| VIS-012–014 | PASS | The existing calm, medium-density Admin Console personality, bounded surfaces, and restrained hierarchy remain intact. |
| VIS-015 | PASS | Light and dark authenticated compact renders retain the same hierarchy and semantic state cues through the shared theme authority. |

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD008-01` | Outcome; Scope bullet 1; acceptance criterion 1 | Both themes render a usable compact one-column layout: no squeezed persistent rail, clipping, or horizontal scroll; identity and content remain reachable. | Authenticated 390 px light/dark and 640 px reflow screenshots; browser assertion compares document scroll/client widths; final captures inspected directly. | `PROVEN` |
| `RC-AAD008-02` | Scope bullet 2; acceptance criterion 2 | Menu, current-page, backdrop, and Escape dismissal are keyboard operable; focus/body state are restored and no inaccessible overlay remains. | `admin-dashboard-compact-review.spec.mjs` opens with the menu, asserts drawer focus and Shift+Tab containment, then asserts current-page, backdrop, and Escape dismissal plus menu focus/body cleanup. | `PROVEN` |
| `RC-AAD008-03` | Scope bullet 2; acceptance criteria 1–2 | Labels, visible focus, non-color state cues, unavailable/disabled items, and compact identity/footer remain accessible in both themes. | Authenticated light/dark drawer assertions and final screenshots cover menu labels, `aria-expanded`, `aria-current`, `Coming soon`, native disabled buttons, selected outline, and the identity footer. | `PROVEN` |
| `RC-AAD008-04` | Scope bullet 2; acceptance criterion 2 | Reduced motion disables non-essential drawer motion and dismissal restores focus/body state. | Browser review emulates reduced motion, observes computed transition duration at or below `0.001s`, then uses Escape and verifies restored menu focus and unlocked body. | `PROVEN` |
| `RC-AAD008-05` | Scope bullet 3; explicit out-of-scope; validation handoff | Applicable compact VIS gates and rendered findings are recorded without reopening desktop, authority, feature, or redesign work. | Frontend-gate table and capture inventory above; bounded diff adds compact review evidence only. No non-blocking finding remains. | `PROVEN` |
| `RC-AAD008-06` | Validation handoff | Exact viewport, theme, interaction, reduced-motion, browser, lint, regression, and build outcomes are durable for independent review. | Commands and outcomes below; screenshots retained in ignored Playwright output. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-dashboard-compact-review.spec.mjs
# PASS

docker compose exec -T -e ATLAS_ADMIN_EMAIL -e ATLAS_ADMIN_PASSWORD atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-dashboard-compact-review.spec.mjs
# PASS: 1 test, 0 failures

corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 10 tests, 0 failures

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check -- apps/atlas/tests/browser/admin-dashboard-compact-review.spec.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-008-compact-navigation-visual-accessibility-review.md" "project's goal/feedback/AAD-008-go-checkpoint.md"
# PASS
```

## Scope and limitations

The browser review ran inside the Compose `atlas` service, matching the historical AAD-007 execution boundary. The host machine also has a separate IPv6 `localhost:3001` Node listener, so host-browser runs are not evidence for the Compose service; no production or deployment configuration was changed to address that local tooling condition.

Internal readiness: READY_FOR_CK
