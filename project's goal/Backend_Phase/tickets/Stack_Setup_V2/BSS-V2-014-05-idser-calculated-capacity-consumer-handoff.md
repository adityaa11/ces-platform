# BSS-V2-014-05 — IDSER calculated-capacity consumer handoff

- **State:** `planned`; **future IDSER successor ownership, not BSS-V2-005/006 implementation scope**. This is a frozen handoff candidate, not GO, BSS implementation authority, isolated-environment repair, or provider authorization.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Dependencies:** freeze this contract before BSS-V2-014-03 GO; implementation requires BSS-V2-014-03 CK `PASS`. Production acceptance additionally requires BSS-V2-014-04-03 CK `PASS` (including the `-04-01/-02` predecessor evidence). It does **not** depend on the `IDSER-012-05-07-02` isolated qualification-environment repair.

## Purpose and ownership boundary

The sole future IDSER owner replaces the active calculated-capacity consumer binding with BSS `CapacityPlanningSnapshot/v2`. BSS owns the server-produced allocation and admission; IDSER owns deterministic full-request estimation, immutable locator/hash-only plan material, and typed planning outcomes. SEM remains the later reconstruction/execution owner.

This document deliberately does not create a BSS implementation task, a BSS migration, an IDSER database repair, a provider attempt, a GHR change, a semantic-result contract, or a prompt/image payload store.

## Frozen consumer contract

1. IDSER accepts only `apiVersion=CapacityPlanningSnapshot/v2`, `status=qualified`, `readIsNotAdmissionPermit=true`, exact authenticated identity/revision/fingerprint, and a complete set of qualified structural/model bounds.
2. The complete request estimator calculates text + selected images + framing/overhead + reserved output. The candidate fits only when it is within the BSS process TPM/RPM baseline and every input/context/output/request-byte bound.
3. `mayBorrowIdleCapacity` is runtime-only metadata. It never increases an immutable request size or allows a borrow-dependent batch plan.
4. An approved unknown/not-enforced RPD remains provenance metadata and is not a structural failure, numeric limit, or daily request estimate. A missing/revoked/mismatched approval and all other non-qualified snapshots return typed stop/replan/unfit results.
5. The bounded active calculated-capacity consumer cutover has one v2 reader. It does not use a v1→v2 adapter, dual read, fallback to prospective inactive data, direct BSS SQL, or a guessed provider/model bound. Existing v1 prospective facts remain historical and are not relabeled active.

## Binary Review Contract for the future IDSER owner

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-01405-01` | IDSER accepts a server-authenticated v2 fixture only when identity, revisions, fingerprint, allocation, model/workload bounds, estimator, and approved RPD provenance are coherent. Foreign/stale/non-qualified/missing fields stop with a typed result. | Consumer integration fixture against the actual BSS reader; no direct-table test double. |
| `RC-01405-02` | Complete text/image/framing/output demand is measured with the existing shared estimator and is rejected when it exceeds process baseline, model context/input/output, or byte bounds. No TPM-per-seat division and no second tokenizer occur. | Deterministic text/image positive and oversized negative fixtures. |
| `RC-01405-03` | Valid Anoman unknown/not-enforced RPD does not block an otherwise fitting candidate; absent/revoked/mismatched approval fails closed. No numeric RPD field, window, or fallback appears. | WCA-15 consumer positive/negative fixtures. |
| `RC-01405-04` | The consumer creates zero BSS attempts, reservations, quota/window mutations, jobs, transports, complete-request persistence, GHR delivery, SEM call, or semantic truth effects. Locator/hash/versioned measurement persistence remains within existing IDSER authority only. | Non-inert effect counters and persistence inspection. |
| `RC-01405-05` | The bounded calculated-capacity consumer uses only v2 after cutover. No active v1 reader, adapter, dual-read, prospective-to-qualified conversion, or alternate BSS planner/read service remains. | Source-entrypoint inventory and cutover integration test. |

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01405-T1`: BSS authenticated calculated policy → IDSER deterministic sizing is read-only.
- `SR-01405-A1`: source locators/hashes/measurements and snapshot provenance are sensitive; complete prompt/image/credential bytes remain excluded.
- `SR-01405-C1`: prohibit direct BSS SQL, capacity synthesis, a second tokenizer, borrow-based planning, BSS send, and consumer-side route/model authority.
- `SR-01405-R1`: `RC-01405-01..05` verify actual-reader provenance, full-request fit, negative policy behavior, and zero forbidden effects.

## Hard stop

Stop for new planning authority if replacing the active consumer requires a compatibility adapter, simultaneous active v1/v2 read, a fake active plan, a provider fallback, or repair of the isolated IDSER environment as a condition of BSS contract work. The environment repair is separately owned and cannot be silently folded into this successor.
