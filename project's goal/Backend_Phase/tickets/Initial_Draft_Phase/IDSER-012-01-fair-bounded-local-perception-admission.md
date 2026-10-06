# IDSER-012-01: Fair bounded local perception admission foundation

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-01`.
- **Predecessors:** frozen BSS-006, BSS-009/01/02, BSS-V2-004-01/02 and approved IDSER-003, IDSER-008, IDSER-010-04/05.
- **Consumes:** the existing manifest, perception execution/grant, pg-boss and Docling route contracts; it does not modify historical tickets.
- **Execution environment:** Compose Postgres, Atlas, Bridge and persistent private Docling Serve, with focused DB/Bridge/perception tests and controlled supported digital PDFs.

## Authority and bounded outcome

Establish only the safe local Docling admission foundation. Atlas owns one durable, race-safe bundle-fair admission gate with global capacity **2**. It admits at most two non-terminal perception executions, creates a fresh existing BSS-009 source grant and pg-boss job only when admitting a member, and selects the lowest pending manifest sequence inside the least-recently-admitted eligible bundle. Eligible bundles are `waiting`/`processing`, have a pending member, and are not failed/`needs_attention`.

Split the current shared Bridge worker setting into independently bounded perception and background knobs. Configure and qualify the actual Docling v1.36.0 local controls explicitly: `DOCLING_SERVE_ENG_KIND=local`, `DOCLING_SERVE_ENG_LOC_NUM_WORKERS=2`, `UVICORN_WORKERS=1`; separately bound CPU/thread settings. The reviewed profile is Atlas permits 2 / Bridge perception concurrency 2 / Docling local workers 2. A mismatch fails readiness or qualification rather than silently inheriting a default.

The transaction acquires an Atlas-owned singleton gate row with `SELECT … FOR UPDATE`, counts non-terminal executions (`queued`, `fetching_source`, `perceiving`, `normalizing`, `delivering_result`, plus any equivalent non-terminal state), fills permits fairly, creates execution/grant/job/member `perception_queued` state atomically, then commits. The durable manifest is the backlog; pg-boss contains admitted executable work only.

## Explicit non-authority

Do not activate independent multi-document perception; remove reconciliation-driven successor scheduling; redesign semantic extraction, semantic state/schema/fairness, reconciliation selection or single-writer behavior; alter Ready for Review; add provider quota work, Anoman, Redis/RQ/Kafka, another daemon, plan/user priority, raw source transport, Master/CES/chat/publication, or a recovery design for failed bundles. `reconciliation-acceptance.ts` may receive direct regression coverage only.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-01-01 | One explicit 2/2/2 local profile controls Docling, Bridge perception and Atlas admission; background concurrency stays independent. | Effective Compose config, live Docling engine inspection, Bridge configuration/readiness and focused configuration tests. **PASS iff** actual local workers and perception concurrency are 2, `UVICORN_WORKERS=1`, misleading ignored controls are absent, and a mismatch fails readiness/qualification. |
| RC-012-01-02 | No more than two admitted perception executions reach Docling. | Hold two supported conversions in flight, offer a third eligible member, and observe gate/execution/job state. **PASS iff** two may transmit, the third has no execution/grant/job until a durable terminal transition frees a permit, and observed Docling concurrency never exceeds 2. |
| RC-012-01-03 | Admission is bundle-fair, stable and elastically borrowable. | A(4), B(5), C(2) controlled fixture plus one-active-bundle fixture. **PASS iff** the least-recently-served eligible bundle turns before an already-served bundle turns again under contention; within bundle selection is pending sequence; A can use both slots while alone; no active conversion is preempted. |
| RC-012-01-04 | Admission atomically creates execution, fresh scoped grant, job and member state; waiting creates none. | Transaction rollback after queue enqueue, persisted job/grant inspection, and queue-payload inspection. **PASS iff** rollback exposes none of the four effects, pending members have no expiring grant/job, admitted jobs retain existing BSS-009 request shape, and no raw bytes/storage key is transported. |
| RC-012-01-05 | Creation/release races, duplicate delivery, restart and terminal failure preserve capacity, identity and logical effects. | Concurrent creation/slot-release, acknowledgement-loss/restart and terminal failure cases with scoped DB/queue evidence. **PASS iff** max admitted remains 2, one logical execution/version and completion/cache effect exist, the failed bundle becomes `needs_attention`, its pending members stop eligibility, and another eligible bundle can use the released permit. |
| RC-012-01-06 | The exact two-worker route remains qualified. | Real warm two-concurrent supported digital PDFs compared with sequential controls. **PASS iff** both outputs are parser-valid materially deterministic `NormalizedDocument v1`, no concurrency-specific corruption occurs, latency remains within the inherited warm gate or raises an explicit performance decision, CPU/RAM observations are recorded, and no CUDA/remote service appears. |

## Security, repair and handoff

**Security readiness: applicable.** Preserve `BOUNDARY-IDSER012-*` and expose `SEAM-IDSER012-LOCAL-CAPACITY`, `SEAM-IDSER012-FAIR-ADMISSION`, and `SEAM-IDSER012-GRANT-JIT`. Required negatives: Bridge DB-role denial for the new gate metadata, no second broker, no in-memory authority, no queue source bytes/paths, no grant for pending work, no over-admission after replay, and no failed-bundle refill. `REV-IDSER012-01` requires runtime/config evidence; `REV-IDSER012-02` requires transaction, permission and payload evidence; `REV-IDSER012-03` requires fairness/race/replay evidence.

Before `awaiting_review`, execute the source matrix: effective config; engine/concurrency/readiness inspection; one-bundle and A/B/C fixtures; held-third-call; creation race; rollback; restart; Docling readiness recovery; terminal failure; grant-expiry regression; Bridge permission denial; inherited BSS-006/BSS-009/BSS-V2-004 regressions; IDSER-010-04/05 regressions; and `git diff --check`. Record `Internal readiness: READY_FOR_CK`. CK answers only whether the fair bounded local gate is safe; IDSER-012-02 owns activation.
