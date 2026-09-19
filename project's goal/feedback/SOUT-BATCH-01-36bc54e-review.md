# Review: SOUT-BATCH-01 - Sign-out submission seam

- Reviewed commit: `36bc54e` (`feat(auth): add sign-out submission seam`)
- Baseline: [SOUT-001 sign-out submission seam](../Backend_Phase/tickets/Sign_Out_Phase/SOUT-001-sign-out-submission-seam.md); [Sign-Out Implementation Context](../Backend_Phase/atlas-sign-out-implementation-context.md) §§3–6, 10–12, 19–20, 23–25; [Backend Phase README](../Backend_Phase/README.md) authority and fixture-transition rules; AC-01, AC-02, AC-05–AC-07, and AC-13; `REV-READY-SOUT-001-01`–`03`
- Ticket / batch: `SOUT-001` / `SOUT-BATCH-01`
- Result: `PASS`
- Review round: 1

## Evidence

- `apps/atlas/components/sign-out-submission.ts` is a narrow browser request seam for the existing `POST /api/auth/sign-out` route with `credentials: "same-origin"`; it contains no database, project, fixture, cookie, token, or logging path.
- `createSignOutSubmission` coalesces a second pending invocation onto the first promise, accepts navigation only for an `ok` response, clears the in-flight guard after either outcome, and converts network rejection to `null` so callers can retry without raw exception details.
- `mapSignOutFailure` supplies the bounded retry message required by the ticket. The helper returns the actual response for caller-side status handling without reading or exposing its body.
- `apps/atlas/tests/auth-boundary.test.mjs` adds focused evidence for endpoint/method/credential configuration, duplicate-submit prevention, exactly-once success navigation, non-2xx retryability, network failure, and bounded failure copy.
- `git diff --check HEAD^ HEAD`: passed. Containerized validation through the canonical Compose environment passed: `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test` completed with 18 passing tests, 0 failures, and 1 explicitly skipped worker-runtime test; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test` completed with 3 passing tests. Host-local validation remains unreliable because the interrupted local workspace relink left `jiti` unavailable, but the Docker result provides the supported clean-environment evidence.

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| — | — | — | — | No unresolved in-scope findings. | — |

## Decision

`SOUT-BATCH-01` satisfies the frozen review question and combined acceptance on committed-code and committed-test inspection. The browser-facing seam preserves Better Auth as the session authority, prevents duplicate requests, keeps navigation downstream of successful POST completion, and leaves failure outcomes retryable and bounded. The checkpoint passed and was approved through `go`; `SOUT-002` remains planned pending a separate authorization.
