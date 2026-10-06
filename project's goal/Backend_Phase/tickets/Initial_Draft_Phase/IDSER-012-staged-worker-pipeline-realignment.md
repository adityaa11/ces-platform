# IDSER-012: Staged worker pipeline realignment

- **State:** `planned`; **Review family:** `IDSER-BATCH-12`.
- **Predecessors:** approved IDSER-003, IDSER-006 through IDSER-008, IDSER-010-04 and IDSER-010-05; BSS-006, BSS-009/01/02 and BSS-V2-004-01/02 remain frozen inherited contracts.
- **Source authority:** [Staged worker pipeline / Docling admission context](../../atlas-staged-worker-pipeline-docling-admission-context.md), sections 1–26. The context records the design rationale; where later branch inspection exposed a concrete lifecycle seam, the frozen child Review Contracts below are authoritative for implementation.
- **Type:** non-executable umbrella and lifecycle amendment. Its children, not this record, are GO targets.

## Authority and lifecycle amendment

Own the deliberately staged replacement of the production execution shape: independently admitted perception, independently executable semantic extraction, durable semantic-ready work, ready-order reconciliation with one writer per bundle, and final composition proof. Preserve Atlas as lifecycle/admission authority, pg-boss as the only durable execution broker, and the Bridge as an executor without trusted Atlas-table write access.

For **new staged production execution only**, this family supersedes these procedural historical rules without editing their approved text or evidence:

- IDSER-003: only D1 perception is scheduled.
- IDSER-003: project/bundle commit and immediate D1 execution/grant/job kickoff are one required unit. Under the staged policy, a committed bundle may validly have zero admitted perception executions while local capacity is saturated; durable pending eligibility replaces immediate kickoff.
- IDSER-007: reconciliation acceptance creates/enqueues the next member's perception.
- IDSER-010-02 RC-010-02-03: D2 waits for D1 reconciliation and D3 waits for D2.

Historical proofs remain true of the implementation they reviewed. Every other inherited contract remains in force unless a child explicitly changes it.

The staged policy is opt-in by an Atlas-owned persisted bundle policy/version. Existing historical bundles are not silently adopted. The initial cutover must fail closed if a non-terminal legacy sequential bundle would still be able to create perception work outside the new gate; no mixed active scheduling regime may exceed the qualified local capacity.

Two branch-derived refinements are frozen here:

1. IDSER-012-01 may activate **multi-document perception only** for staged bundles, because elastic borrowing and the A(4)/B(5)/C(2) fairness proof require more than one member to become perception-eligible. It must still stop before semantic execution.
2. IDSER-012-02 owns the durable `semantic_ready` stop, because the current extraction acceptance path immediately creates/enqueues reconciliation. IDSER-012-03 consumes that state rather than inventing it after reconciliation has already been scheduled.

```text
staged manifest
    -> fair perception admission
    -> admitted pg-boss job
    -> Docling
    -> accepted NormalizedDocument v1
    -> perceived
    -> semantic extraction
    -> semantic_ready + durable ready turn
    -> keyed one-writer reconciliation
    -> all N reconciled
    -> Ready for Review
```

## Partition and dependency order

| Order | Ticket | Review batch | Bounded owner |
|---:|---|---|---|
| 1 | [IDSER-012-01](IDSER-012-01-fair-bounded-local-perception-admission.md) | IDSER-BATCH-12-01 | Staged-policy cutover plus fair, durable two-worker Docling perception-only admission; stop before semantic |
| 2 | [IDSER-012-02](IDSER-012-02-multi-document-perception-extraction-decoupling.md) | IDSER-BATCH-12-02 | Release document-local perception -> extraction and stop durably at `semantic_ready` |
| 3 | [IDSER-012-03](IDSER-012-03-semantic-ready-reconciliation-admission.md) | IDSER-BATCH-12-03 | Consume semantic-ready work in durable ready order with a keyed single writer and order-independent relationship semantics |
| 4 | [IDSER-012-04](IDSER-012-04-staged-pipeline-composition-regression.md) | IDSER-BATCH-12-04 | N/N composition, failure, read-model, cutover, replay and isolation proof |

Each child requires its predecessors to receive CK `PASS`; this planning pass grants no GO authorization.

## Family-wide invariants and non-authority

- Perception capacity is one explicit local profile enforced by Atlas admission, Bridge perception consumers and Docling local workers. The foundation profile is 2/2/2.
- A pending member has no source grant, perception execution, or executable queue job. Admission creates them transactionally and just in time.
- A committed staged bundle does not require an immediate D1 job when no permit exists; it requires durable, reviewable eligibility in the Atlas backlog.
- Fairness is bundle-level and is represented by durable monotonic admission turns, not wall-clock timing or process-local state. It permits elastic borrowing without preempting active work.
- Only bundles explicitly marked with the staged admission policy are selected by the new gate. Historical bundles remain historical; active mixed-mode cutover is prohibited unless a separately reviewed adoption path exists.
- `perceived` and `semantic_ready` are processing lifecycle states, not truth states. Project-card projection may continue to describe them with the existing broad processing/extracting presentation.
- Semantic-ready order is durable execution order only. It is never truth precedence.
- Reconciliation has no manifest/upload-order truth priority; the stable bundle ID is the writer key and exactly one reconciliation writer may be active per bundle.
- No raw PDF bytes or DocumentStore paths enter admission or queue transport; no Redis, RQ, Kafka, second broker, provider quota mechanism, or in-memory durable semaphore is introduced.
- Master/publication, CES, chat, review decisions, provider quota domains, per-user entitlement and production-host sizing remain outside this family.

## Security readiness and review bindings

**Status: applicable.** Inherited boundaries are `BOUNDARY-IDSER012-PGBOSS` (pg-boss only broker), `BOUNDARY-IDSER012-SOURCE` (BSS-009 grant/redemption authority), `BOUNDARY-IDSER012-ATLAS` (admission/lifecycle owner), `BOUNDARY-IDSER012-BRIDGE` (no trusted-state mutation), and `BOUNDARY-IDSER012-DOCLING` (private exact-authorized-byte service boundary).

Extension seams are `SEAM-IDSER012-LOCAL-CAPACITY`, `SEAM-IDSER012-FAIR-ADMISSION`, `SEAM-IDSER012-GRANT-JIT`, `SEAM-IDSER012-STAGED-CUTOVER`, `SEAM-IDSER012-SEMANTIC-READY`, and `SEAM-IDSER012-KEYED-WRITER`. Prohibited couplings are `COUPLING-IDSER012-SECOND-BROKER`, `COUPLING-IDSER012-DOC-BYTES-IN-QUEUE`, `COUPLING-IDSER012-INMEMORY-SEMAPHORE`, `COUPLING-IDSER012-USER-PLAN-FAIRNESS`, `COUPLING-IDSER012-MIXED-ACTIVE-SCHEDULERS`, and `COUPLING-IDSER012-RECON-DRIVES-PERCEPTION`.

Mandatory review bindings: `REV-IDSER012-01` verifies capacity/configuration and staged cutover; `REV-IDSER012-02` verifies JIT-grant transactional authority and document-local semantic progression; `REV-IDSER012-03` verifies fair-selection/replay/failure observations; `REV-IDSER012-04` verifies keyed reconciliation writer, durable ready order and order-independent relationship semantics. Unresolved policy remains multi-host/GPU/OCR capacity, per-user weighting, multiple route pools, legacy-bundle adoption and host sizing.

## Hard stop and handoff

IDSER-012-01 stops after staged bundles can safely use the fair bounded perception lane and persist accepted perception completion, with **no semantic execution**. IDSER-012-02 stops at durable `semantic_ready` with **no reconciliation execution/job**. IDSER-012-03 alone releases reconciliation admission. Before each child reaches `awaiting_review`, record exact commit, migration status, Compose health, commands/counts, scoped identities, DB/queue observations and redacted resource/readiness evidence. CFC may repair only the active child’s deterministic evidence or owned seam; a cross-child architecture issue is `SCOPE_CHANGE`.
