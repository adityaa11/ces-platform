# IDSER-012-01: Fair bounded local perception admission foundation

- **State:** `planned`; **Review batch:** `IDSER-BATCH-12-01`.
- **Predecessors:** frozen BSS-006, BSS-009/01/02, BSS-V2-004-01/02 and approved IDSER-003, IDSER-008, IDSER-010-04/05.
- **Consumes:** the existing immutable manifest, perception execution/grant, pg-boss and qualified Docling route contracts; it does not edit historical ticket text/evidence.
- **Execution environment:** Compose Postgres, Atlas, Bridge and persistent private Docling Serve, with focused DB/Bridge/perception tests and controlled supported digital PDFs.

## Authority and bounded outcome

Establish and activate the **perception-only** staged admission lane for newly marked bundles. Atlas owns one durable, race-safe bundle-fair admission gate with global local capacity **2**. The gate may admit multiple documents from one bundle when capacity would otherwise be idle, so IDSER-012-01 deliberately permits multi-document perception. It must still stop before semantic extraction.

Add an Atlas-owned persisted admission-policy/version marker for the new bundle shape (for example `staged-v1` or an equivalent explicit identity). The new gate selects only staged-policy bundles. Existing historical bundles are never silently adopted. Staged activation must fail closed while any non-terminal legacy sequential bundle can still create perception work outside the gate; no mixed active scheduler may bypass the same two-slot local resource bound.

Project creation changes only for staged-policy bundles:

```text
persist project/workspaces/documents/bundle/manifest
    -> durable members start pending
    -> invoke fair admission gate in the same Atlas transaction
    -> if permit exists, admit eligible work
    -> if both permits are occupied, commit with zero perception execution/grant/job
```

A successful project commit therefore guarantees durable perception eligibility, not immediate D1 execution. No source grant may exist merely because a document is waiting.

The gate owns a durable monotonic admission turn. Each admission records the selected bundle's last admission turn. Selection is deterministic: never-admitted eligible bundles first, then lowest last-admission turn, then stable creation/identity tie-breakers; inside a bundle select the lowest pending manifest sequence. Do not use wall-clock recency as the fairness authority.

Split the current shared Bridge worker setting into independently bounded perception and background knobs. Configure and qualify the actual Docling v1.36.0 local controls explicitly: `DOCLING_SERVE_ENG_KIND=local`, `DOCLING_SERVE_ENG_LOC_NUM_WORKERS=2`, `UVICORN_WORKERS=1`; separately bound CPU/thread settings. The reviewed profile is Atlas permits 2 / Bridge perception concurrency 2 / Docling local workers 2. A mismatch fails readiness or qualification rather than silently inheriting a default.

Admission uses one Atlas-owned singleton serialization row/record with `SELECT ... FOR UPDATE` or an equivalently reviewable PostgreSQL lock. In one transaction it computes free permits from non-terminal perception executions, selects the next eligible staged bundle/member, creates the existing BSS-009 perception execution and fresh grant, transactionally enqueues the existing pg-boss perception job, writes member `perception_queued`, advances the durable admission turn, and repeats until capacity is full or no eligible member remains. The durable manifest is the backlog; pg-boss contains admitted executable work only.

Perception acceptance for this foundation persists the accepted `NormalizedDocument v1`, completes the perception execution, moves the member to a durable `perceived` processing state, and invokes the same admission gate to refill the freed permit. Terminal perception failure preserves IDSER-008: the member/bundle becomes `needs_attention`, the bundle's pending members become ineligible, and the freed permit may be offered to another eligible bundle. `perceived` must be recognized by Core/DB lifecycle reads as active processing and may continue to project to the existing broad extracting/processing project-card state; this ticket adds no new UI state.

## Explicit non-authority

Do not release semantic extraction, create semantic jobs, remove or redesign semantic schemas, redesign reconciliation selection or relationship semantics, alter Ready for Review, add provider quota work, Anoman, Redis/RQ/Kafka, another daemon, plan/user priority, raw source transport, Master/CES/chat/publication, or a recovery design for failed bundles. The terminal perception checkpoint remains authoritative for this child. Reconciliation must not schedule perception for staged-policy bundles; historical sequential code may remain only for inactive legacy policy.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-012-01-01 | One explicit 2/2/2 local profile controls Docling, Bridge perception and Atlas admission; background concurrency stays independent. | Effective Compose config, live Docling engine inspection, Bridge configuration/readiness and focused configuration tests. **PASS iff** actual local workers and perception concurrency are 2, `UVICORN_WORKERS=1`, misleading ignored controls are absent, and a mismatch fails readiness/qualification. |
| RC-012-01-02 | Staged cutover is explicit and cannot coexist with an active legacy scheduler that bypasses the gate. A saturated project creation may commit with all members pending and no execution/grant/job. | Migration/policy inspection plus active-legacy negative and saturated-create fixture. **PASS iff** only staged-policy bundles are gate-eligible, activation fails closed with active incompatible legacy work, historical rows are not silently adopted, and project persistence does not require an immediate D1 job when capacity is full. |
| RC-012-01-03 | No more than two admitted non-terminal perception executions occupy the local route. | Hold two supported conversions in flight, offer a third eligible member, and observe gate/execution/job state. **PASS iff** two may transmit, the third has no execution/grant/job until a durable terminal transition frees a permit, and observed Docling concurrency never exceeds 2. |
| RC-012-01-04 | Admission is bundle-fair, deterministic and elastically borrowable. | A(4), B(5), C(2) controlled fixture plus one-active-bundle fixture and persisted turn inspection. **PASS iff** durable turn order gives never/least-recently-served eligible bundles a turn before an already-served bundle turns again under contention; within-bundle selection is pending sequence; A can use both slots while alone; no active conversion is preempted. |
| RC-012-01-05 | Admission atomically creates execution, fresh scoped grant, job and member state; waiting creates none. | Transaction rollback after queue enqueue, persisted job/grant inspection, and queue-payload inspection. **PASS iff** rollback exposes none of the effects, pending members have no expiring grant/job, admitted jobs retain the existing BSS-009 request shape, and no raw bytes/storage key is transported. |
| RC-012-01-06 | Completion/failure/replay refills capacity without duplicate logical work. | Concurrent creation/slot-release, duplicate delivery, acknowledgement-loss/restart and terminal-failure cases with scoped DB/queue evidence. **PASS iff** max admitted remains 2, one logical perception execution/version and completion/cache effect exist per admitted document, successful members end `perceived`, failed bundles become `needs_attention` and stop eligibility, and another eligible bundle can use a released permit. |
| RC-012-01-07 | The exact two-worker Docling route remains qualified under concurrent conversion. | Real warm two-concurrent supported digital PDFs compared with sequential controls. **PASS iff** both outputs are parser-valid materially deterministic `NormalizedDocument v1`, no concurrency-specific corruption occurs, latency remains within the inherited warm gate or raises an explicit performance decision, CPU/RAM observations are recorded, and no CUDA/remote service appears. |

## Security, repair and handoff

**Security readiness: applicable.** Preserve `BOUNDARY-IDSER012-*` and expose `SEAM-IDSER012-LOCAL-CAPACITY`, `SEAM-IDSER012-FAIR-ADMISSION`, `SEAM-IDSER012-GRANT-JIT` and `SEAM-IDSER012-STAGED-CUTOVER`. Required negatives: Bridge DB-role denial for new admission metadata, no second broker, no in-memory authority, no queue source bytes/paths, no grant for pending work, no over-admission after replay, no mixed active scheduler, and no failed-bundle refill.

Before `awaiting_review`, execute the source matrix: effective config; live engine/concurrency/readiness inspection; policy/cutover migration; saturated project creation; one-bundle and A/B/C fixtures; held-third-call; creation/refill races; rollback; restart; Docling readiness recovery; terminal failure; grant-expiry regression; Bridge permission denial; inherited BSS-006/BSS-009/BSS-V2-004 regressions; IDSER-010-04/05 regressions; project-card active-state regression for `perceived`; and `git diff --check`. Record `Internal readiness: READY_FOR_CK`. CK answers only whether the staged, fair, bounded perception lane is safe; IDSER-012-02 owns semantic release.
