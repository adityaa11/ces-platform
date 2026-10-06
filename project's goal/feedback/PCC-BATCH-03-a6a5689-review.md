# Review: PCC-BATCH-03

- Ticket / batch: `PCC-003` / `PCC-BATCH-03`
- Reviewed commit: `a6a5689249aec7adc8b0152285455ddf47331fc4` (`test(atlas): align auth lifecycle with PCC schema`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-003-production-project-http-boundary.md`; source anchors `SRC-PCC-02`, `SRC-PCC-05`, and `SRC-PCC-07`
- Review round: 1 (fresh review session authorized by the current `ck` invocation for the new committed revision)
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-03-118d7bc-review.md` (`BLOCKED`, prior session); preflight `project's goal/feedback/PCC-BATCH-03-6b1c771-preflight-review.md`
- Remediation commit: None; `a6a5689` establishes the reviewed committed revision for this fresh session
- Result: `CHANGES_REQUIRED`
- Convergence: Not applicable (Round 1)

## Evidence

- The ticket is `awaiting_review` and records implementation checkpoint `6b1c771`; the reviewed `HEAD` is the subsequent committed validation revision `a6a5689`.
- PCC-002 dependency evidence remains a Round 3 `PASS` at `389494a999fecb1905de3aaa9cefa99f2fb27774`.
- The worktree has uncommitted CK/engineering-skill edits and a stat-only `apps/atlas/lib/auth-server.ts` entry whose working blob matches `HEAD`; no PCC-003 implementation or route-test content is uncommitted. Untracked prior review/context artifacts were not used as committed implementation evidence.
- `git diff --check 118d7bc^..a6a5689` passed. The reviewed commit changes only the inherited auth lifecycle assertion to match the accepted Atlas schema.
- `docker compose build --quiet atlas` completed successfully. `docker compose up -d --no-build atlas` recreated the service, and final `docker compose ps` reported both `atlas` and `postgres` healthy.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs` passed: 1 test, 1 pass, 0 fail, 0 skipped.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` completed successfully: 21 tests, 20 pass, 0 fail, 1 intentional worker-runtime skip. Build, rendered HTML/CSP checks, auth lifecycle, home/sign-out regressions, and the PCC-003 happy-path test passed.
- The required security-refactor extension was applied. The review verified the declared origin/session, identity, error, fixture-transport, sensitive-data, persistence, and unresolved-policy bindings.
- The repository's Worker/Cloudflare entrypoint was not treated as mandatory review scope: the frozen PCC-003 ticket and its referenced implementation context do not identify it as the authoritative deployment target. The ticket's Compose execution environment was used for validation only.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-003 requires Better Auth session resolution through the existing server auth boundary; `BOUNDARY-PCC-003-01`, `TRUST-PCC-003-02`, and `IDENTITY-PCC-003-01` require the current server-resolved user ID to be the only creator identity. | `apps/atlas/project-creation-boundary.ts:42-52`; existing seam `apps/atlas/lib/auth-server.ts:getAtlasAuthService` | The route imports auth config and performs `fetch(\`http://${request.headers.host}/api/auth/get-session\`, { cookie })`. It bypasses `getAtlasAuthService` and uses the request `Host` header as the cookie-bearing auth destination, rather than an approved server authority. | Resolve the session through the established server auth boundary or another fixed, explicitly approved internal authority. Do not derive the auth destination from the request `Host` header; add a regression proving caller-controlled Host cannot alter session authority. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-003 Validation and `REV-READY-PCC-003-02`/`03` require route assertions for unauthenticated, validation, duplicate, size, media, internal-failure, safe-response, exact-byte, duplicate-submit, sensitive-output, downstream-negative, and fixture-regression behavior. | `apps/atlas/tests/project-create.integration.test.mjs:7-18` | The committed route test covers one authenticated success, one rejected origin, one bounded success body, and one project-row check. It does not cover the required `401`, `400`, `409`, `413`, `415`, or `500` cases; caller-supplied identity rejection; duplicate submit; exact PDF-byte persistence; forbidden response/log fields; downstream-negative state; or `/api/local-fixtures` regression. | Add the ticket-required browser-shaped route matrix and assertions, including an injected service failure and safe response/log checks, then rerun the Compose app and auth lifecycle suite. |

## Advisory observations

- The route's explicit trusted-origin check and public error mapping are directionally aligned with the declared seams, but the auth resolution seam must be corrected before approval.
- The build output's route classification is not used as a finding because the frozen ticket does not identify the Worker/Cloudflare runtime as authoritative; any deployment-target decision belongs in planning, not CK inference.
- The ticket's explicitly unresolved abuse/rate-limiting, malware-scanning, retention/cleanup, OAuth, MFA, global-middleware, and full security-baseline policies remain outside this review decision.

## Decision

The prior planning/validation blocker is resolved by committed `a6a5689`, and the authoritative Compose suite is green. PCC-BATCH-03 remains `CHANGES_REQUIRED` because two implementation-repairable findings are open: the route bypasses the approved Better Auth server seam and forwards the session cookie to a request-Host-derived destination, and the mandatory route validation matrix is not implemented. The Worker/Cloudflare concern is explicitly excluded from the result. Keep PCC-003 at `awaiting_review`; CFC may address only these ticket-scoped implementation findings within the three-round session.
