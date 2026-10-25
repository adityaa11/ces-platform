# GO checkpoint: AAD-007 / Admin Dashboard Phase

- **Ticket / batch:** `AAD-007` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-007-desktop-dashboard-visual-accessibility-review.md`
- **Dependencies consumed:** AAD-002 CK `PASS` (`60f6357`), AAD-005 CK `PASS` (`23d769c`)
- **Implementation state:** `awaiting_review`

## Bounded change

Added `apps/atlas/tests/browser/admin-dashboard-desktop-review.spec.mjs`, a
real authenticated Dashboard browser review. It signs in using the existing
local Super Admin fixture, checks the server-provided name reaches the
Dashboard, and exercises only the welcome heading's rendered long-name fit
policy without mutating durable identity data. The test records full-page
light and dark screenshots at `1440x1000`, plus dark constrained desktop
evidence at `900x1000`; Playwright keeps those generated artifacts in its
ignored `test-results` output. No production Dashboard behavior, route
authority, theme persistence mechanism, or compact-drawer behavior changed.

## Rendered evidence

| Viewport / theme | Observed desktop result |
| --- | --- |
| `1440x1000` light | Persistent 224 px rail and 64 px topbar frame a quiet, bounded welcome surface. Administration context and the welcome heading dominate; navigation, identity, and unavailable items remain supporting context. |
| `1440x1000` dark | The same hierarchy, tokenized surfaces, selection treatment, disabled/coming-soon cues, and visible keyboard focus are retained. |
| `900x1000` dark | The desktop rail remains persistent; the realistic long heading wraps over multiple readable lines with no document horizontal overflow. |

The generated images are `aad-007-light-1440.png`, `aad-007-dark-1440.png`,
and `aad-007-dark-900.png` under the Playwright result for the AAD-007 browser
test. GO inspected those rendered images directly. Compact behavior was not
treated as a closure condition; it remains AAD-008-owned.

## Frontend review gate

| Gate | Disposition | Evidence |
| --- | --- | --- |
| VIS-001–003 | PASS | Reuses the accepted Atlas shell and minimal workspace-welcome pattern; no new local visual language or dashboard metrics. |
| VIS-004–006 | PASS | Semantic shared tokens/type roles remain in the scoped Admin CSS; surfaces communicate hierarchy; long heading wraps without clipping. |
| VIS-007–009 | PASS | No competing primary action; active, unavailable, disabled, hover, selected, and keyboard-focus states remain explicit. |
| VIS-010 (desktop) | PASS | At 1440 px and constrained 900 px desktop widths, the 224 px rail persists and document width does not overflow. Compact transformation is intentionally excluded. |
| VIS-011 | PASS | Native landmarks and controls, accessible names, `aria-current`, unavailable/disabled semantics, and a 3 px visible focus outline are asserted in the authenticated render. |
| VIS-012–014 | PASS | The restrained, medium-density Admin Console remains visually consistent, with no decorative expansion. |
| VIS-015 | PASS | Shared `ThemeProvider` selection, persisted `atlas-theme`, light/dark selected controls, hierarchy, and semantic status cues are exercised in the real route. |

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD007-01` | Outcome; Scope bullets 1 and 3; acceptance criterion 1 | Authenticated desktop composition preserves the supplied prototype's quiet hierarchy, 64 px topbar, 224 px rail, bounded main region, and restrained welcome surface. | `AdminShell.tsx` and `globals.css` accepted interfaces; authenticated browser screenshots at 1440 light/dark and 900 dark; focused route/UI regression command below. | `PROVEN` |
| `RC-AAD007-02` | Scope bullet 2; acceptance criterion 2 | Theme controls continue through the shared provider and both themes retain equivalent hierarchy, readable tokenized states, and existing preference persistence. | `admin-dashboard-desktop-review.spec.mjs` clicks both controls, asserts `data-theme`, pressed state, and `atlas-theme`; `admin-dashboard-ui.test.mjs` guards `useTheme`/semantic-token use. | `PROVEN` |
| `RC-AAD007-03` | Scope bullet 3; acceptance criterion 2 | Desktop landmarks, labels, focus visibility, current-page state, disabled/coming-soon semantics, and non-color status cues are accessible. | Authenticated browser assertions cover banner/complementary/main landmarks, navigation `aria-current`, visible coming-soon label, native disabled buttons, and keyboard-tab 3 px focus outline. | `PROVEN` |
| `RC-AAD007-04` | Scope bullet 1; acceptance criterion 3 | Realistic long names and an equivalent 200%-zoom constrained desktop width remain understandable without clipping or horizontal overflow. | Browser test applies a realistic long-name rendering fixture to the AAD-005-proven authorized-name heading, captures 1440/900 viewports, and asserts document-width equality. | `PROVEN` |
| `RC-AAD007-05` | Scope bullets 3–4; explicit out-of-scope; validation handoff | Required VIS desktop gate is recorded; desktop-only review does not introduce compact, authority, feature, or redesign scope. | Frontend-gate table above; bounded diff contains review evidence only; AAD-008 compact concerns remain diagnostic/out of scope. | `PROVEN` |
| `RC-AAD007-06` | Scope bullet 4; validation handoff | Exact screenshot/viewport, theme, keyboard-focus, semantic, lint, targeted regression, and build outcomes are durable for independent review. | Commands and outcomes below; screenshot names and inspection observations above. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-dashboard-desktop-review.spec.mjs
# PASS

corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 10 tests, 0 failures

docker compose exec -T -e ATLAS_ADMIN_EMAIL=<local credential> -e ATLAS_ADMIN_PASSWORD=<local credential> atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-dashboard-desktop-review.spec.mjs
# PASS: 2 tests, 0 failures

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check
# PASS
```

## Scope and limitations

The local Compose image was rebuilt before rendered validation because its
previous image contained pre-AAD-003 sign-in behavior; the rebuilt service
uses the current workspace source. Chromium was installed only as the
repository-documented test prerequisite in that ephemeral Compose container.
The resulting production source change is limited to the browser review test,
the frozen ticket state, and this checkpoint. No compact-drawer review is
claimed.

Internal readiness: READY_FOR_CK
