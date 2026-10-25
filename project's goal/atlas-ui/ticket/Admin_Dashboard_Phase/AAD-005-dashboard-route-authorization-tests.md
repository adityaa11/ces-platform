# AAD-005: Prove Dashboard route authorization and protected rendering

- **State:** approved
- **Depends on:** [AAD-001](AAD-001-protected-dashboard-route.md), [AAD-002](AAD-002-admin-shell-and-welcome-ui.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 3 and 8](../../Atlas-admin-dashboard.md)

## Outcome

Provide focused automated evidence that `/admin/dashboard` is an independently
protected server route. This ticket proves route authority and protected
rendering only; verified sign-in navigation belongs to AAD-006 and compact UI
behavior belongs to AAD-004.

## Scope

- Extend the existing Admin guard, route, or browser suites at the smallest
  appropriate layers for direct Dashboard navigation and refresh.
- Exercise a valid persisted Super Admin session; absent, expired, and revoked
  sessions; an ordinary session; unavailable/unsealed persisted authority; and
  unexpected authorization-read failure.
- Assert a successful render receives the persisted authorized identity in the
  desktop welcome/header/sidebar, and that failed paths do not emit protected
  shell markup or identity-derived content.
- Assert the page does not request BSS or project-management data and that no
  public route gains an Admin entry link as a consequence of the route work.

## Explicitly out of scope

- Testing the Admin sign-in submission result, router replacement, duplicate
  sign-in handling, or identity-403 cleanup; AAD-006 owns those paths.
- Screenshot calibration, compact drawer behavior, keyboard/focus review, or
  theme review; AAD-007 and AAD-008 own rendered UI evidence.
- Re-testing Better Auth internals, provisioning/CLI behavior, provider
  management, or unrelated BSS/GHR/IDSER/Semantic suites.

## Acceptance criteria

- Direct navigation and refresh render only for a valid persisted Super Admin
  session. Missing, expired, and revoked sessions redirect to
  `/admin/sign-in`; ordinary and unavailable-authority sessions are denied
  server-side.
- Unexpected failures fail closed. No denied case exposes the shell, avatar,
  welcome name, or a fallback identity before resolution.
- The authorized persisted name—not prototype sample content—appears in every
  rendered identity location. The Dashboard makes no BSS/project API request.
- Targeted tests, changed-file lint, and production build are run where the
  environment permits, with exact commands and unrelated failures recorded.

## Validation handoff

Record test files, fixtures, commands, and route-result observations for
AAD-007/AAD-008 and independent review. A generic passing application suite is
not a substitute for every authorization outcome above.
