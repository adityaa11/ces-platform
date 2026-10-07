# CK verification: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Ticket:** `IDSER-012-01-01-staged-fair-local-perception-admission-and-cutover.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `1b9bc7332c0ecf757113e76aa053b7264cb9f103` (`fix: complete staged admission CFC evidence`)
- **Remediation base:** `6d2e73300e2e43500a40218ee93db4944eadd311`
- **CFC checkpoint:** `IDSER-BATCH-12-01-01-cfc-001.md`
- **Consumed HMN authorization:** `HMN-IDSER-012-01-01-001` (`CONTINUE_CURRENT_CFC`)
- **Review type:** Post-CFC verification of the original frozen finding only
- **Result:** `CHANGES_REQUIRED`

## Scope and decision

Verified only original clauses `CK-001.a` through `CK-001.f`, the CFC diff from
the recorded base, evidence required by those clauses, and direct regressions
in the changed admission paths. The ticket is `awaiting_review`; the reviewed
commit is the single commit after the stated CFC base. Tracked implementation
files are clean at that commit. Other worktree entries are unrelated feedback
artifacts and do not make the review target ambiguous.

Five clauses satisfy their frozen closure oracles. `CK-001.a` remains
unresolved: the remediation guards `PostgresPerceptionAuthority.create`, but
the legacy transactional continuation path still reaches `createWithSql`
without the same guard or the staged admission gate. This leaves a path for a
legacy scheduler to create a perception execution outside the shared two-
permit authority. The result is `CHANGES_REQUIRED` for that original clause;
this verification adds no new finding or oracle.

## Frozen clause outcomes

| Clause | Outcome | Verification evidence |
| --- | --- | --- |
| `CK-001.a` | **UNRESOLVED** | Expected: the scoped mixed-scheduler proof establishes that no legacy path can create an execution outside the staged two-permit authority. Actual: the added legacy negative calls `authority.create`; `createInTransaction` at `packages/atlas-db/src/perception-authority.ts:48` still directly calls `createWithSql`, and `packages/atlas-db/src/reconciliation-acceptance.ts:46` uses that path to enqueue the next document. No guard or gate is applied there. |
| `CK-001.b` | **RESOLVED** | `packages/atlas-db/tests/staged-perception-admission.integration.test.ts` creates concurrent projects through `PostgresAtlasProjectRepository.create`, then verifies a committed saturated project member is pending with no execution, grant, or job. This meets the frozen production-boundary oracle. |
| `CK-001.c` | **RESOLVED** | The same isolated PostgreSQL integration fixture runs separate concurrent production creates and concurrent refill transactions after authority re-instantiation; it asserts exactly two active executions, distinct admitted members, and monotonic turns. |
| `CK-001.d` | **RESOLVED** | The A(4)/B(5)/C(2) fixture retains first-turn, C-then-A refill, lowest-sequence, and lone-A borrowing assertions. Refill races after a new authority instance, and the durable turn order proves the frozen restart/concurrency fairness oracle. |
| `CK-001.e` | **RESOLVED** | The production fixture uses `createTransactionalPerceptionQueueProducer`; it observes one persisted grant and pg-boss job on success, no storage path in the queued payload, and no project, execution, grant, or job after the forced post-enqueue rollback. |
| `CK-001.f` | **RESOLVED** | `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` passed with the staged regression. Its Compose run created two clean projects through the production API and recorded distinct project/bundle/document identities, one perception execution/grant/job each, staged member state, and zero semantic executions or replay jobs. The staged cutover remained bounded without restoring immediate D1 or `ready_for_review`, satisfying the frozen staged-compatible regression oracle. |

## Validation and evidence

Executed during this verification:

- `corepack pnpm --filter @atlas/db typecheck` — PASS
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS
- `corepack pnpm --filter @atlas/core test` — PASS
- `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — PASS; staged Compose regression observations recorded
- `git diff --check 6d2e73300e2e43500a40218ee93db4944eadd311..HEAD` — PASS

The CFC checkpoint also records passing results for isolated-PostgreSQL
`migration:check`, `test:permissions`, `test:perception-authority`, and the
staged-admission integration test (2/2). This verification inspected those
reported results and the committed fixture; it did not rerun the isolated
database commands.

## Decision

`CHANGES_REQUIRED`. The original `CK-001.a` oracle is not proven because the
transactional continuation call path remains outside the legacy guard and
staged gate. Return control to human/planning authority under the bounded CK
workflow. This verification does not authorize another CFC cycle.
