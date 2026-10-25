# CK review: AAD-006 / Admin Dashboard Phase

- **Ticket / batch:** `AAD-006` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-006-verified-sign-in-navigation-tests.md`
- **Reviewed commit:** `93869b9fb7ee4194e876919eb3fe374af55fc3b4` (`test(atlas): prove AAD-006 sign-in navigation`)
- **GO checkpoint:** `project's goal/feedback/AAD-006-go-checkpoint.md`
- **Ticket state at review:** `awaiting_review`
- **Review type:** first CK review
- **Result:** `PASS`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely and is `awaiting_review`. The GO
checkpoint is committed in the reviewed `HEAD` (`93869b9f`); its implementation,
ticket, checkpoint, and focused-test paths are clean. The worktree contains
unrelated tracked and untracked material, but none overlaps the AAD-006 review
boundary, so the committed target is unambiguous.

This review covers the complete AAD-006 contract: verified-only Admin
navigation, the named failure and duplicate-submit outcomes, retained 403
cleanup, public sign-in/sign-up/home regressions, validation handoff, and the
explicit scope exclusions. The accepted AAD-003 submission and Dashboard
authorization authorities remain closed predecessor work and are not reopened.

## Review Contract assessment

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD006-01` | Outcome; Scope bullet 2; Acceptance criterion 1 | Credentials, Better Auth success, and Admin identity verification occur in order; Better Auth success alone cannot navigate; only a valid `{ kind: "authorized" }` result causes exactly one Dashboard replacement. | `apps/atlas/components/AdminSignIn.tsx:85` has the sole authorized `router.replace("/admin/dashboard")` branch. `apps/atlas/components/admin-sign-in-submission.ts:45-84` performs POST then identity GET and validates the Admin identity. `tests/auth-boundary.test.mjs` proves the ordered calls and result kind; `tests/browser/admin-sign-in-navigation.spec.mjs` proves one Dashboard navigation request for the valid intercepted identity. | `PROVEN` |
| `RC-AAD006-02` | Scope bullet 3; Acceptance criterion 2 | Invalid credentials, validation failure, identity `401`, identity `403` with best-effort sign-out, malformed identity, network/server error, and duplicate submit remain on Admin sign-in with generic feedback. | `tests/auth-boundary.test.mjs` covers the complete submission matrix, 403 cleanup, and promise coalescing. `tests/browser/admin-sign-in-navigation.spec.mjs` covers invalid credentials, identity `401`, `403`, malformed identity, server failure, disabled pending control, one POST/GET sequence, generic feedback, and no Dashboard navigation. `tests/browser/admin-sign-in-local-form.spec.mjs` retains the client validation and focus assertions; its real-credential phase is blocked only by the configured local credentials being rejected. | `PROVEN` |
| `RC-AAD006-03` | Scope bullet 4; Acceptance criterion 3 | Public sign-in, sign-up, and home navigation remain unchanged. | `tests/browser/admin-sign-in-navigation.spec.mjs` visits public sign-in and sign-up, verifies their established headings and controls, preserves each URL, and confirms no Admin entry link. `tests/auth-boundary.test.mjs` continues to prove public sign-in navigation to `/home` and established sign-up success navigation without changing public-auth implementation. | `PROVEN` |
| `RC-AAD006-04` | Validation handoff | Router/submission locations, result matrix, public-auth regressions, commands, actual results, and the environment limitation are recorded for independent review. | The GO checkpoint records all required locations, commands, results, and the real-credential limitation. The committed diff is limited to AAD-006 tests, ticket state, and the GO checkpoint; `git diff --check HEAD^ HEAD --` over the bounded paths passes. | `PROVEN` |

## Validation and evidence

Executed at the reviewed checkout:

```text
corepack pnpm --filter @atlas/app exec node --test tests/auth-boundary.test.mjs
# PASS: 10 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint tests/auth-boundary.test.mjs tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-navigation.spec.mjs
# PASS

corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-navigation.spec.mjs
# PASS: 4 tests, 0 failures

corepack pnpm --filter @atlas/app build
# PASS: production build; route inventory includes /admin/dashboard and /admin/sign-in

corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs
# ENVIRONMENT LIMITATION: FAIL — configured local Admin credentials were rejected; the page remained at /admin/sign-in and no verified session was available for the real-credential Dashboard assertion.

git diff --check HEAD^ HEAD -- apps/atlas/components/AdminSignIn.tsx apps/atlas/components/admin-sign-in-submission.ts apps/atlas/tests/auth-boundary.test.mjs apps/atlas/tests/browser/admin-sign-in-navigation.spec.mjs apps/atlas/tests/browser/admin-sign-in-local-form.spec.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-006-verified-sign-in-navigation-tests.md" "project's goal/feedback/AAD-006-go-checkpoint.md"
# PASS
```

The real-credential failure is an unavailable local accepted Admin session,
not a failure of the ticket-specific mocked endpoint or component contract.
No application authentication, identity endpoint, session, public-auth, or
Dashboard authorization code changed. No direct in-scope regression was
identified.

## Frozen Finding Closure Matrix

No ticket-bound deficiency was identified during this first review; therefore
there are no `CK-###` findings or closure clauses to freeze. The four proven
Review Contract rows above are the complete AAD-006 review scope.

## Scope-change observations

None. Direct Dashboard authorization, denied route rendering, protected
markup, dashboard data requests, shell UI, drawer behavior, visual review, and
authentication/session implementation remain outside AAD-006 as explicitly
specified by the frozen ticket.

## Decision

`PASS`. The committed AAD-006 work satisfies every applicable ticket-derived
Review Contract row, the required focused validation passes, the recorded
environment limitation is bounded to the optional real-credential session,
and no direct regression remains. This CK artifact does not authorize
successor implementation or visual review.
