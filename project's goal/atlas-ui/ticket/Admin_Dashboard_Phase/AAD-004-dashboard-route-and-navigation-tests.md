# AAD-004: Prove Dashboard authorization, handoff, and isolation

- **State:** proposed
- **Depends on:** [AAD-001](AAD-001-protected-dashboard-route.md), [AAD-002](AAD-002-admin-shell-and-welcome-ui.md), [AAD-003](AAD-003-verified-sign-in-dashboard-handoff.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, section 8](../../Atlas-admin-dashboard.md)

## Outcome

Provide focused automated evidence that the Admin Dashboard is an independently
protected server route, accepts only persisted Super Admin authority, receives
the verified sign-in handoff, and does not alter public authentication.

## Scope

- Add focused unit/integration/browser coverage at the smallest appropriate
  layers. Extend the existing Admin guard, identity, sign-in, and browser test
  suites rather than building a disconnected fixture system.
- Exercise direct route success and refresh with a valid Super Admin session;
  redirect for absent/expired/revoked sessions; forbidden behavior for an
  ordinary session and unavailable persisted authority; and fail-closed
  unexpected authorization reads.
- Assert the rendered welcome/sidebar identity is the persisted authorized
  Admin identity, not sample prototype content.
- Update browser sign-in coverage to expect Dashboard replacement after a
  verified Admin identity. Prove invalid credentials, 401, 403, malformed
  identity, network/server error, and duplicate submit do not navigate.
- Verify Dashboard has no BSS/project-management API request, no unauthorized
  shell flash, no public Admin entry link, and no regression to public
  sign-in/sign-up/home behavior.

## Explicitly out of scope

- Re-testing Better Auth internals, provisioning/CLI behavior, provider
  management, or unrelated BSS/GHR/IDSER/Semantic suites.
- Screenshot-driven visual calibration, detailed keyboard review, or manual
  accessibility disposition; these belong to AAD-005.
- Fixing unrelated current repository failures solely to produce a green
  global build.

## Acceptance criteria

- Tests cover every authorization outcome named in the dashboard brief and
  prove protected markup/identity is absent before failed authorization paths
  resolve.
- A successful verified Admin sign-in reaches `/admin/dashboard`; success at
  the Better Auth endpoint alone does not suffice.
- Dashboard refresh remains authorized through the existing session; public
  routes retain their own behavior and gain no Admin navigation.
- Targeted tests, changed-file lint, and application production build are run
  where environment permits. Report actual commands and results, separating
  unrelated pre-existing failures.

## Validation handoff

Record test files, command output summary, fixtures/environment needs, and
any residual failure for AAD-005 and independent review.
