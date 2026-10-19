# IDSER-012-03-03-01 — Immutable plan/handoff persistence

- **State:** `awaiting_review`; GO consumed IDSER-012-03-02-03 CK `PASS` at `c0d3d1e1`.
- **Batch:** `IDSER-BATCH-12-03-03-01`.
- **Parent:** [IDSER-012-03-03 split map](IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md).
- **Dependencies:** `-03-02-03` CK `PASS`; existing Atlas transaction/auth conventions.

## Outcome

Persist a qualified unpublished corpus proposal as one immutable versioned document plan and N immutable scoped `PlannedSemanticCorpusHandoff` records atomically. This child owns no GHR output body. **HARD STOP before GHR issue/outbox/dispatch/ack, BSS work/attempt/reservation, SEM intake, or semantic/reconciliation effects.**

## Authorized scope

Use Atlas-owned repository/transaction patterns and a narrowly scoped new Atlas persistence table/repository only if required. Freeze canonical encoding/hash version, locator ordering, document-plan and batch-ID derivation, idempotency key, unique constraints, conflict-on-different-content rejection, cancellation/replan ancestry and rollback rules. Prevent hash cycles: parent plan references stable batch IDs; per-batch records bind the completed parent plan hash. Independently replay the hash from immutable stored content, never mutable current policy.

Persist project/workspace/bundle/document, source/normalized-cache/perception identity, accepted asset/REL revisions, every owned/context/deferred locator fact, semantic schema/estimator limits, BSS source/enforcement/profile/plan versions, and each exact bounded envelope. Store references/hashes only: no raw PDF/text/image, prompt, storage key, credential or provider response. `NO_ELIGIBLE_SOURCE` writes neither plan nor handoff.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030301-01 | One approved N-batch proposal atomically yields one immutable plan and exactly N scoped handoffs with complete parent membership, all bound identities and independently replayable noncyclic hashes. |
| RC-012030301-02 | Same accepted fingerprints/idempotency key returns exactly the same plan and refs; conflicting content, stale policy/source/hash, foreign scope and incomplete ownership reject or require a distinct authorized version. |
| RC-012030301-03 | Concurrent claims, crash-before-commit, rollback, restart, cancellation, lost postcommit caller acknowledgement and replan ancestry never expose a completed plan missing a handoff or mutate a prior version. |
| RC-012030301-04 | Persistence tests prove non-inert durable writes and exact zero GHR outbox/issue/delivery/ack, BSS work/attempt/reservation/send, SEM intake/fragment, and Atlas semantic/reconciliation truth effects. |

## Security Readiness

- `SR-012030301-T1`: qualified immutable proposal → atomic scoped Atlas plan/handoffs.
- `SR-012030301-C1`: no Bridge truth write, scheduler/outbox, mutable hash recomputation, raw payload/secret metadata or downstream eligibility state.
- `SR-012030301-R1`: CK replays identity and failure recovery under real transactions; `SR-012030301-R2` verifies access isolation and forbidden-effect counters.

## Evidence and hard stop

Use real repository transactions, migration/role evidence if a table is added, durable record IDs/hashes and crash/concurrency/cancellation traces. Missing Atlas transaction/role authority is `BLOCKED_AUTHORITY`; it does not authorize Bridge persistence. A CK `PASS` exposes persisted records only to `-03-03-02`'s non-delivering reader.
