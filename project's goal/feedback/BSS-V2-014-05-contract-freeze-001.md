# BSS-V2-014-05 contract freeze 001 — IDSER calculated-capacity consumer handoff

- **Ticket:** [BSS-V2-014-05 — IDSER calculated-capacity consumer handoff](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md)
- **Action:** initial bounded consumer-contract freeze before `BSS-V2-014-03` GO.
- **Operator authorization evidence:** explicit planning and contract-freeze authorization in this task on 2026-10-23 for `BSS-V2-014-05` and `BSS-V2-014-03`; this record freezes `-05` first. It is not GO authorization.
- **Reviewed source revision:** `cdaa1d94bbfbac1a759642044811bad9e4aef81d` on `codex/new-atlas-backend` before this documentation-only commit.
- **Ticket state:** `frozen`. This record fixes the future IDSER consumer contract; it is neither a GO checkpoint nor a CK result.

## Preconditions verified

| Prerequisite | Evidence | Result |
| --- | --- | --- |
| Current target | The named ticket resolves uniquely in the BSS-V2-014 ticket set at `cdaa1d94bbfbac1a759642044811bad9e4aef81d`. | `PROVEN` |
| BSS planning-read boundary | [BSS-V2-005-05-02](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-05-02-authenticated-capacity-planning-snapshot-boundary.md) is `approved` following CK `PASS` at `067a06d`; its verification records one authenticated, versioned, side-effect-free BSS read boundary. | `PROVEN` |
| Immutable v2 publication predecessor | [BSS-V2-014-02-02 CK verification](BSS-V2-014-02-02-7d7612b-verification.md) records `PASS` for `7d7612b55cf49ba071ea3eb89d86f8aaff3992ce`. It is consumed unchanged; this freeze does not reopen it. | `PROVEN` |
| Freeze ordering | The parent ticket set requires `-05`'s contract to freeze before `-03` GO, while `-05` implementation waits for `-03` CK `PASS` and production acceptance also waits for `-04-03` CK `PASS`. | `PROVEN` |
| Existing IDSER/SEM separation | The BSS-V2-014 parent and approved IDSER planning context retain IDSER as the read-only deterministic sizing owner and SEM as later reconstruction/execution owner. | `PROVEN` |

## Frozen authority and handoff

BSS remains the sole authority for authenticated snapshot identity, calculated allocation, effective policy, route/model qualification, active plan, and runtime admission. The future IDSER owner may consume only an authenticated `CapacityPlanningSnapshot/v2` with `status=qualified` and `readIsNotAdmissionPermit=true`; it performs deterministic complete-request estimation and returns typed planning outcomes. IDSER persists only immutable locator/hash/versioned-measurement material. SEM later reconstructs and executes from authorized references; neither IDSER planning nor this BSS/IDSER handoff authorizes a provider send, payload persistence, GHR redesign, or SEM execution.

The accepted v2 handoff is exactly the ticket's identity, revision, allocation, structural-bound, estimator/safety, borrowing-metadata, policy-provenance, canonical-fingerprint, and typed-status shape. A consumer must reject absent, stale, foreign, non-qualified, or incomplete authority. `mayBorrowIdleCapacity` remains runtime-only metadata. An approved `unknown/not_enforced` RPD is provenance rather than a numeric quota, structural bound, daily estimate, or block on an otherwise fitting request; absent, revoked, or mismatched approval fails closed.

At the parent-governed cutover only, the former active v1 consumer is removed or revoked before the sole v2 consumer becomes active. There is no v1-to-v2 adapter, dual read, prospective-to-qualified conversion, direct BSS SQL, consumer-private provider/model bound, second planner, or alternate BSS read service.

## Frozen Review Contract

The authority is the frozen `BSS-V2-014-05` ticket, the BSS-V2-014 parent contract, the approved BSS-V2-005-05-02 authenticated read boundary, and the accepted IDSER locator/hash-only planning and SEM reconstruction boundaries. This record adds, removes, and reinterprets no ticket requirement.

| Row | Required behavior | Required proof | Boundary / forbidden substitute |
| --- | --- | --- | --- |
| `RC-01405-01` | Accept only coherent, server-authenticated v2 identity, revisions, fingerprint, allocation, versioned structural/model bounds, estimator, and approved-RPD provenance; foreign, stale, missing, or non-qualified data stops with a typed result. | Actual BSS-reader consumer integration fixture, with positive and negative identity/status assertions. | No direct-table double, client-selected authority, or inferred model/profile. |
| `RC-01405-02` | Measure complete text, selected images, framing, and reserved output with the existing shared estimator; reject demand exceeding the process baseline or byte/context/input/output bound. | Deterministic text/image fitting and oversized fixtures. | No TPM-per-seat division or second tokenizer. |
| `RC-01405-03` | Accept otherwise fitting Anoman work with approved unknown/not-enforced RPD and no numeric RPD; fail closed for absent, revoked, or mismatched approval. | WCA-15 consumer positive and negative fixtures. | No numeric RPD, window, fabricated fallback, or structural rejection caused solely by authorized exclusion. |
| `RC-01405-04` | Create no BSS attempt, reservation, quota/window mutation, job, transport, complete-request persistence, GHR delivery, SEM call, or semantic-truth effect. Persist only IDSER-owned locator/hash/versioned measurement material. | Non-inert BSS effect counters plus IDSER persistence inspection. | No send, payload store, BSS mutation, GHR delivery, or SEM execution. |
| `RC-01405-05` | Replace the active consumer only at the parent gate after exact-reader integration and `-04-03` evidence; subsequently exactly one active v2 consumer exists. | Caller/grant inventory, parent-gate negative and positive cutover fixture, and active-consumer count assertion. | No active v1 reader/consumer, adapter, dual read, fallback, prospective relabel, or alternate BSS planner/read service. |

## Dependency disposition and hard stops

This is not circular: the `-05` **contract** is frozen before `-03` GO; `-03` may qualify v2 in isolation; `-05` implementation waits for `-03` CK `PASS`; and production acceptance waits for `-04-03` CK `PASS` plus the parent gate. The isolated `IDSER-012-05-07-02` environment repair is not a dependency.

Stop for HMN/new planning authority if the existing consumer can only be replaced through a compatibility adapter, simultaneous active v1/v2 reads, fake active plan, provider fallback, direct BSS access, or an environment-repair dependency. No such unresolved authority decision is identified by this freeze.

## GO boundary

This contract freeze does not make `BSS-V2-014-05` GO-eligible. Its future IDSER implementation requires `BSS-V2-014-03` CK `PASS`; production acceptance additionally requires `BSS-V2-014-04-03` CK `PASS` and the parent-coordinated cutover. It authorizes no BSS implementation, activation, admission, provider operation, or runtime execution.
