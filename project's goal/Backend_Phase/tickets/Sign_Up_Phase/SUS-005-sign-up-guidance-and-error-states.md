# SUS-005: Sign-up guidance and meaningful error states

- **State:** `awaiting_review`
- **Review batch:** `SUS-BATCH-05`
- **Depends on:** SUS-004 `approved`
- **Baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) §§3, 9, 13–14, 21, AC-05–AC-06, AC-12; [SUS-002](SUS-002-sign-up-form-and-auth-screen.md); [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md) §§4.1, 9.4; user-provided create-project form reference image

## Scope decision

This is a user-authorized additive UX refinement after the SUS-001 through SUS-004 checkpoints were approved. It does not reopen or change those frozen implementation boundaries. It improves how the existing sign-up form explains its inputs and reports user-correctable failures; it does not add a new authentication flow or change the Better Auth server policy.

## Outcome

Make `/sign-up` self-explanatory before submission and specific after a failed submission. The form should show a visible required marker and concise guidance for every field, state the accepted password length without inventing character-class rules, and replace the current generic-only failure experience with meaningful, accessible field or form notifications.

## Scope

- Enrich `apps/atlas/components/SignUpForm.tsx` without changing the existing name/email/password request contract or success navigation.
- Show `* Required` beside the `Name`, `Email`, and `Password` labels. Keep the semantic `required` attributes; the visible marker must not be the only required-state signal.
- Add concise helper notes:
  - **Name:** explain that this is the name associated with the Atlas account.
  - **Email:** explain that the user should provide an email address they can access.
  - **Password:** state `8–128 characters`, matching the current Better Auth email/password defaults; do not claim a special-character, number, or uppercase requirement that the server does not enforce.
- Associate each input with its helper and any field error through `aria-describedby`; set `aria-invalid` when that field has a validation error.
- Add bounded client-side guidance for missing or malformed values before the request is sent, while keeping Better Auth authoritative for validation and persistence.
- Replace the single generic-only notification with an allowlisted error presentation that distinguishes, when safely known:
  - missing name: `Enter your name.`;
  - missing or invalid email: `Enter a valid email address.`;
  - missing password: `Enter a password.`;
  - password shorter than eight characters: `Password must be at least 8 characters.`;
  - password longer than 128 characters: `Password must be 128 characters or fewer.`;
  - an already-registered email: `An account already exists for this email. Try signing in or use a different email.`;
  - an unavailable or otherwise unclassified service failure: `Atlas couldn't create your account right now. Check your connection and try again.`
- Use field-level errors for input-correctable failures and a visible form-level `role="alert"` notification for submit-level or service failures. The notification must not rely on color alone and must remain readable in both themes.
- Preserve the existing loading, retry, success-navigation, cookie, CSP, and Better Auth behavior. Sign-in and reset-password screens remain outside this ticket.

## Non-goals

- Do not change `@atlas/auth` configuration, password hashing, Better Auth persistence, session cookies, or the server-side password policy.
- Do not add password confirmation, strength scoring, password visibility toggles, email verification, sign-in, recovery, route protection, abuse prevention, or project authorization.
- Do not expose raw Better Auth response messages, internal error codes, stack traces, SQL, secrets, credentials, cookies, or environment values in the UI or logs.
- Do not store credentials or authentication state in browser storage, custom cookies, URL parameters, or durable React state.

## Acceptance criteria

- `/sign-up` shows `Name`, `Email`, and `Password`, and each label visibly includes `* Required` while the corresponding input remains semantically required.
- Each field has concise helper guidance, and the password helper explicitly states the accepted `8–128 characters` format without adding unsupported composition requirements.
- Each helper/error relationship is available to assistive technology through stable `aria-describedby` references; invalid fields expose `aria-invalid="true"` when applicable.
- A missing or malformed field produces a specific, actionable field message before an unnecessary request is sent.
- A safely recognized duplicate-email or password-policy response produces the corresponding allowlisted message; an unknown/network/service failure produces the bounded Atlas service message. No raw response text is rendered.
- Error messages are visible, announced through the appropriate alert/status semantics, and remain readable without relying on color alone. The user remains on `/sign-up`, can correct the form, and can retry.
- The existing successful request still navigates to `/demo` only after Better Auth accepts the request, and no client-owned auth state or project authorization is introduced.
- Sign-in and reset-password rendering and behavior remain unchanged, except for shared style or accessibility primitives that are directly necessary for the sign-up refinement.
- The form remains usable at the established desktop and mobile breakpoints in light and dark themes; helper text, errors, and the primary action do not clip, overflow, or collapse the field order.
- No CSP weakening, dynamic-code workaround, custom token/cookie state, or direct Atlas authorization/project write is introduced.

## Validation

- Extend the rendered HTML or component test strategy to assert the three required notes, helper copy, password length guidance, `aria-describedby` wiring, and absence of raw error rendering.
- Exercise the client validation branches for missing name, invalid email, missing password, short password, and long password.
- Exercise the response mapping for duplicate email, password policy, unknown failure, and network failure; verify the notification copy, retryability, and that navigation does not occur on failure.
- Preserve the existing success, duplicate-submission, worker-runtime, auth-boundary, rendered HTML, CSP, build, and relevant type/lint checks.
- Record visual inspection for the sign-up route at desktop and mobile widths in both supported themes, including initial, focus, field-error, form-alert, loading, and success-transition states. Confirm helper/error text wraps within the auth card and remains readable at narrow reflow.
- Inspect the final diff for credential logging, raw server-error rendering, browser-owned session state, auth-policy duplication that can drift from Better Auth, and unrelated changes to sign-in/reset-password.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SUS-005-01` Better Auth and `@atlas/auth` remain the sole authority for identity, credentials, session cookies, and `auth.*` persistence.
- `BOUNDARY-SUS-005-02` Atlas authorization/project state and fixture data remain outside sign-up authentication.

### Trust boundaries

- `TRUST-SUS-005-01` User input crosses from the browser form to the same-origin Better Auth endpoint; client guidance is UX assistance, not an authority replacement.
- `TRUST-SUS-005-02` Server error responses cross back into the browser and must pass through an explicit safe-message allowlist before presentation.

### Sensitive assets and identity context

- `ASSET-SUS-005-01` Passwords, email addresses, session cookies, auth responses, secrets, and database details must not appear in logs or user-facing error output.
- `IDENTITY-SUS-005-01` Preserve the existing browser cookie/session semantics and success navigation boundary established by SUS-002 through SUS-004.

### Required seams

- `SEAM-SUS-005-01` Keep helper copy, field validation state, and safe error mapping in the browser interaction component so presentation can evolve without moving auth authority into the UI.
- `SEAM-SUS-005-02` Keep server policy authoritative and make the password note a visible reflection of the current Better Auth configuration rather than a second password-policy implementation.
- `SEAM-SUS-005-03` Keep stable field IDs and descriptive relationships available for future localization, stronger validation policy, and accessible error-summary behavior.

### Prohibited couplings

- `COUPLING-SUS-005-01` Do not render raw Better Auth messages, response bodies, internal error names, or exception text.
- `COUPLING-SUS-005-02` Do not add browser-owned auth persistence, custom tokens/cookies, or project/authorization writes.
- `COUPLING-SUS-005-03` Do not silently change the server password policy to make the UI note true; a policy change requires a separate scope decision.

### Intentionally unresolved security policy

- `SEC-GAP-SUS-005-01` Abuse prevention, email verification, account recovery, route protection, and broader password-policy decisions remain separately scoped.

### Mandatory review bindings

- `REV-READY-SUS-005-01`
  Ref: `SEAM-SUS-005-01`
  Question: Does the form provide field-specific, accessible guidance and error states without moving auth or project logic into the browser?
  Evidence: component diff, rendered HTML, interaction tests, and visual inspection.
- `REV-READY-SUS-005-02`
  Ref: `SEAM-SUS-005-02`
  Question: Does the password guidance reflect the current Better Auth 8–128-character contract without inventing an independent composition policy?
  Evidence: helper copy, input constraints, server-boundary tests, and final diff review.
- `REV-READY-SUS-005-03`
  Ref: `TRUST-SUS-005-02`
  Question: Are response failures mapped to safe, meaningful messages without raw auth/internal details reaching the browser?
  Evidence: response-mapping tests, network/server failure tests, and changed-file review.

## Review checkpoint

- **Review question:** Does the sign-up form explain required inputs and accepted password length clearly, while turning safe validation/auth failures into actionable accessible notifications without weakening the Better Auth boundary?
- **Combined acceptance:** Required markers and helper notes are visible for all fields; password guidance matches the current 8–128-character Better Auth contract; field and form errors are specific, accessible, retryable, and bounded; success behavior and auth/authorization boundaries remain unchanged.
- **Commit to review:** `7158ea4` (`feat(auth): improve sign-up guidance`).
