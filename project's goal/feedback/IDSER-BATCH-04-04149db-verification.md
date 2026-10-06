# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `04149dbba2585bd62364f3c4be5baaefebc04738` (`fix(idser): remediate semantic authority review`)
- Consumed HMN authorization: `HMN-IDSER-004-001` (`CONTINUE_CURRENT_CFC`)
- CK source: `IDSER-BATCH-04-4c2ba35-review.md` (`CHANGES_REQUIRED`, CK-001 through CK-005)
- Review type: bounded verification after the HMN continuation of the existing CFC; original findings only, their remediation diff, required evidence, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed the ticket remains `awaiting_review`; the committed CFC checkpoint records `awaiting_review`, and the remediation artifact records the consumed `HMN-IDSER-004-001` continuation. `HEAD` is the remediation commit containing those records. The tracked worktree is clean; pre-existing untracked review and context artifacts remain outside the target.
- Inspected only the active HMN record, IDSER-004 ticket/checkpoint, original CK artifact, and `4c2ba35..04149db` remediation diff.
- CK-001 code now recursively sorts object keys and hashes nested scope, provider provenance, and result content. Its focused test asserts identical-content stability and changes to nested scope, provider model, and result payload.
- CK-002 adds an execution-keyed context snapshot table, reuses and fingerprint-checks stored context on retry, and writes the first selected context in the same transaction as execution redemption. However, `reconciliationContext` currently selects prior rows itself from all `knowledge_index` entries in the bundle (bounded by `LIMIT 500`) rather than obtaining the selected prior neighborhood from an IDSER-007 selection authority. No test verifies retry stability or that later candidate availability cannot broaden the stored context.
- CK-003 now checks the normalized document's execution ID against its joined perception execution, in addition to artifact and source hash. No PostgreSQL test exercises same-byte cache reuse across distinct executions, as the original finding and ticket require.
- The file named `semantic-authority.integration.test.ts` tests only the pure fingerprint function. The Core route test is still a fake authority with one bad-credential, context-success, and handler-failure case. There is no registered real route/DB matrix for capability and scope mismatch, expiry/completion, streamed bounds, replay/concurrency, cache isolation, failure races, or safe output.
- CK-005's direct `@atlas/contracts` workspace dependency and lockfile entry are present. The CFC record reports DB typecheck and app build passed in Compose, and reports the migration and two focused test commands passed; I inspected the checked-in test bodies and migration registration.
- `git diff --check 4c2ba356dfe760b3bcfc6c94d017c767d1444b72..HEAD` passed.
- Independent reruns of DB typecheck, app build, and focused tests could not start: Corepack/pnpm attempted to fetch workspace packages from `registry.npmjs.org`, and network access failed with `EACCES`. Those checks are recorded as environment-limited, not passed by this verification.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-001 | RESOLVED | Recursive canonicalization is present and focused assertions cover equivalent envelopes plus nested scope, provenance, and result changes. |
| CK-002 | OPEN | The context is persisted and reused, but the code itself selects every bounded prior candidate from the bundle rather than consuming the IDSER-007 selected-neighborhood authority. The required retry-stability and no-broadening behavior has no test evidence. |
| CK-003 | OPEN | The execution identity guard is implemented, but required real PostgreSQL coverage for same-byte cache reuse across distinct executions is absent. |
| CK-004 | OPEN | The registered test is a fingerprint unit test, not semantic-authority integration coverage. The required real route/DB scope, lifecycle, bound, replay/concurrency, handler-failure, failure-race, cache-isolation, and safe-output cases remain unproved. |
| CK-005 | RESOLVED | `@atlas/contracts` is declared directly by `@atlas/db`, with its workspace lockfile entry. The committed CFC checkpoint records the authoritative DB typecheck as passed. |

## Direct remediation regressions

No direct regression was identified in the bounded diff. This conclusion is limited by unavailable local dependency bootstrap; the committed CFC evidence reports its required build/typecheck commands passed in Compose.

## Decision

CK-002, CK-003, and CK-004 remain unresolved, so record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at remediation commit `04149dbba2585bd62364f3c4be5baaefebc04738`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This bounded verification consumes the continuation recorded by `HMN-IDSER-004-001`; it does not restart the broad review or authorize another CFC cycle.
