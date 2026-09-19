# SOUT-001: Sign-out submission seam

- **State:** `awaiting_review`
- **Review batch:** `SOUT-BATCH-01`
- **Depends on:** BSS-004 `approved`; SUS and SIN ticket sets `approved`/frozen
- **Baseline:** [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md) §§3–6, 10–12, 19–20, 23–25; [Backend Phase README](../../README.md) authority and fixture-transition rules; AC-01, AC-02, AC-05–AC-07, and AC-13

## Outcome

Create an independently testable browser submission seam for the current-session Better Auth sign-out request. The seam must issue one same-origin `POST /api/auth/sign-out`, expose the actual response to the caller, and make success navigation downstream of an accepted response.

## Scope

- Add `apps/atlas/components/sign-out-submission.ts` or an equivalent small helper following the existing sign-up/sign-in submission pattern.
- Use the existing application route with `method: "POST"` and same-origin credential/cookie handling.
- Keep one request in flight at a time; a second submission while pending must not issue another request.
- Return or classify the real response so callers can distinguish accepted success from non-2xx failure and network failure.
- Keep navigation injectable or downstream of the helper so the seam can prove exactly-once navigation on success and no navigation on failure.
- Produce only bounded failure information suitable for a user-facing retry message; do not expose raw response bodies or internal exceptions.
- Keep the helper free of database access, project logic, fixture authority, cookie parsing, manual cookie mutation, token storage, or account deletion.
- Add focused tests for success, non-2xx response, network failure, and duplicate submission behavior.

Do not wire the helper into `ProfileMenu`, change `/home`, alter `/demo`, add a new auth route, or change Better Auth configuration in this ticket. Those concerns belong to later batches.

## Acceptance criteria

- The seam calls `/api/auth/sign-out` with `POST` and browser-managed same-origin credentials.
- A successful response is observable as success without requiring client-side session state or cookie manipulation.
- Navigation is not performed by the request seam before success; the caller can navigate exactly once after success.
- Non-2xx responses and network failures return a bounded retryable failure and do not navigate.
- A second invocation while the first request is pending does not create a second request.
- No `localStorage`, `sessionStorage`, custom cookie, JWT, bearer token, refresh token, session identifier, direct auth-table query, or project-state write is introduced.
- The helper does not log cookies, `Cookie` headers, auth secrets, database credentials, passwords, or raw authentication errors.

## Validation

- Run the focused helper/component tests for success, non-2xx, network failure, and duplicate-submit branches.
- Verify the request method, endpoint, credential mode, and call count in the test double or equivalent browser-shaped test.
- Verify the success branch permits one navigation callback only after the response is accepted and the failure branches permit retry.
- Run the directly affected app build/test checks and `git diff --check`.
- Inspect the changed files for absence of auth persistence, cookie mutation, project/fixture calls, and raw error output.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SOUT-001-01` Better Auth owns current-session invalidation and session-cookie lifecycle through BSS-004 and the mounted application auth route.
- `BOUNDARY-SOUT-001-02` Atlas project authorization/state and `@atlas/fixtures` remain outside the browser sign-out seam.

### Trust boundaries

- `TRUST-SOUT-001-01` Browser interaction crosses into the same-origin application auth route; the client must not become an authentication authority.
- `TRUST-SOUT-001-02` The server response determines whether navigation may proceed; route change or local UI state is not proof of sign-out.

### Sensitive assets and identity context

- `ASSET-SOUT-001-01` Session cookies, auth headers, secrets, passwords, and raw auth failure details must stay out of logs and rendered error state.
- `IDENTITY-SOUT-001-01` Preserve the browser's normal Better Auth cookie contract so the invalidated session remains the only identity authority.

### Required seams

- `SEAM-SOUT-001-01` A narrow request seam is the attachment point for later auth-policy, observability, and safe error mapping without moving persistence into UI code.
- `SEAM-SOUT-001-02` Injectable request/navigation behavior makes exactly-once success and retryable failure independently verifiable.

### Prohibited couplings

- `COUPLING-SOUT-001-01` Do not implement sign-out as a GET link, route change, React boolean, or manual cookie deletion.
- `COUPLING-SOUT-001-02` Do not add a parallel auth/session mechanism or couple sign-out to Atlas project or fixture mutation.

### Intentionally unresolved security policy

- `SEC-GAP-SOUT-001-01` Abuse/rate-limit policy, global session revocation, route-wide protection, and the broader security baseline remain future work; this ticket preserves attachment points without inventing those controls.

### Mandatory review bindings

- `REV-READY-SOUT-001-01`
  Ref: `SEAM-SOUT-001-01`
  Question: Is the browser submission seam narrow enough to preserve Better Auth as the session authority?
  Evidence: helper diff and focused request tests.
- `REV-READY-SOUT-001-02`
  Ref: `SEAM-SOUT-001-02`
  Question: Are success, failure, retry, and duplicate-submit outcomes independently observable?
  Evidence: focused test cases and navigation call counts.
- `REV-READY-SOUT-001-03`
  Ref: `COUPLING-SOUT-001-01`
  Question: Is navigation downstream of successful POST completion rather than a substitute for invalidation?
  Evidence: request helper control flow and success/failure tests.

## Review checkpoint

- **Review question:** Does the browser-facing sign-out seam call the approved endpoint once, expose bounded outcomes, and allow navigation only after success?
- **Combined acceptance:** The method/endpoint/credential contract is correct; duplicate requests are prevented; success allows exactly one downstream navigation; non-2xx and network failures remain on the current surface and retryable; no competing auth or Atlas-state path exists.
- **Implementation checkpoint:** `HEAD` (`feat(auth): add sign-out submission seam`); awaiting the consolidated `SOUT-BATCH-01` review.
