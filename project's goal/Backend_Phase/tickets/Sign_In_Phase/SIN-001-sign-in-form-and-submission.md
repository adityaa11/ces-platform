# SIN-001: Sign-in form and Better Auth submission

- **State:** `in_progress`
- **Review batch:** `SIN-BATCH-01`
- **Depends on:** BSS-004 `approved`; completed SUS ticket set `approved`/frozen
- **Baseline:** [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md) §§2–6, 21–24, 27–28; [Backend Phase README](../../README.md) authority rules; AC-01–AC-03 and AC-15

## Outcome

Replace the fixture-only `/sign-in` action with a dedicated browser form that submits existing email/password credentials to the mounted Better Auth endpoint, waits for an accepted response, and then navigates to `/home`.

## Scope

- Add `apps/atlas/components/SignInForm.tsx` as the client interaction boundary for email/password field state, submission state, request, bounded error state, and success navigation.
- Add `apps/atlas/components/sign-in-submission.ts` or an equivalent small helper for the same-origin request contract if that keeps request mapping independently testable.
- Integrate the form into `AuthScreen` only for `mode="sign-in"`.
- Submit JSON to `POST /api/auth/sign-in/email` with `{ email, password }` and same-origin credentials/cookie handling.
- Keep browser validation limited to obvious usability checks such as required email/password and a structurally valid email; Better Auth remains authoritative for credential correctness.
- Use a real submit button, prevent duplicate requests while pending, and navigate to `/home` only after the endpoint reports success.
- Map safe, bounded failures to an actionable user-facing message without rendering raw server, database, secret, password, cookie, or stack-trace details.
- Preserve the existing sign-up and reset-password presentation and links except for minimal shared composition required to make sign-in mode real.

Do not add a second auth route or Better Auth configuration. Do not query auth tables from the browser, compare password hashes in application code, persist credentials/tokens in browser storage, or add project/fixture calls to the sign-in flow.

## Acceptance criteria

- `/sign-in` renders labeled email and password controls and a real `Sign in` form-submit control; the old `href="/demo"` sign-in action is gone.
- The browser sends exactly the required credential payload to the same-origin `/api/auth/sign-in/email` endpoint and leaves cookies/session lifecycle under Better Auth.
- Navigation to `/home` occurs only after an accepted sign-in response; a failed response leaves the user on `/sign-in` and restores retryability.
- Pending submission prevents duplicate requests and exposes a normal disabled/loading state.
- Invalid credentials or representative auth failures do not create fake authenticated state, navigate to `/home`, reveal passwords or internals, or create another user.
- No `localStorage`, `sessionStorage`, URL token, custom auth cookie, JWT, access token, refresh token, or parallel session representation is introduced.
- Sign-up continues to use its approved behavior and reset-password remains structurally available; this ticket does not change the frozen sign-up destination.
- No project, workspace, membership, role, permission, fixture, or model/provider state is read or written by the sign-in UI.

## Validation

- Update the rendered HTML or equivalent route assertion to verify the sign-in form controls and the absence of the old demo-navigation action.
- Exercise success, failure, and duplicate-submit branches with the repository's current frontend/component test strategy or a focused equivalent.
- When the database-backed environment is available, make one request through the application auth route using a unique identity created through the approved auth boundary, then verify the normal session cookie; do not use a reusable fixed account.
- Run the sign-up and reset-password render checks, strict CSP/rendered HTML checks, and relevant app build/lint/type validation.
- Inspect the changed files for absence of password logging, direct password/hash handling, browser token persistence, custom session creation, fixture calls, and project-state writes.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SIN-001-01` Better Auth owns credential verification, identity, session persistence, and session cookies through the approved BSS-004 boundary.
- `BOUNDARY-SIN-001-02` Authentication establishes identity only; Atlas project authorization and fixture state remain separate.

### Trust boundaries

- `TRUST-SIN-001-01` User-entered email/password crosses from the browser form into the same-origin Better Auth endpoint.
- `TRUST-SIN-001-02` The endpoint response establishes the normal session cookie; browser navigation is downstream of that accepted response.

### Sensitive assets and identity context

- `ASSET-SIN-001-01` Passwords, cookies, auth headers, and auth failure details must not be logged, persisted, or rendered.
- `IDENTITY-SIN-001-01` Preserve request cookie handling and the Better Auth response contract so later policy can attach to the server-owned session without another token system.

### Required seams

- `SEAM-SIN-001-01` A dedicated client form isolates browser orchestration from Better Auth persistence and future auth-policy/error mapping.
- `SEAM-SIN-001-02` One success-navigation point after the accepted response preserves a future attachment point for session verification or policy.

### Prohibited couplings

- `COUPLING-SIN-001-01` Do not move credential verification, hashing, auth-table access, or session persistence into client/application presentation code.
- `COUPLING-SIN-001-02` Do not couple successful sign-in to `/demo`, fixture identity, project ownership, role assignment, or project API calls.

### Intentionally unresolved security policy

- `SEC-GAP-SIN-001-01` Abuse/rate-limit policy, recovery, email verification, MFA, and full route-protection policy remain future work; this ticket preserves the browser/server attachment points without inventing those controls.

### Mandatory review bindings

- `REV-READY-SIN-001-01`
  Ref: `SEAM-SIN-001-01`
  Question: Is sign-in browser orchestration isolated from auth persistence, project state, and authorization?
  Evidence: component/helper diff and success/failure/duplicate-submit tests.
- `REV-READY-SIN-001-02`
  Ref: `SEAM-SIN-001-02`
  Question: Can the browser reach `/home` only after Better Auth reports sign-in success?
  Evidence: navigation behavior and request/response tests.
- `REV-READY-SIN-001-03`
  Ref: `COUPLING-SIN-001-02`
  Question: Are fixture routes, project APIs, synthetic roles, and client-owned token/session paths absent?
  Evidence: changed-file review and route/render tests.

## Review checkpoint

- **Review question:** Does `/sign-in` collect existing credentials and submit them through the approved Better Auth boundary with bounded loading, success, and failure behavior while sign-up/reset-password remain intact?
- **Combined acceptance:** The real form uses the existing endpoint, establishes no client-owned auth truth, navigates only after success to `/home`, handles failure safely, and does not grant or invent Atlas project state.
- **Implementation commit:** Record when `SIN-BATCH-01` enters `awaiting_review`.
