# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `da7a30e3fd6be63588a3a6814931f8d1478aa3b4` (`test(idser): complete semantic authority evidence`)
- Consumed HMN authorization: `HMN-IDSER-004-010` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- Source CK artifact: `IDSER-BATCH-04-5496757-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
- Review type: bounded verification of CK-004, the HMN-010 evidence remediation, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 is `awaiting_review`, names batch `IDSER-BATCH-04`, and the cycle-7 ticket/CFC checkpoints identify `HMN-IDSER-004-010` as consumed. `HEAD` is the single cycle-7 remediation commit. The tracked worktree has no modifications; pre-existing untracked feedback and planning artifacts were preserved.
- Inspected the frozen ticket, HMN-010, the CFC cycle-7 record, commit `5496757..HEAD`, the semantic internal route and host middleware, and the relevant Core and DB tests.
- The real Compose HTTP integration test sends an exact-limit streamed context request and a one-byte-over request; source assertions show these are dispatched to the internal host at `127.0.0.1:3001`.
- The Core framework-neutral route test constructs an exactly-at-limit serialized context and asserts an over-limit context is rejected. It does not pass the oversized serialized response through the Compose HTTP host. Its extra-byte whitespace check parses the JSON before invoking the framework-neutral route, so it does not test streamed request-byte rejection; the separate DB integration test does that through HTTP.
- Persisted-cancelled checks assert context/result/failure status and no handler effect for result delivery. They do not inspect the returned cancellation error bodies for bounded size or exclusion of the sensitive categories named by HMN-010.
- The test source adds a failure-first contender held behind a test-local PostgreSQL advisory-lock trigger and retains the completion-first case, rollback, and conflicting completion checks. No direct production authority, schema, migration, or route-contract change is present in the reviewed diff.
- Compose validation was rerun after starting `postgres` and `atlas`: `@atlas/db migrate` and `migration:check` passed (already up to date); `@atlas/db test:semantic-authority` passed (1 passed, 0 failed, 0 skipped); `@atlas/core test` passed (19 passed, 0 failed, 0 skipped across its suites); Core and DB typechecks passed; `@atlas/app build` passed; and `git diff --check 5496757..HEAD` passed. The DB integration suite exercised the real Compose HTTP request route and PostgreSQL authority. These passing checks do not supply the absent HTTP serialized-response-boundary or cancellation-body assertions identified above.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-004 | OPEN | Request byte-boundary coverage and both terminal race orders were added. HMN-010's serialized-context HTTP boundary and persisted-cancellation redaction assertions remain absent. |

## Blocking finding

**CK-004 — Required bounded-response and cancellation-redaction evidence remains incomplete.** The ticket requires bounded serialized responses, safe error output, and real route/DB validation for oversized responses. HMN-010 further requires exact-at-limit and one-byte-over serialized-context coverage through the real internal HTTP path and bounded, redacted bodies for persisted-cancelled route failures. In `packages/atlas-core/tests/semantic-internal-route.test.ts`, the context byte assertions exercise only `createSemanticInternalRoutes`; in `packages/atlas-db/tests/semantic-authority.integration.test.ts`, the cancelled context/result/failure checks assert statuses but do not inspect those response bodies. The required correction is to exercise both serialized-context boundaries through the Compose HTTP route and assert the cancelled route bodies are bounded and exclude provider payloads, document material, credentials, grants, prompts, and SQL details, while retaining the no-handler-effect assertions.

## Direct remediation regressions

No direct regression was identified in the bounded remediation diff. All required Compose validations listed above passed.

## Decision

CK-004 remains unresolved, so record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at `da7a30e3fd6be63588a3a6814931f8d1478aa3b4`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This is the bounded verification authorized by `HMN-IDSER-004-010`; do not start another CFC cycle without a fresh explicit HMN authorization.
