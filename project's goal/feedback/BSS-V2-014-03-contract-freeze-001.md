# BSS-V2-014-03 contract freeze 001 — Authenticated calculated-capacity handoff

- **Ticket:** [BSS-V2-014-03 — Authenticated calculated-capacity handoff](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md)
- **Action:** initial bounded BSS v2 reader-contract freeze after `BSS-V2-014-05` contract freeze.
- **Operator authorization evidence:** explicit planning and contract-freeze authorization in this task on 2026-10-23 for `BSS-V2-014-05` and `BSS-V2-014-03`. It is not GO authorization.
- **Reviewed source revision:** `cdaa1d94bbfbac1a759642044811bad9e4aef81d` on `codex/new-atlas-backend` before this documentation-only commit.
- **Ticket state:** `frozen`. This record preserves the implementation contract and is neither a GO checkpoint nor a CK result.

## Preconditions verified

| Prerequisite | Evidence | Result |
| --- | --- | --- |
| Current target | The named ticket resolves uniquely in the BSS-V2-014 ticket set at `cdaa1d94bbfbac1a759642044811bad9e4aef81d`. | `PROVEN` |
| Immutable v2 publication | [BSS-V2-014-02-02 CK verification](BSS-V2-014-02-02-7d7612b-verification.md) records `PASS` for `7d7612b55cf49ba071ea3eb89d86f8aaff3992ce`; no contradictory evidence was found. | `PROVEN` |
| IDSER consumer contract | [BSS-V2-014-05 contract freeze 001](BSS-V2-014-05-contract-freeze-001.md) fixes the sole future consumer's v2 acceptance, zero-effect, and cutover obligations without granting its implementation. | `PROVEN` |
| Read-boundary security | [BSS-V2-005-05-02](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-05-02-authenticated-capacity-planning-snapshot-boundary.md) is `approved` after CK `PASS` at `067a06d`, preserving one authenticated, server-bound, side-effect-free read seam. | `PROVEN` |
| Production gate separation | The parent retains `-04-01/-02/-03`, the IDSER replacement, and the single-reader activation switch as later parent-gate conditions. | `PROVEN` |

## Reconciled handoff boundary

`-03` evolves the existing authenticated BSS read seam and its SQL projection to qualify `CapacityPlanningSnapshot/v2` in isolation. It returns only a mutually consistent server-bound identity, exact revisions, effective numeric allocation and mask, rational process weight/cap, complete request-sizing limits, pinned estimator/safety identities, runtime-only borrowing metadata, approved unknown-RPD provenance where applicable, canonical fingerprint, typed status/reason, and `readIsNotAdmissionPermit=true`.

The v2 reader supplies BSS authority; it does not estimate an IDSER request, persist a semantic plan, reconstruct a request, send to a provider, or admit work. IDSER consumes the frozen server contract for deterministic full-request sizing and locator/hash-only plan material. SEM retains later reference-based reconstruction and execution. The existing v1 prospective inactive response remains historical and cannot be relabeled or adapted into v2.

## Frozen Review Contract

The authority is the frozen `BSS-V2-014-03` ticket, BSS-V2-014 parent contract, `-02-02` accepted publication interface, `-05` frozen consumer contract, and approved BSS-V2-005-05-02 read boundary. This record adds, removes, and reinterprets no ticket requirement.

| Row | Required behavior | Required proof | Boundary / forbidden substitute |
| --- | --- | --- | --- |
| `RC-01403-01` | A qualified v2 response exactly matches one active immutable plan for route/model authority, workload/profile, allocation, structural bounds, effective mask, and fingerprint, while reads make zero attempts, reservations, window mutations, jobs, and transports. | Isolated Bridge PostgreSQL plus existing HTTP-reader integration harness. | No second reader, direct table access, or runtime side effect. |
| `RC-01403-02` | Foreign principal, mismatched process/class/route/model, stale authority/plan, missing allocation, revoked policy, absent required bound, or route/workload mismatch returns typed non-qualified status without numeric fallback. | Negative principal/plan/model fixtures and zero-effect counters. | No client-selected scope, fallback, or prospective read conversion. |
| `RC-01403-03` | Anoman returns only `rpm`, `tpm`, and `concurrency` allocation with approved unknown-RPD provenance; missing, revoked, or mismatched approval fails closed. | WCA-15 read-only positive and negative fixture. | No numeric RPD allocation, ledger, or fabricated limit. |
| `RC-01403-04` | Maximum eligible request uses complete demand, process TPM/RPM baseline, request bytes, model context/input/output, output reservation, and estimator identity; oversized demand is typed `unfit`. | Complete-request text/image/output fixture and too-large negative assertion. | No per-slot token ceiling, TPM-per-concurrency division, default model limit, or consumer-private profile. |
| `RC-01403-05` | The existing endpoint remains the sole BSS planning reader, qualifies v2 only in isolation, and rejects production activation before the later `-05` replacement and `-04` readiness evidence. | Isolated v2 fixture, premature-activation negative with zero active-reader change, entrypoint/contract inventory, and static source-boundary test. | No duplicate reader, dual read/write, v1-to-v2 shim, prospective relabel, IDSER code, or positive production cutover proof. |

## Frozen future validation

These ticket-defined commands are the required GO/CK evidence and were deliberately not run under this planning-only authorization:

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## Dependency disposition and hard stops

The dependency order is acyclic: `-02-02` CK `PASS` and `-05` contract freeze are prerequisites for `-03` GO; `-05` implementation follows `-03` CK `PASS`; production activation remains parent-gated after `-04-03` CK `PASS`. No unowned product, policy, architecture, provider, or environment decision was found.

Stop for HMN/new planning authority if implementation needs a v1/v2 adapter, dual active reader, client-selected model/domain, new endpoint, provider fallback, or modification of an approved predecessor boundary.

## GO boundary

`BSS-V2-014-03` is the next GO-eligible ticket because every documented prerequisite above is proven. This is not GO authorization and does not authorize implementation, CK, production activation, IDSER implementation, or parent cutover.
