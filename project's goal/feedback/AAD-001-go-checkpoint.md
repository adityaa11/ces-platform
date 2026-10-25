# GO checkpoint: AAD-001 / Admin Dashboard Phase

- **Ticket:** `AAD-001`
- **Ticket authority:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-001-protected-dashboard-route.md`
- **Consumed predecessor:** AA-006 `PASS`, as recorded in `project's goal/feedback/AA-BATCH-06-0ff052ce-verification.md`.
- **Implementation review target:** `652af9ba6666469da2e863d4b6e748291ce1dedf` (`feat(atlas): add protected admin dashboard route`)
- **Ticket state:** `awaiting_review`

## Bounded implementation

Added only the server page at `/admin/dashboard`, its focused route-composition
test, and direct negative coverage for the accepted Admin guard. The page
obtains request headers and the existing auth service, applies
`createAtlasAdminGuard(service.auth.api.getSession,
createPersistedAdminAuthorizationReader(service.db))`, renders the authorized
identity only after that succeeds, redirects 401 access failures to
`/admin/sign-in`, and uses Vinext's supported `forbidden()` result for 403
access failures. Its Worker service lifecycle closes in `finally`.

The rendered placeholder is intentionally minimal. It is not an Admin shell,
does not fetch an identity client-side, and does not introduce a new API or
presentation authority. AAD-002 remains responsible for the reusable shell;
AAD-005 is the identified route-level harness owner for full success,
redirect, forbidden, and fail-closed transport scenarios.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
|---|---|---|---|---|
| `RC-AAD001-01` | Outcome; Scope bullets 1–3; Acceptance bullets 1 and 4 | Direct page route resolves headers and uses the established persisted server guard before protected content receives `AtlasAdminIdentity`. | `apps/atlas/app/admin/dashboard/page.tsx`; `apps/atlas/tests/admin-dashboard-route.test.mjs`; production build route inventory. | PROVEN |
| `RC-AAD001-02` | Outcome; Scope bullets 4–5; Acceptance bullet 2 | Missing or session-resolution-failed access becomes a 401 guard error and the page redirects it to `/admin/sign-in` before rendering content. | `apps/atlas/tests/admin-guard.test.mjs` exercises missing and thrown session resolution; `admin-dashboard-route.test.mjs` asserts the 401 redirect branch. | PROVEN |
| `RC-AAD001-03` | Outcome; Scope bullet 5; Acceptance bullet 3 | An authenticated caller lacking the persisted sealed Super Admin authority gets the framework-supported server forbidden result and no placeholder/identity output. | `admin-guard.test.mjs` exercises an ordinary-user 403; `admin-dashboard-route.test.mjs` asserts the `forbidden()` branch occurs before JSX construction. | PROVEN |
| `RC-AAD001-04` | Outcome; Scope bullet 5; Acceptance bullets 3–4 | Unexpected authorization/database failures have no fallback identity or protected render path. | `admin-guard.test.mjs` asserts authorization-read failure propagates; route test forbids client identity sources and the page rethrows non-access errors. | PROVEN |
| `RC-AAD001-05` | Scope bullet 6; Acceptance bullet 5 | Worker-backed auth service closes on every authorization result path. | `page.tsx` `finally` branch asserted by `admin-dashboard-route.test.mjs`; implementation follows the accepted home and identity-route lifecycle. | PROVEN |
| `RC-AAD001-06` | Explicitly out of scope; Validation handoff | No parent layout guard, client protection, identity endpoint, shell, sign-in navigation, or other Admin module is added; the smallest source-level route test is identified for AAD-005's transport-level expansion. | Bounded commit diff; `admin-dashboard-route.test.mjs` negative source assertions; ticket GO validation record. | PROVEN |

Validation commands and outcomes:

```text
pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-guard.test.mjs tests/auth-boundary.test.mjs
# PASS: 12 tests, 0 failures

pnpm --filter @atlas/app exec eslint app/admin/dashboard/page.tsx tests/admin-dashboard-route.test.mjs tests/admin-guard.test.mjs
# PASS

pnpm --filter @atlas/app build
# PASS: production build route inventory includes /admin/dashboard

git diff --check -- apps/atlas/app/admin/dashboard/page.tsx apps/atlas/tests/admin-dashboard-route.test.mjs apps/atlas/tests/admin-guard.test.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-001-protected-dashboard-route.md"
# PASS
```

### Environment note

A local `vinext start` smoke request was not used as acceptance evidence: the
production-started local server did not load the development bindings and
returned 500. It did not affect the focused server-composition evidence above;
AAD-005 owns a configured route-level harness for the actual transport cases.

Internal readiness: READY_FOR_CK
