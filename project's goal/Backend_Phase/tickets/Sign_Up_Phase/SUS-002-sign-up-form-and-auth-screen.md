# SUS-002: Sign-up form and AuthScreen integration

- **State:** `planned`
- **Review batch:** `SUS-BATCH-02`
- **Depends on:** SUS-001 `PASS`
- **Baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) §§3–5, 9–14, 17–18, 20–21, 25–26; [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md) §§2.1, 4.1, 8, 9.2, 9.4; AC-04–AC-06 and AC-12

## Outcome

Replace the fixture-only `/sign-up` action with a dedicated client form that submits the user-provided name, email, and password to the same-origin Better Auth endpoint, waits for a successful response, and then navigates to `/demo`.

## Scope

- Add `apps/atlas/components/SignUpForm.tsx` as a client-side interaction component owning field state, submission state, request, safe error state, and success navigation only.
- Integrate the form into `AuthScreen` only for `mode="sign-up"` while preserving the current sign-in and reset-password presentation/behavior.
- Render labeled `name`, `email`, and `password` fields with appropriate `required`, `type`, and autocomplete semantics.
- Submit JSON to `POST /api/auth/sign-up/email` with `{ name, email, password }` using the same-origin browser request.
- Use a real `<button type="submit">`; disable it while submitting and prevent duplicate submissions.
- On accepted success, navigate to `/demo`; on failure, remain on `/sign-up`, restore submission, and display a concise user-facing message without raw server details.
- Keep cookies/session truth under Better Auth; do not read, write, or mirror session tokens in browser storage or React state.

Do not wire sign-in, sign-out, reset-password, route guards, project authorization, project creation, or fixture membership in this ticket.

## Acceptance criteria

- `/sign-up` visibly contains `Name`, `Email`, `Password`, and `Create account`.
- Name is required and is submitted exactly as user input; no email-derived, random, empty, or fixed synthetic name is generated.
- The create-account control is a form submit control, not a link to `/demo`.
- The browser calls the same-origin `/api/auth/sign-up/email` endpoint with the required JSON contract and does not manually manage authentication tokens or cookies.
- Navigation to `/demo` occurs only after the endpoint reports success.
- While submitting, duplicate submission is prevented and the control is visibly unavailable through normal disabled/loading behavior.
- Failed sign-up leaves the user on `/sign-up`, allows retry, and does not render passwords, cookies, secrets, SQL, stack traces, or raw internal exception details.
- Sign-in and reset-password screens remain structurally and behaviorally unchanged except for any minimal shared composition needed to support the sign-up mode.
- No inline script, external auth script, `unsafe-inline`, or `unsafe-eval` workaround is introduced.

## Validation

- Update the rendered HTML test or equivalent route assertion to verify the sign-up title, name/email/password fields, form submit control, and absence of the old `/demo` action link.
- Exercise the component's success and failure branches with the repository's current app test strategy or a focused equivalent; verify pending state prevents duplicate requests and failure restores retryability.
- Render `/sign-in` and `/reset-password` and assert their existing controls/links remain unchanged in the ways covered by the current suite.
- Run the existing strict CSP/rendered HTML suite and confirm the sign-up client behavior does not weaken CSP.
- Run the app build/lint checks relevant to the changed components.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SUS-002-01` Better Auth owns credential processing, session cookies, and identity persistence; the client consumes the HTTP contract only.
- `BOUNDARY-SUS-002-02` An authenticated identity is not Atlas project authorization and does not create project state.

### Trust boundaries

- `TRUST-SUS-002-01` User-entered credentials cross from the browser form into the same-origin Better Auth endpoint.
- `TRUST-SUS-002-02` A server success response establishes the session cookie; the client may navigate only after the response is accepted.

### Sensitive assets and identity context

- `ASSET-SUS-002-01` The password must exist only for the request path and must not be logged, persisted in browser storage, or included in error rendering.
- `IDENTITY-SUS-002-01` Preserve the browser's cookie handling and the endpoint's response contract so identity remains server/session controlled.

### Required seams

- `SEAM-SUS-002-01` Keep sign-up interaction in a dedicated client component so future auth policy/error mapping can evolve without moving database or authorization logic into the UI.
- `SEAM-SUS-002-02` Keep success navigation downstream of the accepted endpoint response so later session verification or policy can attach at one point.

### Prohibited couplings

- `COUPLING-SUS-002-01` Do not store tokens or session identities in `localStorage`, `sessionStorage`, URL parameters, custom cookies, or durable React/application state.
- `COUPLING-SUS-002-02` Do not synthesize identity data, call project APIs, or navigate as if authenticated before Better Auth succeeds.

### Intentionally unresolved security policy

- `SEC-GAP-SUS-002-01` Detailed client-side abuse controls, email verification, account recovery, and route-protection policy remain future work; browser validation is UX assistance only and not authoritative.

### Mandatory review bindings

- `REV-READY-SUS-002-01`
  Ref: `SEAM-SUS-002-01`
  Question: Is browser interaction isolated in the sign-up component without database, project, or authorization logic?
  Evidence: component diff and rendered/component tests.
- `REV-READY-SUS-002-02`
  Ref: `SEAM-SUS-002-02`
  Question: Can the UI reach `/demo` only after a successful Better Auth response?
  Evidence: success/failure test behavior and navigation code.
- `REV-READY-SUS-002-03`
  Ref: `COUPLING-SUS-002-01`
  Question: Are credentials and session cookies free of client-side persistence and unsafe error output?
  Evidence: changed-file review, failure-path test, and browser-side storage checks.

## Review checkpoint

- **Review question:** Does `/sign-up` collect the required identity fields and submit them through the browser-facing auth boundary with bounded success, loading, and failure behavior while other auth modes remain unchanged?
- **Combined acceptance:** The dedicated form uses the Better Auth request contract, establishes no client-owned auth truth, redirects only after success, handles failure safely, and preserves sign-in/reset-password/CSP behavior.
- **Commit to review:** Implementation commit recorded when `SUS-BATCH-02` enters `awaiting_review`.
