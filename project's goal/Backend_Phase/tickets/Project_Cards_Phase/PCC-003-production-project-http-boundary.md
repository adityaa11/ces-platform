# PCC-003: Production project HTTP boundary

- **State:** `awaiting_review`
- **Review batch:** `PCC-BATCH-03`
- **Depends on:** PCC-002 `PASS`; approved BSS-004/SIN/SOUT auth boundaries
- **Execution environment:** Docker Compose is authoritative for Better Auth, PostgreSQL-backed route integration, application tests, and builds; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-02` §§10–13, 18–20, 25–31, 38–42; `SRC-PCC-05`; `SRC-PCC-07`

## Outcome

Add one authoritative production project-creation HTTP boundary at
`POST /api/projects`. It resolves the current Better Auth session on the
server, accepts bounded same-origin multipart input, delegates to PCC-002, and
returns safe status/error responses without using fixture transport or exposing
internal storage/auth details.

## Scope

- Add `apps/atlas/app/api/projects/route.ts` or the repository-equivalent production route.
- Require `multipart/form-data` with `projectId`, `projectName`, optional `projectDescription`, and one or more `prdFiles[]` parts.
- Resolve the Better Auth session through the existing server auth boundary and pass only the server-derived user ID to the creation service.
- Enforce the existing same-origin/CSRF policy at this state-changing cookie-authenticated route. Reuse an established origin/trusted-origin seam; if none is sufficient, record a scope decision rather than inventing a parallel auth policy.
- Apply bounded request parsing before materializing untrusted input: per-file 20 MiB maximum, bounded file count, bounded total request size, required fields, accepted media type, and obvious PDF-content validation.
- Delegate all project creation and persistence to PCC-002. The route must not query Drizzle directly, write files, construct storage keys, or create membership/workspace records itself.
- Map representative failures to bounded responses: `400`, `401`, `409`, `413`, `415`, and `500` as applicable. The response body must be safe for UI mapping.
- Return a created-project summary without storage key, raw bytes, local path, session identifier, database URL, raw SQL, or stack trace.
- Keep `POST /api/local-fixtures` and its base64 JSON contract exclusively behind `/demo` fixture behavior.

## Acceptance criteria

- An authenticated same-origin multipart request reaches the production service and never calls `/api/local-fixtures`.
- An unauthenticated request returns `401` and does not create project, membership, workspace, document, or fixture state.
- The route does not trust a React user object, request user ID, query parameter, or browser token as authorization.
- Missing/invalid fields, missing PRDs, invalid Project ID, invalid PDF, duplicate Project ID, oversized file/request, and unsupported media produce bounded status and safe messages.
- The route accepts at least one valid PDF and preserves exact bytes for the creation service; it does not base64-encode production uploads into JSON.
- Origin/CSRF failures are rejected before the creation service runs, using the application's approved same-origin policy.
- `409` is returned for a duplicate stable Project ID, including a database uniqueness race where practical.
- Internal errors do not return `DATABASE_URL`, filesystem path, DocumentStore root/key, cookie, raw SQL, stack trace, or raw exception message.
- The route does not return or log raw PDF bytes, base64 content, cookies, auth secrets, or provider credentials.
- No pg-boss perception job, Bridge request, perception execution, source grant, normalized cache, semantic state, CES state, or publication state is created.

## Validation

- Start the Compose PostgreSQL service and confirm health before route tests that resolve Better Auth sessions or persist Atlas state. Run route integration, auth lifecycle, build, and app checks through the Compose-managed `atlas` service; do not use a host-local database as authoritative evidence.
- Add route tests using browser-shaped `Request`/`FormData` inputs for success, unauthenticated, origin/CSRF rejection, validation failures, duplicate conflict, oversized input, unsupported media, and internal failure mapping.
- Assert the route passes the real Better Auth user ID to the creation seam and does not accept a caller-supplied identity.
- Assert the success body is safe and contains no storage key or filesystem path.
- Exercise duplicate submit requests against the route; server uniqueness remains authoritative even when the later UI disables its button.
- Run application build, rendered HTML/CSP checks, direct app tests, and auth lifecycle checks in Docker Compose. Keep host-local commands diagnostic only.
- Inspect logs and route responses for forbidden sensitive fields and verify `/api/local-fixtures` remains unchanged.

## Security Refactor Readiness

Status: planning-review-required

### Inherited boundaries

- `BOUNDARY-PCC-003-01` Better Auth owns cookie/session resolution; the route must reuse the existing auth server boundary.
- `BOUNDARY-PCC-003-02` Atlas application/domain services own project creation; the route is transport/orchestration only.
- `BOUNDARY-PCC-003-03` `/demo` fixture transport is not a production fallback.

### Trust boundaries

- `TRUST-PCC-003-01` Browser cookies and multipart fields cross into a server-side state-changing route.
- `TRUST-PCC-003-02` Origin/CSRF validation and Better Auth session resolution precede the Atlas creation service.
- `TRUST-PCC-003-03` Untrusted file metadata/content crosses into bounded DocumentStore-backed domain orchestration.

### Sensitive assets and identity context

- `ASSET-PCC-003-01` Session cookies, origin headers, PRD bytes, filenames, storage metadata, and internal errors must not be exposed in responses or logs.
- `IDENTITY-PCC-003-01` The only creator identity accepted by the route is the current server-resolved Better Auth user ID.

### Required seams

- `SEAM-PCC-003-01` Keep multipart parsing and status mapping separate from the PCC-002 service so future request policy can attach without moving persistence into the route.
- `SEAM-PCC-003-02` Keep origin/CSRF enforcement explicit and reusable at the route boundary.
- `SEAM-PCC-003-03` Keep a stable error taxonomy for UI mapping without leaking internal exception details.

### Prohibited couplings

- `COUPLING-PCC-003-01` Do not create a custom browser token, JWT, bearer flow, session cookie, or direct auth-table query.
- `COUPLING-PCC-003-02` Do not use base64 fixture JSON, `/api/local-fixtures`, client-side identity, or browser project lists as production authority.
- `COUPLING-PCC-003-03` Do not put Drizzle/DocumentStore orchestration or downstream perception calls in the HTTP route.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-003-01` Abuse/rate limiting, malware scanning, upload retention/cleanup, global middleware, OAuth, MFA, and full security-baseline controls remain future work.

### Planning findings

- `FINDING-PCC-003-01` Finalize the exact reusable same-origin/CSRF helper during implementation. If the approved auth configuration does not provide a sufficient application route check, stop and surface a scope decision; do not silently invent a weaker policy.

### Mandatory review bindings

- `REV-READY-PCC-003-01`
  Ref: `SEAM-PCC-003-02`
  Question: Does the state-changing route reject untrusted origins before invoking project creation while preserving the approved Better Auth cookie flow?
  Evidence: route tests with accepted/rejected origins and changed-file review.
- `REV-READY-PCC-003-02`
  Ref: `SEAM-PCC-003-03`
  Question: Can the UI distinguish bounded validation/auth/conflict/size/media/internal failures without receiving secrets or internals?
  Evidence: response matrix and route assertions.
- `REV-READY-PCC-003-03`
  Ref: `COUPLING-PCC-003-02`
  Question: Is production upload transport independent from fixture JSON/base64 behavior and fixture persistence?
  Evidence: request tests, route diff, and `/demo` regression.

## Review checkpoint

- **Review question:** Does `POST /api/projects` provide one secure, bounded, production-only multipart entry point that delegates to the approved session and Atlas services?
- **Combined acceptance:** Real session authority, explicit origin/CSRF handling, bounded PDF intake, safe status mapping, and no fixture/storage/path/secret leakage are proven without downstream extraction behavior.
- **Implementation checkpoint:** `6b1c771` (`feat(atlas): add PCC-003 project creation boundary`). Compose PostgreSQL was healthy; `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs` passed (1 test). The route rejects an untrusted origin and accepts a trusted Better Auth session multipart request, creating one Atlas project through PCC-002.
