# CK review: IDSER-010-03-01 / IDSER-BATCH-10-03-01

- **Ticket:** `IDSER-010-03-01-creation-kickoff-rollback.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `bbde4b445039fdd2c15d6683ee4245162fe4aa2f` (`test(idser): prove creation kickoff rollback`)
- **Checkpoint:** `project's goal/feedback/IDSER-BATCH-10-03-01-go-checkpoint.md`
- **Result:** `CHANGES_REQUIRED`
- **Review type:** First CK review

## Target and scope

The ticket set lists IDSER-BATCH-10-03-01 as the executable child checkpoint. The current `HEAD` matches the committed checkpoint. The only tracked working-tree change under the application/database paths is generated `apps/atlas/tsconfig.tsbuildinfo`; no in-scope test, implementation, ticket, or checkpoint content is uncommitted, so the committed target is unambiguous. Other working-tree artifacts are outside this ticket's implementation scope.

Reviewed only the child ticket's three Review Contract rows: successful authenticated creation and atomic initial kickoff; DocumentStore failure containment; and transaction/enqueue rollback with a preserved control. IDSER-010-03-02 semantic-stage failures, worker/provider behavior, lifecycle changes, and unrelated regressions remain outside this review.

## Evidence and Review Contract

| Row | Ticket authority | Evidence reviewed | Status |
|---|---|---|---|
| RC-010-03-01-01 | IDSER-010-03-01, Review Contract row 01: authenticated create commits the initial project graph, D1 execution/source authority, and durable pg-boss job atomically. | The checkpoint records the real `/api/projects` integration and independent Atlas/pg-boss observations. In `apps/atlas/tests/project-create.integration.test.mjs`, the successful path checks authenticated owner/project/workspaces, stored source metadata, waiting bundle, D1 member, one matching job, one execution and source grant, and no cache/derived assets. The repository integration gates enqueue inside the transaction and observes zero rows/job before commit and the complete graph/job after release. The GO artifact records the exact Compose runs and passing counts; commands were not rerun during this review. | PROVEN |
| RC-010-03-01-02 | IDSER-010-03-01, Review Contract row 02: DocumentStore failure through the real create boundary leaves no transaction-owned graph or matching job; proof uses before/after scoped DB and queue snapshots. | `apps/atlas/tests/project-create.integration.test.mjs:39-63` asserts the real boundary's bounded 500 response and zero project/member/workspace/document/bundle/member/execution/grant rows. Its queue observation compares only the aggregate count of every `atlas-document-perception-v1` row before and after; it does not snapshot job identity/content or establish that no matching job was added for this request. The GO artifact records storage-failure validation as passing, but the committed assertion does not prove the ticket's required scoped queue observation. | IMPLEMENTED_UNPROVEN |
| RC-010-03-01-03 | IDSER-010-03-01, Review Contract row 03: transaction or initial enqueue failure leaves no target state/job and preserves an unrelated control. | `packages/atlas-db/tests/project-repository.integration.test.ts:120-178` uses the real transactional pg-boss producer, observes no uncommitted graph/job while enqueue is gated, forces a post-enqueue transaction failure, checks zero target rows and matching job, then compares serialized control graph/job snapshots byte-for-byte. The GO artifact records the focused Compose test and authenticated database-failure variant as passing. Commands were not rerun during this review. | PROVEN |

## Findings

### CK-001 — DocumentStore failure queue evidence is not scoped

The ticket requires a queue snapshot that proves the DocumentStore failure left no matching job. The committed authenticated create test compares a queue-wide job count. Equal aggregate counts do not establish that the tested request added no matching job, because a job could be added while another queue row disappears. This is an evidence deficiency in the committed assertion; the checkpoint's recorded passing run does not close it.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|
| CK-001.a | IDSER-010-03-01 Review Contract row 02: “DocumentStore failure exposes no Atlas project graph, bundle/member, execution or job”; required proof is a controlled DocumentStore failure through the real create boundary with before/after scoped DB and queue snapshots; PASS iff every owned row/job count is zero after rejection. | `apps/atlas/tests/project-create.integration.test.mjs:41,61-62` compares only the aggregate count for all perception jobs, rather than evidence scoped to the failed create/job identity. | **PASS iff** the real authenticated DocumentStore-failure case proves zero transaction-owned Atlas rows and proves no job matching the failed create was added. Evidence must be the committed integration assertion plus its passing Compose execution, with the queue observation scoped to the failed create or an exact before/after snapshot of the relevant queue rows that makes any added matching job observable. | Authenticated project creation's DocumentStore-failure rollback and initial perception-job atomicity only. |

## Validation and decision

- Inspected the committed diff from predecessor `52545a9` to `bbde4b4`; it changes the authenticated creation integration test, project-repository integration test, ticket state, and GO checkpoint only.
- Inspected the committed integration assertions and checkpoint-reported Compose evidence. The GO artifact records successful focused project-create runs for success, storage failure, and database failure, plus `@atlas/db test:project-repository` passing 3/3. These commands were not rerun as part of CK.
- No independent validation command was executed during this review.

`IDSER-BATCH-10-03-01` receives `CHANGES_REQUIRED` because CK-001.a remains unproven against the frozen row 02 oracle. Keep the ticket at `awaiting_review`. Any CFC remediation is limited to CK-001.a and its direct-regression boundary; this artifact does not authorize remediation by itself.
