# IDSER-012: Staged worker pipeline realignment

- **State:** `planned`; **Review family:** `IDSER-BATCH-12`.
- **Predecessors:** approved IDSER-003, IDSER-006 through IDSER-008, IDSER-010-04 and IDSER-010-05; BSS-006, BSS-009/01/02 and BSS-V2-004-01/02 remain frozen inherited contracts.
- **Source authority:** [Staged worker pipeline / Docling admission context](../../atlas-staged-worker-pipeline-docling-admission-context.md), sections 1–26.
- **Type:** non-executable umbrella and lifecycle amendment. Its children, not this record, are GO targets.

## Authority and lifecycle amendment

Own the deliberately staged replacement of the production execution shape: independently admitted perception, independently executable semantic extraction, ready-order reconciliation with one writer per bundle, and final composition proof. Preserve Atlas as lifecycle/admission authority, pg-boss as the only durable execution broker, and the Bridge as an executor without trusted Atlas-table write access.

For **new production execution only**, this family supersedes these procedural historical rules without editing their approved text or evidence:

- IDSER-003: only D1 perception is scheduled.
- IDSER-007: reconciliation acceptance creates/enqueues the next member's perception.
- IDSER-010-02 RC-010-02-03: D2 waits for D1 reconciliation and D3 waits for D2.

Historical proofs remain true of the implementation they reviewed. Every other inherited contract remains in force unless a child explicitly changes it.

```text
manifest -> fair perception admission -> admitted pg-boss job -> Docling
         -> accepted NormalizedDocument v1 -> semantic queue -> semantic_ready
         -> keyed one-writer reconciliation -> all N reconciled -> Ready for Review
```

## Partition and dependency order

| Order | Ticket | Review batch | Bounded owner |
|---:|---|---|---|
| 1 | [IDSER-012-01](IDSER-012-01-fair-bounded-local-perception-admission.md) | IDSER-BATCH-12-01 | Fair, durable two-worker Docling admission foundation only |
| 2 | [IDSER-012-02](IDSER-012-02-multi-document-perception-extraction-decoupling.md) | IDSER-BATCH-12-02 | Activate independent perception and extraction after semantic route qualification |
| 3 | [IDSER-012-03](IDSER-012-03-semantic-ready-reconciliation-admission.md) | IDSER-BATCH-12-03 | Ready-order reconciliation and keyed single writer |
| 4 | [IDSER-012-04](IDSER-012-04-staged-pipeline-composition-regression.md) | IDSER-BATCH-12-04 | N/N composition, failure, read-model and replay/isolation proof |

Each child requires its predecessors to receive CK `PASS`; this planning pass grants no GO authorization.

## Family-wide invariants and non-authority

- Perception capacity is a single explicit profile enforced by Atlas admission, Bridge perception consumers and Docling local workers. The foundation profile is 2/2/2.
- A pending member has no source grant, execution, or executable queue job. Admission creates all of those transactionally and just in time.
- Fairness is bundle-level, uses stable least-recently-admitted selection, and permits elastic borrowing without preempting active work. It is not customer-plan or user-priority policy.
- No raw PDF bytes or DocumentStore paths enter admission or queue transport; no Redis, RQ, Kafka, second broker, provider quota mechanism, or in-memory durable semaphore is introduced.
- Semantic extraction and reconciliation redesign are not implied by foundation completion. Reconciliation has no manifest/upload-order truth priority; the stable bundle ID is the future writer key.
- Master/publication, CES, chat, review decisions, provider quota domains, per-user entitlement and production-host sizing remain outside this family.

## Security readiness and review bindings

**Status: applicable.** Inherited boundaries are `BOUNDARY-IDSER012-PGBOSS` (pg-boss only broker), `BOUNDARY-IDSER012-SOURCE` (BSS-009 grant/redemption authority), `BOUNDARY-IDSER012-ATLAS` (admission/lifecycle owner), `BOUNDARY-IDSER012-BRIDGE` (no trusted-state mutation), and `BOUNDARY-IDSER012-DOCLING` (private exact-authorized-byte service boundary).

Extension seams are `SEAM-IDSER012-LOCAL-CAPACITY`, `SEAM-IDSER012-FAIR-ADMISSION`, `SEAM-IDSER012-GRANT-JIT`, and, later, `SEAM-IDSER012-KEYED-WRITER`. Prohibited couplings are `COUPLING-IDSER012-SECOND-BROKER`, `COUPLING-IDSER012-DOC-BYTES-IN-QUEUE`, `COUPLING-IDSER012-INMEMORY-SEMAPHORE`, `COUPLING-IDSER012-USER-PLAN-FAIRNESS`, and `COUPLING-IDSER012-RECON-DRIVES-PERCEPTION` after activation.

Mandatory review bindings: `REV-IDSER012-01` verifies capacity/configuration and readiness evidence; `REV-IDSER012-02` verifies JIT-grant transactional authority and Bridge denial; `REV-IDSER012-03` verifies fair-selection/replay/failure observations; `REV-IDSER012-04` verifies keyed reconciliation writer and order-independent relationship semantics. Unresolved policy remains multi-host/GPU/OCR capacity, per-user weighting, multiple route pools and host sizing.

## Hard stop and handoff

IDSER-012-01 stops after the narrow fair bounded perception gate is proven. Do not activate multi-document perception, semantic, or reconciliation changes in that GO pass. Before each child reaches `awaiting_review`, record exact commit, migration status, Compose health, commands/counts, scoped identities, DB/queue observations and redacted resource/readiness evidence. CFC may repair only the active child’s deterministic evidence or owned seam; a cross-child architecture issue is `SCOPE_CHANGE`.
