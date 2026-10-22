# BSS-V2-014-01 — Versioned weighted class/process allocation contract

- **State:** `awaiting_review`; contract freeze: [BSS-V2-014-01 contract freeze 001](../../../feedback/BSS-V2-014-01-contract-freeze-001.md); implementation checkpoint: [BSS-V2-014-01 GO checkpoint](../../../feedback/BSS-V2-014-01-go-checkpoint.md). BSS-V2-005 successor. No migration, plan activation, or provider operation is authorized.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Dependencies:** approved BSS-V2-005 planner/registry/publication predecessors, including BSS-V2-005-05-04; approved BSS-V2-006-05 effective-enforcement authority. It does not depend on IDSER or an isolated qualification database.

## Exact scope

Add the pure, versioned policy contract used by later publication:

1. `ClassAllocationPolicy/v1` has exactly `headroomBps=1000`, `interactiveBps=2000`, `backgroundBps=7000`, and a canonical version/effective identity.
2. For every effective enforced dimension `d` and domain capacity `C[d]`, calculate `H=ceil(C*1000/10000)`, `I=ceil(C*2000/10000)`, and `B=C-H-I`; assert non-negative values and `H+I+B=C`.
3. Add the minimal versioned `allocationPolicy.interactive.weight` on the existing process registration/parser path. Preserve `hardInteractiveProtection`; do not accept a background allocation policy on an interactive process or a compatibility field on old versions.
4. Emit `CalculatedClassProcessAllocation/v1`: exact effective dimension mask; integer class totals; every active process's `{processId, profileVersion, serviceClass, normalizedWeight:{numerator,denominator}, baseline}`; optional explicit cap; and deterministic unallocated remainder caused by a cap.
5. For each class, calculate a process share once using positive weights. Allocate integer RPM/TPM/concurrency with floor plus largest fractional remainder, tie-breaking by canonical `(processId, profileVersion)` ascending. A process appears once even when several qualified routes reference it.

The BSS-V2-005 planner remains pure: it does not write the database, admit work, create a job, read runtime counters, select a provider, or estimate a consumer payload. The production publication and runtime use of this output belong to later children.

## Affected existing interfaces and required change

| Existing interface | Required successor change |
| --- | --- |
| `capacity-planner.ts` `planEffectiveDesiredAdmissionProfile` | Add `ClassAllocationPolicy/v1` and `CalculatedClassProcessAllocation/v1`; preserve effective-policy filtering and expose exact rational weights, not only a floating-point lane value. |
| `process-workload-catalogue.ts` process parser/registry | Permit versioned interactive weight only on the existing `allocationPolicy` path; retain existing background weight/borrow flag and hard interactive protection. |
| `DesiredAdmissionProfile` payload | Carry the calculated allocation as immutable planned data for `-02`; do not make it an admission permit or mutable counter. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-01401-01` | OpenAI-like `5000 RPM / 2000000 TPM` yields `500/1000/3500` RPM and `200000/400000/1400000` TPM. Anoman `20/40000/25` yields `2/4/14`, `4000/8000/28000`, and `3/5/17`; exact totals conserve. | `tests/weighted-capacity-allocation.test.ts`; deterministic JSON fixture output. |
| `RC-01401-02` | Background 3:1 produces 75%/25%; reordering input is identical; ties use canonical process/profile order; concurrency and RPM remainders conserve; a resource-essential zero baseline returns typed `unfit`. | Same unit test with shuffled/tied/zero-seat fixtures. |
| `RC-01401-03` | A valid Anoman policy has effective dimensions only `rpm,tpm,concurrency`; RPD has no numeric allocation. Missing, revoked, mismatched, or non-approved exclusion fails closed. | Positive/negative `EffectiveEnforcementPolicy/v1` fixtures and exact key assertions. |
| `RC-01401-04` | Interactive weight parses only through the existing versioned registry path; background and interactive invalid-field combinations reject. No v1 shim, parallel registry, or changed historical process record is introduced. | Parser/registry tests plus source-boundary check over the catalogue/planner. |
| `RC-01401-05` | An explicit cap remains a hard cap even during future borrowing; capped remainder is recorded as unallocated and is not silently redistributed to another process or class. | Allocation fixture with cap below share; exact allocation/remainder assertion. |
| `RC-01401-06` | Pure planning has zero database writes, attempts, reservations, jobs, transports, provider calls, or request-body persistence. | Static dependency test plus `pnpm --filter @atlas/agents-bridge typecheck`. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-capacity-allocation.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01401-T1`: server-owned effective policy and process registry are the sole inputs to allocation.
- `SR-01401-A1`: effective-dimension mask, class shares, weights, caps, and plan identity are sensitive planning authority.
- `SR-01401-C1`: prohibit caller-supplied entitlement/RPM/TPM/seats, implicit unknown capacity, per-slot TPM division, or a consumer-private weight calculator.
- `SR-01401-R1`: `RC-01401-03/04/06` verify `T1/C1` through negative parser/policy tests and source boundaries.

## Hard stop

Stop if interactive weight cannot be added as a versioned field of the existing registry, if the 10/20/70 arithmetic cannot conserve a known dimension, or if any consumer requires a distinct allocator. Do not add a legacy registration adapter, change a historical plan, infer concurrency from RPM, or treat an authorized Anoman unknown RPD as a zero/infinite capacity.
