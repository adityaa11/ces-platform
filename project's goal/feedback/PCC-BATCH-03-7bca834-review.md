# Review: PCC-BATCH-03

- Ticket / batch: `PCC-003` / `PCC-BATCH-03`
- Reviewed commit: `7bca83415dd98d2c57d50ef4f5f27e56cafb8def` (`fix(atlas): remediate PCC-003 CK-001 CK-002`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-003-production-project-http-boundary.md`; source anchors `SRC-PCC-02`, `SRC-PCC-05`, and `SRC-PCC-07`
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-03-a6a5689-review.md`
- Remediation commit: `7bca83415dd98d2c57d50ef4f5f27e56cafb8def`
- Result: `CHANGES_REQUIRED`
- Convergence: `IMPROVING`

## Evidence

- The ticket remains `awaiting_review`. The remediation commit is the current `HEAD`, and its commit message identifies both prior finding IDs.
- The remediation delta is bounded to the auth destination and PCC-003 route tests. It does not change the accepted Atlas/DocumentStore authority split, the production/fixture boundary, or the frozen ticket baseline.
- `git diff --check a6a5689^..7bca834` passed.
- `docker compose build --quiet atlas` completed successfully, and `docker compose up -d --no-build atlas` left the Compose services running.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs` passed: 1 test, 1 pass, 0 fail, 0 skipped.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` completed successfully: 21 tests, 20 pass, 0 fail, 1 intentional worker-runtime skip. Build, rendered HTML/CSP checks, auth lifecycle, and application regressions passed.
- CK-001 security-readiness coverage was rechecked. `apps/atlas/project-creation-boundary.ts` now resolves the session using the configured `config.baseURL`, and the expanded route test sends `host: attacker.example` while asserting the persisted creator is the Better Auth session user. The request Host no longer selects the cookie-bearing auth destination.
- The Worker/Cloudflare runtime remains outside mandatory scope because the frozen PCC-003 ticket and referenced implementation context do not identify it as authoritative.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-003 requires the approved Better Auth session boundary and server-derived creator identity; `BOUNDARY-PCC-003-01`, `TRUST-PCC-003-02`, and `IDENTITY-PCC-003-01` apply. | `apps/atlas/project-creation-boundary.ts:49-52`; `apps/atlas/tests/project-create.integration.test.mjs` remediation assertions | The remediation replaces the request-Host-derived URL with `config.baseURL`. The route test sets an attacker-controlled Host header and verifies the stored creator ID equals the server-resolved session ID. The focused test passed. | Preserve the fixed approved auth authority and Host-independence regression. |
| CK-002 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | OPEN | PCC-003 Validation and `REV-READY-PCC-003-02`/`03` require complete bounded failure, safe-response, duplicate, exact-byte, downstream-negative, and fixture-regression evidence. | `apps/atlas/tests/project-create.integration.test.mjs:16-60` | The remediation now covers 401, origin rejection, JSON/415, missing metadata/400, invalid PDF/400, unsupported file media/415, per-file 413, safe success output, server-derived identity, exact bytes, duplicate 409s, and fixture isolation. It still lacks route assertions for internal failure/500 mapping, total-request limit, bounded file count, missing PRDs, no downstream/queue state, and sensitive fields in logs. | Add the remaining route-specific assertions, including an injected creation/storage failure that proves a safe 500, total/file-count/missing-PRD cases, downstream-negative checks, and log inspection; then rerun focused and full Compose validation. |

## Advisory observations

- The remediation materially closes CK-001 without introducing a new authority or fixture coupling.
- The repository's worker-runtime test remains an intentional skip in the Compose app suite; it is recorded as validation state, not a PCC-003 blocker, because the frozen ticket does not name that runtime as authoritative.
- The ticket's explicitly unresolved abuse/rate-limiting, malware-scanning, retention/cleanup, OAuth, MFA, global-middleware, and full security-baseline policies remain outside this review decision.

## Decision

The review is improving. CK-001 is resolved with concrete code and regression evidence. CK-002 remains open because the expanded route test still does not satisfy the complete mandatory validation matrix. PCC-BATCH-03 remains `CHANGES_REQUIRED`; CFC may perform one further bounded remediation/review round, after which unresolved blockers would produce `REVIEW_CONVERGENCE_BLOCKED`.
