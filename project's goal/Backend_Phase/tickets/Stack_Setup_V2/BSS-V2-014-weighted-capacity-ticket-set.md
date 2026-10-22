# BSS-V2-014 — Weighted class/process capacity and route/model handoff

- **State:** `planned`; planning decomposition only. This file is not GO, CK, CFC, HMN, migration, route activation, or provider authorization.
- **Authority:** [Atlas BSS V2 — Weighted Class/Process Capacity & Route/Model Handoff Implementation Context r2](../../atlas-bss-weighted-capacity-implementation-context-DRAFT-r2.md).
- **Baseline inspected for this decomposition:** `codex/new-atlas-backend` at `9395cf2e918abae00d348f7f1d9c6c03fa5472ce`. The r2 inspected code SHA is `4183c445fee6dc5b9691d8a811e00af40b289024`; the intervening commit is documentation only.
- **Predecessors:** BSS-V2-005-01..05-04 and BSS-V2-006-01..06-05-06 retain their approved records and boundaries. In particular, BSS-V2-006-05-01..06 remain the authority for the authorized Anoman `rpd: unknown/not_enforced` behavior.

## Fixed outcome

BSS remains the sole quota-domain planning and runtime-admission authority. For each known/enforced dimension it creates immutable, integer-conserving 10% headroom / 20% protected interactive / 70% background allocations, then one normalized-weight baseline per active process in the class. A qualified route/model receives that process allocation through the existing authenticated planning-read seam; the existing atomic admission transaction enforces it and may lend only demonstrably idle background share at runtime.

The resulting successor has one planner, one authenticated read seam, one atomic admission/pg-boss/claimed-transport chain, and no provider-specific execution branch. An IDSER consumer is a separately owned successor, not BSS implementation work.

## Ticket set and dependency order

| Order | Ticket | Owner | Bounded result | Depends on |
| --- | --- | --- | --- | --- |
| A | [BSS-V2-014-01](BSS-V2-014-01-weighted-allocation-contract.md) | BSS-V2-005 | Pure, versioned 10/20/70 class/process allocation and versioned interactive weight registration. | Approved BSS-V2-005 planning/registry predecessors; authorized effective-policy seam. |
| B | [BSS-V2-014-02](BSS-V2-014-02-model-route-shared-domain-publication.md) | BSS-V2-005 | Durable model-bound route authority and immutable multi-route shared-domain publication of the allocation. | `-01` CK PASS. |
| C | [BSS-V2-014-03](BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md) | BSS-V2-005 | `CapacityPlanningSnapshot/v2` on the existing read seam, with server-bound calculated allocation. | `-02` CK PASS and `-05` contract frozen. |
| D | [BSS-V2-014-04](BSS-V2-014-04-atomic-process-admission-and-borrowing.md) | BSS-V2-006 | Atomic baseline/cap enforcement and background-only idle borrowing in the existing admission chain. | `-02` CK PASS; `-01` allocation contract; approved BSS-V2-006 recovery/fairness predecessors. |
| E | [BSS-V2-014-05](BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md) | Future IDSER successor, **not BSS** | Consumer contract/cutover for BSS v2 full-request sizing. | `-03` CK PASS and `-04` CK PASS for production acceptance. |

`-03` and `-04` are independent after `-02`; `-05` may freeze its contract alongside them, but cannot GO before its declared BSS predecessors. This has no dependency on repair of the isolated IDSER qualification environment recorded at `IDSER-012-05-07-02`.

## Non-negotiable contract rules inherited by every child

1. A quota domain is shared capacity. Multiple routes never duplicate provider quota or a process allocation.
2. `rpm`, `tpm`, `concurrency`, and only a known/enforced `rpd` participate. Anoman's exact approved `unknown/not_enforced` RPD is excluded from numeric vectors, denominators, window rows, and admission checks; it is neither zero nor unlimited. Missing/unapproved required authority fails closed.
3. Request sizing is Maximum Eligible Request: complete text, selected images, framing, and reserved output must fit the immutable process baseline and each qualified model/workload bound. TPM is never divided by concurrency.
4. Background may borrow only at atomic admission time from proven-idle background peers. Interactive protection and headroom are never background loans; historical reservations and physical liabilities are never rebased.
5. Existing route registry, desired-plan activation, authenticated snapshot reader, `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` → reservation → pg-boss → transport-claim chain are evolved in place. No alternate planner, reader, scheduler, queue, send lane, payload store, legacy adapter, dual read/write, or fallback is permitted.
6. Each child remains `planned` until its full contract is reviewed and frozen. A later GO may implement only that child and its named rows.

## Cross-owner seam disposition

There is no unresolved architectural contradiction in the r2 baseline. The one material cross-owner seam is intentional: the current IDSER prospective reader accepts `CapacityPlanningSnapshot/v1`, while BSS-V2-014 requires an active calculated `v2` handoff. Disposition: `-03` owns the BSS server contract and `-05` owns the IDSER consumer replacement. No v1→v2 adapter or dual active reader is allowed. If an actual cutover requires either, the affected ticket stops for HMN/new planning authority rather than widening BSS scope.

## Family-level SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-014-B1` preserves BSS policy/publication/read/admission authority; `SR-014-B2` preserves IDSER as a read-only sizing consumer and SEM as reconstruction/execution owner.
- **Trust boundaries:** `SR-014-T1` registry route/model qualification → durable publication; `SR-014-T2` immutable calculated plan → authenticated read; `SR-014-T3` authenticated work → atomic reservation and sole transport claim.
- **Sensitive assets:** `SR-014-A1` provider bounds, enforcement approval/provenance, allocations, model qualification, held/spent window liabilities, and activation revisions.
- **Prohibited couplings:** `SR-014-C1` prohibits client-selected route/model/domain or direct table access; `SR-014-C2` prohibits a bypass send/limiter/scheduler; `SR-014-C3` prohibits payload/content/credential persistence in planning or allocation state.
- **Review bindings:** `SR-014-R1` through `R4` are carried by the child tickets' named binary rows and require isolated PostgreSQL evidence, source-boundary inspection, and zero-effect counters where applicable.

## Global hard stop

Stop the affected child for HMN/new planning decision if a required acceptance row needs a second operational lane, consumer-specific allocator, multi-active-route resolver, v1/v2 compatibility service, provider capacity fallback, or modification of an approved predecessor contract. Do not turn the separate IDSER environment bootstrap gap into a BSS-V2-014 prerequisite or repair scope.
