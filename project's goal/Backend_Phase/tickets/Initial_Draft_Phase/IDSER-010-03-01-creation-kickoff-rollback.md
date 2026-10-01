# IDSER-010-03-01: Creation and kickoff rollback proof

- **State:** `approved` at `0fbce45`; **Review batch:** `IDSER-BATCH-10-03-01`.
- **Predecessors:** IDSER-010-02 `PASS`.
- **Consumes:** frozen PCC creation, IDSER-003 transaction/kickoff, BSS-006 transactional pg-boss producer and BSS-007 DocumentStore.
- **Execution environment:** Compose PostgreSQL with the existing authenticated project-create and project-repository integration harness.

## Authority and bounded outcome

Own only deterministic failure injection before semantic processing starts: DocumentStore write failure, Atlas project/bundle transaction failure, and initial perception enqueue failure. The creation operation is atomic: successful creation exposes the owner/project/workspace/empty Master/bundle/ordered members/D1 execution and one job together; any named failure exposes none of the transaction-owned graph or matching job. The proof must use the real authenticated creation boundary and actual pg-boss producer, not a post-commit callback or fixture-created partial state.

## Explicit non-authority

This child does not process a document, deliver a semantic result, map a technical failure to `Needs attention`, test provider/schema/evidence rejection, run multi-document scenarios, concurrency/replay, or browser regression. It must not redesign the PCC intake, DocumentStore, queue, migration, lifecycle state, or source-grant model.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-03-01-01 | Successful authenticated create commits the exact initial graph, D1 perception execution/source authority and one durable pg-boss job in one transaction. | Existing Compose project-repository/create integration with independent DB/job observation. **PASS iff** all committed identities and job facts coexist and no post-commit scheduler is required. |
| RC-010-03-01-02 | DocumentStore failure exposes no Atlas project graph, bundle/member, execution or job. | Controlled DocumentStore failure through real create boundary with before/after scoped DB and queue snapshots. **PASS iff** every owned row/job count is zero after rejection. |
| RC-010-03-01-03 | Transaction or initial enqueue failure rolls back all same-transaction state and leaves unrelated rows/jobs unchanged. | Controlled producer/transaction failure fixture with target and control snapshots. **PASS iff** no partial target state/job exists and control is byte-for-byte equivalent. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-010-03` / `REV-010-03` protects authenticated create identity, source storage and atomic queue authority. Mandatory negatives are no post-commit enqueue, no partial graph, no cross-project/control mutation, and no substitute storage/queue. Direct regressions are PCC create, project repository, DocumentStore and BSS-006 queue tests.

CFC is limited to the create transaction, existing test seam, or its snapshots. HMN may select one rollback snapshot/oracle or job-atomicity discrepancy only. A semantic-stage failure, worker/provider change, lifecycle mapping or browser proof belongs elsewhere.

## Hard stop and required handoff

Before `awaiting_review`, every row is `PROVEN` with exact Compose commands and target/control DB plus queue evidence. Creation/kickoff rollback authority is complete; 010-03-02 alone owns semantic failure containment. Record `Internal readiness: READY_FOR_CK`; CK reviews one atomicity contract.
