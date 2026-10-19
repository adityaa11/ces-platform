# IDSER-012-04-05 — GHR reference-only v2 compatibility

- **State:** `planned`; GO is required.
- **Batch:** `IDSER-BATCH-12-04-05`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** `IDSER-012-04-04` CK `PASS`; existing proposed `SemanticBatchPlanReady/v1` fixture-receiver boundary.

## Outcome

Extend internal receiver dispatch to validate persisted v2 plan/handoff records behind the unchanged reference-only `SemanticBatchPlanReady/v1` body. **STOP at validation: this child neither issues nor delivers GHR work.**

## Authorized scope

Preserve exactly `documentPlanRef`, `planHash`, `batchCount`, and `batchHandoffRefs`. Validate the body and each v2 persisted reference for exact parent/hash/scope/slot membership, unique IDs, count/array consistency, complete once-only owned coverage, and bounded size. Reject missing, extra, malformed, duplicate, foreign, stale, unpersisted, or wrong-version members. `NO_ELIGIBLE_SOURCE` produces no body. A too-large body yields a typed blocker for a separately versioned manifest-pointer decision; do not add a field.

Reuse the `-04-04` repository/parser interfaces; do not modify their internals. Do not create a GHR router, issuer, outbox, queue, forwarding route, acknowledgement, BSS work, SEM intake, provider client, or semantic/reconciliation effect.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120405-01` | A valid body constructed from actual persisted v2 records validates through internal version dispatch without modifying the external v1 body. |
| `RC-0120405-02` | Wrong/missing/extra/duplicate/oversized/foreign/stale refs, hashes, counts, slots, parent membership, or ownership reject; zero eligible source emits no body. |
| `RC-0120405-03` | The receiver consumes immutable `-04-04` interfaces without a second persistence path or reimplementation of v2 parser semantics. |
| `RC-0120405-04` | Non-inert validation coexists with zero GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM intake/call, semantic truth, reconciliation, Master, or CES effects. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120405-B1` keeps GHR future-owned and Atlas v2 records immutable/read-only here.
- **Trust / identity:** `SR-0120405-T1` scoped immutable refs/hashes → strict opaque body validation.
- **Prohibited couplings:** `SR-0120405-C1` prohibits equating validation with issuance/eligibility, raw-payload export, a second persistence route, or a new limiter/send lane.
- **Verification / unresolved policy:** `SR-0120405-V1` requires rejection-matrix and forbidden-counter proof; `SR-0120405-U1` leaves actual GHR delivery authorization unresolved.
- **Review binding:** `SR-0120405-R1` verifies `T1/C1` through real-record validation and exact zero downstream-effect evidence.

## Evidence and hard stop

Record body digest, referenced IDs/hashes, rejection matrix, version-dispatch path, and zero-effect counters. A missing delivery authority is expected; it is not a gap to fill. CK `PASS` exposes only a validated, unissued body to `-04-07`.
