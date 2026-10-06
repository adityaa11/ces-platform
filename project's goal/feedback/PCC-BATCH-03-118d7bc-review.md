# Review: PCC-BATCH-03

- Ticket / batch: `PCC-003` / `PCC-BATCH-03`
- Reviewed commit: `118d7bcb9b5fc671bea0a0227a21da2b76ec292a` (`docs(atlas): mark PCC-003 awaiting review`), with implementation checkpoint `6b1c771e2cf2747c39e5340571b368c06e83ae0c`
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-003-production-project-http-boundary.md`; source anchors `SRC-PCC-02`, `SRC-PCC-05`, and `SRC-PCC-07`
- Review round: 1
- Maximum review rounds: 3
- Prior review: None for `PCC-BATCH-03`
- Remediation commit: None
- Result: `BLOCKED`
- Convergence: Not applicable (Round 1)

## Evidence

- The ticket is `awaiting_review` and records implementation checkpoint `6b1c771`. PCC-002 dependency evidence is a Round 3 `PASS` at `389494a999fecb1905de3aaa9cefa99f2fb27774`.
- `git rev-parse HEAD` returned `118d7bcb9b5fc671bea0a0227a21da2b76ec292a`. The worktree reports `M apps/atlas/lib/auth-server.ts` plus untracked context/review documents. The working file's `git hash-object` exactly matches `HEAD:apps/atlas/lib/auth-server.ts`, so no byte-content diff was observed; however, `.git` is read-only in this environment and `git update-index --refresh` failed while trying to normalize the stat-only entry. The review cannot certify a fully clean worktree.
- `git diff --check 6b1c771^..6b1c771` passed.
- `docker compose ps` reported healthy `atlas` and `postgres` services. `docker compose build --quiet atlas` completed successfully.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs` passed: 1 test, 1 pass, 0 fail, 0 skipped.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` built successfully and then reported 21 tests: 19 pass, 1 fail, 1 skipped. Build/rendered HTML/CSP checks and the PCC-003 happy-path test passed. The failing auth lifecycle test is `tests/auth-sign-up.integration.test.mjs:57-58`; it asserts that `atlas.project` and related Atlas tables do not exist, which conflicts with the accepted PCC-001/PCC-002 dependency that created those tables. The failure is reproducible when the test is run alone.
- The committed build output listed `/api/auth/:all+` but no `/api/projects`. The implementation is registered only through `createProjectCreationBoundary().configureServer()` in `apps/atlas/project-creation-boundary.ts:23-24`; the production worker entry uses the built app-router handler and does not import that Vite development-server middleware.
- The required security-refactor extension was applied. Mandatory binding review covered the origin seam, stable error mapping, production/fixture transport separation, identity authority, sensitive-data handling, persistence boundary, and unresolved policy gap. No abuse-rate-limit, malware-scan, retention, OAuth, MFA, or full-baseline control was invented.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-003 Outcome/Scope/Acceptance requires one authoritative production `POST /api/projects` boundary; `BOUNDARY-PCC-003-02` requires the route to run in the production application boundary. | `apps/atlas/project-creation-boundary.ts:23-24`; `apps/atlas/vite.config.ts:156`; `apps/atlas/worker/index.ts:2,42` | The boundary exists only as Vite `configureServer` middleware. The Compose dev server exercises it, but the committed production build route manifest contains no `/api/projects`, and the worker invokes the app-router handler without this plugin. | Implement the route in the app/worker production route surface, or another repository-equivalent that is included by the production build and worker runtime, then validate both Compose integration and the production path. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-003 requires Better Auth session resolution through the existing server auth boundary, with only the server-derived user ID accepted; `BOUNDARY-PCC-003-01`, `TRUST-PCC-003-02`, and `IDENTITY-PCC-003-01` are mandatory. | `apps/atlas/project-creation-boundary.ts:42-52` | The implementation imports only auth config and resolves the session with `fetch(\`http://${request.headers.host}/api/auth/get-session\`, { cookie })`. It does not use `getAtlasAuthService`/the established server auth seam, and it treats the request `Host` header as the auth destination while forwarding the session cookie. A modified Host can redirect that cookie-bearing fetch to an unintended authority and the path is also hard-coded to HTTP. | Resolve the session through the established server auth boundary or a fixed, approved runtime authority; never derive a cookie-bearing auth destination from the request Host header. Add a regression proving caller-controlled Host cannot change session authority. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-003 Validation requires browser-shaped route evidence for unauthenticated, validation, duplicate, oversized, unsupported-media, internal-failure, safe-response, exact-byte, duplicate-submit, sensitive-log, and `/api/local-fixtures` regression behavior; `REV-READY-PCC-003-02` and `REV-READY-PCC-003-03` are mandatory minimums. | `apps/atlas/tests/project-create.integration.test.mjs:7-18` | The only route test covers one authenticated success, one rejected origin, one created-project row, and cleanup. It does not exercise or assert the required 401/400/409/413/415/500 matrix, caller-supplied identity rejection, duplicate submit, exact PDF bytes, forbidden response/log fields, downstream-negative state, or fixture regression. | Add the ticket-required route matrix and assertions, including injected service failure and safe response/log checks, then rerun the Compose app and auth lifecycle validation. |
| CK-004 | PLANNING_GAP | INITIAL_REVIEW | OPEN | PCC-003 Validation requires the Compose-managed application/auth lifecycle checks to be green, and the frozen dependency set must remain internally consistent. | `apps/atlas/tests/auth-sign-up.integration.test.mjs:57-58`; accepted PCC-001/PCC-002 Atlas schema | The authoritative app suite fails because the inherited auth test asserts that `atlas.project`/related Atlas tables are absent, while accepted PCC-001/PCC-002 checkpoints explicitly establish those Atlas-owned tables. This is not repairable solely inside PCC-003 without a dependency/test-contract decision. | Planning/dependency authority must reconcile the stale auth lifecycle assertion with the accepted Atlas schema (or explicitly revise the dependency baseline), then rerun the full Compose app suite before CK can complete the review. |

## Advisory observations

- The route's status mapping is structurally separated from the PCC-002 service and uses bounded public messages for the currently known error classes, but the required matrix evidence is absent.
- The ticket's explicitly unresolved abuse/rate-limiting, malware-scanning, retention/cleanup, OAuth, MFA, global-middleware, and full security-baseline policies remain outside this review decision.
- The stat-only `auth-server.ts` worktree condition appears to be a filesystem/index freshness issue because its blob hash matches `HEAD`; it must still be normalized or explicitly cleared by the workspace owner before a later committed-checkpoint review.

## Decision

PCC-BATCH-03 cannot receive `PASS`. The implementation has an authoritative-runtime defect, an auth-boundary/Host-authority defect, and materially incomplete mandatory route evidence. In addition, the required Compose app suite is blocked by an inherited planning/dependency inconsistency in the auth lifecycle test. Because a planning blocker coexists with repairable implementation findings, CK returns `BLOCKED`; it does not authorize CFC, waive the missing policy decision, or advance the ticket. Resolve the dependency/test contract and return a committed, cleanly reviewable checkpoint to `awaiting_review` before starting the next CK round.
