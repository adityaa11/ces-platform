# GO checkpoint: AAD-005 / Admin Dashboard Phase

- **Ticket:** `AAD-005`
- **Ticket authority:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-005-dashboard-route-authorization-tests.md`
- **Consumed predecessors:** AAD-001 `PASS` (`project's goal/feedback/AAD-001-33292e8-verification.md`) and AAD-002 `PASS` (`project's goal/feedback/AAD-002-60f6357-review.md`).
- **Implementation review target:** the commit that records this checkpoint.
- **Ticket state:** `awaiting_review`

## Bounded implementation

Extended the existing executable dashboard page-route harness only. Its valid
persisted-authority fixture now supplies a non-sample name and asserts that the
route passes that identity to the rendered welcome content, header avatar
label, and sidebar identity on both direct navigation and refresh. The harness
continues to exercise all named session denial, authority denial, and unexpected
failure branches and proves that those branches produce no protected render
output. A focused source-boundary assertion additionally records that the
Dashboard page has no BSS/project data-client dependency and that public entry
surfaces do not publish Admin links.

No production route, guard, shell, navigation, sign-in, theme, browser
behavior, public surface, BSS/project API, or other Admin module changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD005-01` | Outcome; Scope bullet 1; Acceptance criterion 1 | Direct Dashboard navigation and refresh render only for a valid persisted Super Admin session, with the persisted identity in the desktop welcome, header avatar, and sidebar. | `apps/atlas/tests/admin-dashboard-route-level.test.mjs`, `the dashboard page renders the persisted identity on direct GET and refresh`, invokes the page twice with `Persisted Atlas Admin` and asserts the welcome name, avatar accessible name, sidebar identity, request-header read, and Worker close. | `PROVEN` |
| `RC-AAD005-02` | Scope bullet 2; Acceptance criterion 1 | Missing, expired, and revoked sessions redirect to `/admin/sign-in` without protected output. | `apps/atlas/tests/admin-dashboard-route-level.test.mjs`, `the dashboard page redirects every named session-denial condition without Admin output`, covers `missing`, `expired`, and `revoked` (plus the established failed-session branch), asserting redirect, null HTML, and Worker cleanup. | `PROVEN` |
| `RC-AAD005-03` | Scope bullet 2; Acceptance criteria 1–2 | Ordinary and unavailable/unsealed persisted authority sessions are denied server-side and reveal no shell or identity content. | The same route-level harness test, `the dashboard page denies ordinary and unavailable authority without protected output`, covers both cases and asserts a framework-level forbidden result, null HTML, and cleanup. | `PROVEN` |
| `RC-AAD005-04` | Scope bullet 2; Acceptance criterion 2 | An unexpected authorization-read failure fails closed before protected shell or fallback identity output. | `apps/atlas/tests/admin-dashboard-route-level.test.mjs`, `the dashboard page fails closed on an unexpected authorization failure`, asserts propagated `database unavailable`, null HTML, and cleanup. | `PROVEN` |
| `RC-AAD005-05` | Scope bullets 3–4; Acceptance criterion 3 | The protected page requests no BSS/project data, and the route work adds no public Admin entry link. | `apps/atlas/tests/admin-dashboard-route.test.mjs`, `public routes do not expose an Admin entry point and the dashboard page has no data-client dependency`, rejects data-client patterns in the page and Admin Dashboard/sign-in links or Admin Console copy in `PublicHeader` and public landing, home, sign-in, and sign-up routes. | `PROVEN` |
| `RC-AAD005-06` | Acceptance criterion 4; Validation handoff | Targeted route evidence, changed-file lint, production build, and a clean bounded diff are recorded for independent review and AAD-007/AAD-008. | All commands below passed; the route-level file and harness identify the fixtures and observable outcomes. | `PROVEN` |

Validation commands and outcomes:

```text
corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 10 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/route-harness/admin-dashboard-components.mjs
# PASS

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check -- apps/atlas/tests/admin-dashboard-route.test.mjs apps/atlas/tests/admin-dashboard-route-level.test.mjs apps/atlas/tests/route-harness/admin-dashboard-components.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-005-dashboard-route-authorization-tests.md" "project's goal/feedback/AAD-005-go-checkpoint.md"
# PASS
```

The existing `admin-dashboard-route-level.test.mjs` fixture is deliberately the
smallest page-route harness: it executes the compiled server page and replaces
only its framework/auth and client-only presentation boundaries. The AAD-002
component assertions continue to bind the passed name to the actual shell and
welcome components. Its fixture, scenario names, protected-render observations,
and passing command are the handoff evidence for AAD-007 and AAD-008.

Internal readiness: `READY_FOR_CK`
