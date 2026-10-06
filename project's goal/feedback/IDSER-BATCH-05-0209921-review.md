# CK review: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8` (`feat(idser): add semantic worker replay dispatcher`)
- Frozen ticket reference: IDSER-005 at `awaiting_review`; its review checkpoint records the reviewed implementation commit. The later documentation-only commit `cff2524` records that checkpoint and does not alter the review target.
- Dependencies: IDSER-001, IDSER-002, and IDSER-004 are recorded as `PASS` prerequisites by the frozen ticket.
- Review type: first consolidated CK review.
- Result: `CHANGES_REQUIRED`

## Review preconditions and evidence

- `0209921` is an ancestor of current `HEAD` (`cff2524`). The tracked implementation target is unambiguous. Pre-existing untracked feedback artifacts do not modify the reviewed commit. No earlier IDSER-BATCH-05 CK artifact is present.
- Reviewed the frozen scope, execution contract, all six acceptance criteria, validation obligations, and mandatory `REV-READY-IDSER-005-01/02/03` bindings. Inspected only the committed semantic dispatcher, replay adapter, Atlas HTTP client, worker composition/lease boundary, and directly consumed semantic authority contracts.
- `git diff --check 0209921^..0209921` and `git show --check 0209921` passed.
- In the authoritative Compose environment, `corepack pnpm --filter @atlas/agents-bridge typecheck` passed. `corepack pnpm --filter @atlas/agents-bridge test` passed all 28 tests, including the two focused semantic-worker tests.
- The passing semantic tests are in-memory unit doubles: `apps/agents-bridge/tests/semantic-worker.test.ts` supplies a structural fake for `MistralProvider`, replay, and client. There is no committed semantic HTTP-client test or semantic worker/DB/Atlas integration test. `worker.integration.test.ts` covers generic and perception paths only. Consequently the required mocked-HTTP structured path, both real skills, delivery/restart/fencing race matrix, and configuration/cancellation matrix are not demonstrated.

## Findings

| ID | Ticket authority | Evidence and affected location | Required correction |
|---|---|---|---|
| CK-001 | Execution contract: immutable staged result, lost-lease safety, and “A superseded worker lease cannot overwrite the winning result or retire another worker's replay record”; acceptance criteria 2-3; `REV-READY-IDSER-005-01` | `apps/agents-bridge/src/semantic-worker.ts:21-27` stages the result and catches every subsequent error whenever context exists. If a concurrent or superseding worker already staged a different valid envelope, `apps/agents-bridge/src/semantic-result-replay.ts:18-21` correctly raises `Semantic replay staging conflicts...`; the broad catch then calls `client.fail(...)`. Atlas's consumed authority marks that execution `failed` (`packages/atlas-db/src/semantic-authority.ts:76-84`), so the winning staged envelope is subsequently rejected rather than accepted. The replay adapter receives no lease owner/generation, so it cannot distinguish or fence a stale claimant. This creates semantic ambiguity from a staging race rather than safely redelivering the durable winner. | Carry the BSS-006 lease/fencing identity through semantic staging, delivery, completion, and cleanup. On an already-staged same execution, reload and redeliver the immutable winning envelope without a provider call; do not convert a stale/conflicting claimant into an Atlas terminal failure. Preserve a bounded integrity failure only for a true idempotency/execution conflict that has no winning same-execution envelope. Add the required concurrent-claim, lease-expiry, conflicting-stage, acknowledgement-loss, and restart tests proving one logical Atlas effect and safe cleanup. |
| CK-002 | Validation requirements; acceptance criteria 1, 3, 4, and 5; `REV-READY-IDSER-005-01/02/03` | The checkpoint claims a Compose semantic suite, but committed `apps/agents-bridge/tests/semantic-worker.test.ts` has only two in-memory tests. Its `provider` is a cast object rather than `MistralProvider`, so it does not exercise mocked HTTP `structured(...)`, configured credentials, limits, or real extraction/reconciliation skill definitions. No test drives `createAtlasSemanticClient`, worker composition, replay SQL, or Atlas acceptance handoff. Therefore the required evidence for both skills, acknowledgement loss/delivery outage/restarts, duplicate/fenced claims/conflicting stages, missing or invalid credentials, malformed schema, request/response bounds, timeout, cancellation, and orderly stop is absent. | Add registered, deterministic Compose integration coverage using mocked Mistral HTTP responses through the real provider and both production skills. Exercise the real Bridge replay ledger, authenticated Atlas context/result/failure routes, worker restart and lease races, and handler-unavailable delivery. Cover the stated configuration, bound, timeout, cancellation, and shutdown cases without secrets; assert provider call counts and Bridge/Atlas terminal states for each required crash window. |

## Scope-change observations

None. Both findings are repairable within IDSER-005's frozen worker, replay, failure, and validation authority; they do not require a provider, deployment, queue, or architecture decision.

## Decision

IDSER-005 / `IDSER-BATCH-05` receives `CHANGES_REQUIRED` at `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`. Keep IDSER-005 at `awaiting_review`. A CFC remediation may address only CK-001 and CK-002; a subsequent CK is limited to verification of those original findings.
