# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `92ba3f5f08884367e3e403c2ace5530000b24a60` (`test(idser): prove semantic authority evidence`)
- Consumed HMN authorization: `HMN-IDSER-004-003` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- CK source: `IDSER-BATCH-04-98acb50-verification.md` (`CHANGES_REQUIRED`, CK-002 and CK-004)
- Review type: bounded verification of CK-002 and CK-004, the HMN-named evidence remediation, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 remains `awaiting_review`; the cycle-3 ticket checkpoint and CFC record name `HMN-IDSER-004-003` as consumed. `HEAD` is the bounded evidence-remediation commit. The tracked worktree is clean; pre-existing untracked review/context artifacts remain outside the target.
- Inspected the active HMN authorization, IDSER-004 cycle-3 checkpoint, cycle-3 CFC record, previous CK verification, and the `98acb50..92ba3f5` test/checkpoint diff.
- CK-002's PostgreSQL integration test now varies the selector's possible output after the first redemption. It asserts the first and second contexts are equal and that `selectionCalls` remains exactly one. The persisted snapshot is therefore returned without a second selector invocation, proving later selector availability cannot broaden this execution's retry.
- The registered PostgreSQL suite invokes `createSemanticInternalRoutes` with `PostgresSemanticAuthority`. It covers invalid service credential, wrong execution skill, oversized job object, and wrong result scope through the route; a capability mismatch directly against the PostgreSQL authority; same-byte cache execution binding; selector snapshot replay; identical result replay; conflicting result provenance; post-completion failure rejection; and denied Bridge SQL access.
- The suite does not implement the rest of the HMN-required matrix: skill-version mismatch; expired and cancelled executions; streamed request and serialized response byte-boundary cases; concurrent completion claims; handler/enqueue failure with assertions for no acknowledgement and no partial accepted state; duplicate notification and success/failure races; and safe error-output assertions. The current route test passes but cannot stand in for those omitted real route/DB assertions.
- Compose validation against the reviewed source passed: `docker compose up -d --build postgres atlas`; `docker compose exec -T atlas corepack pnpm --filter @atlas/db migrate` (already up to date); `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` (1 passed, 0 skipped); `docker compose exec -T atlas corepack pnpm --filter @atlas/core test` (18 assertions passed); Core and DB typechecks; and the Atlas app build. `git diff --check 98acb50..HEAD` passed.
- The remediation diff changes only integration-test evidence and checkpoint documentation. No direct regression to the CK-002 production authority behavior was identified.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-002 | RESOLVED | The test changes possible selector output after first redemption and asserts the persisted context is returned unchanged with no second selector call. |
| CK-004 | OPEN | Although the DB-backed route test now covers several authority paths, the named HMN matrix remains incomplete for lifecycle, streaming/response bounds, concurrency, handler/enqueue atomic failure, notification/failure races, and safe error output. |

## Direct remediation regressions

No direct regression was identified in the bounded evidence diff. The Compose suite, Core tests and typechecks, DB typecheck, app build, migrations, and diff check passed on the reviewed checkpoint.

## Decision

CK-002 is resolved, but CK-004 remains unresolved. Record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at `92ba3f5f08884367e3e403c2ace5530000b24a60`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This consumes `HMN-IDSER-004-003`; no further CFC cycle is authorized without a later explicit HMN authorization.
