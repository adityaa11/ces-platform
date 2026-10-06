# CK review: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72` (`feat(idser): add semantic execution authority`)
- Frozen ticket reference: IDSER-004 at `awaiting_review`; its review checkpoint names this implementation commit and requests CK before IDSER-005/006.
- Dependencies: IDSER-001 approved at `a64c62b`, IDSER-002 approved at `5bf1bbb`, and IDSER-003 approved at `3dbd7dc`, as recorded in the IDSER ticket-set README.
- Review type: first consolidated CK review.
- Result: `CHANGES_REQUIRED`

## Review preconditions and evidence

- `HEAD` is `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`. The tracked worktree is clean; pre-existing untracked review/context documents do not alter the review target. No earlier IDSER-BATCH-04 CK artifact exists.
- Reviewed IDSER-004 scope, acceptance criteria, validation obligations, mandatory `REV-READY-IDSER-004-01/02/03` bindings, and the committed semantic route, authority, and test changes. Checked the consumed IDSER-002 semantic job/context/result contracts and the IDSER-003 transaction boundary.
- `docker compose build atlas` passed.
- In a fresh one-off Compose container, `corepack pnpm --filter @atlas/core test` failed: `semantic routes authenticate and fail closed when acceptance is unavailable` expected status 409 but received 204 at `packages/atlas-core/tests/semantic-internal-route.test.ts:18`. The other Core test files in that command passed (17 assertions across their reported suites).
- In fresh Compose containers, `corepack pnpm --filter @atlas/core typecheck` passed; `corepack pnpm --filter @atlas/db typecheck` failed at `packages/atlas-db/src/semantic-authority.ts:2` with `TS2307: Cannot find module '@atlas/contracts' or its corresponding type declarations`; and `corepack pnpm --filter @atlas/app build` passed.
- `git diff --check 4c2ba356dfe760b3bcfc6c94d017c767d1444b72^..4c2ba356dfe760b3bcfc6c94d017c767d1444b72` passed.
- `@atlas/db` has no registered semantic-authority integration test script. The required real route/DB scope, capability, replay/concurrency, cache-reuse, failure-race, and safe-output matrix was therefore not demonstrated by this checkpoint.

## Findings

| ID | Ticket authority | Evidence and affected location | Required correction |
|---|---|---|---|
| CK-001 | IDSER-004 acceptance criterion 3; scope requirement to centralize canonical completion fingerprints and reject conflicting replay | `packages/atlas-db/src/semantic-authority.ts:7,34,40`. `JSON.stringify(value, Object.keys(value).sort())` applies the top-level property allowlist recursively. For a result envelope, nested `scope`, `skill`, `provider`, and `result` properties are omitted unless their names happen to occur at the envelope root; candidate assertions and other nested result content do not affect the digest. Different semantic results can therefore receive the same completion fingerprint and be acknowledged as identical completed replay. | Replace the shallow property-list serialization with a canonical recursive serialization/hash that includes every validated nested field. Add tests showing identical envelopes replay idempotently while changes to nested scope, provenance, and semantic result content conflict. |
| CK-002 | IDSER-004 acceptance criteria 1-2; scope requirement for persisted reconciliation context and reproducible selected-neighborhood identity | `packages/atlas-db/src/semantic-authority.ts:21`. `redeem` explicitly rejects every non-extraction execution with “Reconciliation context is unavailable until IDSER-007 selection authority is implemented.” The authority has no injected context/selection port. Thus a valid reconciliation job cannot receive its authorized candidate neighborhood, and selected context cannot be bound for replay as required by the ticket. | Add the bounded IDSER-007 selection/context authority port and bind its selected IDs or snapshot plus fingerprint to the persisted execution. Prove same-execution retry is stable and later candidate availability cannot broaden the context. |
| CK-003 | IDSER-004 scope requirement: “a hash-keyed cache hit from another execution cannot supply mismatched artifact/execution identity”; validation requirement for normalized-cache reuse across distinct executions | `packages/atlas-db/src/semantic-authority.ts:16,22-23`. The query selects a cache row by source hash and perception capability identity, then validates only normalized `artifactId` and `sourceSha256`. It does not bind the cached normalized document's `executionId` to the joined `m.perception_execution_id`, so a cache row produced for another perception execution of the same artifact can be returned as this execution's context. | Select and validate the exact perception execution identity represented by the normalized document (and retain artifact/source checks). Add real PostgreSQL coverage for same-byte cache reuse across distinct executions and assert no cross-execution identity leakage. |
| CK-004 | IDSER-004 Validation: real route/DB tests for the listed auth, capability, scope, lifecycle, bound, replay, concurrency, failure, and cache cases; `REV-READY-IDSER-004-01/02/03` | `packages/atlas-core/tests/semantic-internal-route.test.ts:10-20` is the only new test. It uses a fake authority rather than PostgreSQL and covers a bad credential, one mocked context success, and fail-closed delivery. Its own fail-closed assertion fails because the fake `deliver` returns without invoking the supplied rejecting handler. `packages/atlas-db/package.json` registers no semantic-authority test. Required negative and concurrency cases are not evidenced. | Correct the route test double so it exercises the acceptance-handler contract and passes. Add registered real route/DB integration coverage for the ticket's required scope, capability, expiry/completion, replay/concurrency, handler failure, cross-execution cache, failure race, and safe-output cases. |
| CK-005 | IDSER-004 explicit Core/DB typecheck validation and implementation checkpoint evidence | `packages/atlas-db/src/semantic-authority.ts:2` imports `@atlas/contracts`, but `packages/atlas-db/package.json` does not declare that workspace dependency. The required DB typecheck fails with TS2307. | Declare the direct workspace dependency (and update the frozen lockfile if required) so the DB package typechecks in the authoritative Compose environment. |

## Scope-change observations

None. The findings are repairable within IDSER-004's frozen authority, context, and validation scope; no provider/runtime/deployment or architecture decision is needed.

## Decision

IDSER-004 / `IDSER-BATCH-04` receives `CHANGES_REQUIRED` at `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`. Keep IDSER-004 at `awaiting_review`. CFC may address only CK-001 through CK-005; IDSER-005 and IDSER-006 remain gated on a later IDSER-004 `PASS`.
