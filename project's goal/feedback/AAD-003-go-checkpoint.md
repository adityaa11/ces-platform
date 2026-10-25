# GO checkpoint: AAD-003

- **Ticket / batch:** `AAD-003` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-003-verified-sign-in-dashboard-handoff.md`
- **State:** `awaiting_review`
- **Accepted predecessor:** AAD-001 `PASS` (`project's goal/feedback/AAD-001-33292e8-verification.md`)

## Bounded implementation

`AdminSignIn` now obtains the repository-standard Next router and calls
`router.replace("/admin/dashboard")` only after
`createAdminSignInSubmission(...).submit(...)` returns `{ kind: "authorized" }`.
It no longer leaves a local success message on `/admin/sign-in`. The existing
submission authority remains unchanged: it validates credentials, performs the
ordered Better Auth sign-in and guarded identity request, coalesces duplicate
submissions, preserves generic feedback, and performs best-effort sign-out for
identity `403` responses. The independently server-protected dashboard route is
unchanged.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD003-01` | Outcome; Scope bullets 1–3; Acceptance criterion 1 | Navigation happens only after the existing submission authority returns a verified `authorized` Admin identity. | `AdminSignIn.tsx` awaits `submit()` and its sole authorized branch calls `router.replace("/admin/dashboard")`; focused boundary test checks the router contract and retains the ordered POST then GET proof. | `PROVEN` |
| `RC-AAD003-02` | Scope bullet 4; Acceptance criteria 2–3 | Failed validation, sign-in, `401`, `403`, malformed identity, and network/server verification failures stay on the sign-in page; `403` cleanup and duplicate coalescing remain. | Unchanged `admin-sign-in-submission.ts` behavior exercised by `tests/auth-boundary.test.mjs`: forbidden cleanup, `401`, malformed/non-admin identity, two-request ordered authorized flow, and duplicate promise coalescing all pass. Component navigation is structurally limited to the authorized branch. | `PROVEN` |
| `RC-AAD003-03` | Acceptance criterion 4; primary-source section 6 | Direct dashboard access remains independently server-authorized rather than trusting client navigation. | AAD-001 final verification records page-level success, refresh, denial, and fail-closed route evidence; this checkpoint does not change `app/admin/dashboard/page.tsx`. | `PROVEN` |
| `RC-AAD003-04` | Explicitly out of scope; Acceptance criterion 5 | No router state, query data, browser persistence, credential/identity logging, public-auth change, or authentication/authorization endpoint change is introduced. | Bounded diff changes only `AdminSignIn.tsx`, its focused boundary test, ticket state, and this checkpoint; test forbids storage, cookies, and console logging in the Admin sign-in boundary. | `PROVEN` |
| `RC-AAD003-05` | Validation handoff | Replace the old stay-on-sign-in success expectation and preserve evidence for success redirect, non-navigation failures, and duplicate submission behavior for AAD-006. | `tests/auth-boundary.test.mjs` now asserts the verified-only replacement and no local success state, while its existing executable scenarios prove failed verification and duplicate coalescing. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/app exec node --test tests/auth-boundary.test.mjs
# PASS: 9 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx tests/auth-boundary.test.mjs
# PASS

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard and /admin/sign-in
```

No unrelated dirty or untracked workspace material was included. The required
AAD-006 focused navigation-test ticket remains the successor evidence lane;
this checkpoint records the narrowed component handoff and does not self-issue
`PASS`.

Internal readiness: READY_FOR_CK.
