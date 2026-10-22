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
| B1 | [BSS-V2-014-02-01](BSS-V2-014-02-01-model-bound-route-authority.md) | BSS-V2-005 | Append-only durable model/adapter/qualification route authority; no plan publication. | `-01` CK PASS. |
| B2 | [BSS-V2-014-02-02](BSS-V2-014-02-02-shared-domain-allocation-publication.md) | BSS-V2-005 | Immutable shared-domain multi-route binding and sole successor publication seam; publication is not production activation. | `-02-01` CK PASS and `-01` CK PASS. |
| C | [BSS-V2-014-03](BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md) | BSS-V2-005 | Isolated qualification of `CapacityPlanningSnapshot/v2` on the existing read seam, with server-bound calculated allocation. | `-02-02` CK PASS and `-05` contract frozen. |
| D1 | [BSS-V2-014-04-01](BSS-V2-014-04-01-process-window-usage-projection.md) | BSS-V2-006 | Prefer read-derived per-process usage from authoritative reservation/window facts; any persistence occurs only in the same lifecycle transaction; no admission decision. | `-02-02` CK PASS; approved BSS-V2-006 recovery/fairness predecessors. |
| D2 | [BSS-V2-014-04-02](BSS-V2-014-04-02-atomic-process-baseline-enforcement.md) | BSS-V2-006 | Atomic process baseline/cap/class enforcement and complete route-authority propagation through the existing admission/claim transaction; above-baseline borrowing remains denied. | `-04-01` CK PASS and `-02-02` CK PASS. |
| D3 | [BSS-V2-014-04-03](BSS-V2-014-04-03-background-idle-borrowing.md) | BSS-V2-006 | Background-only verified-idle borrowing and lender-return fairness in that same transaction. | `-04-02` CK PASS. |
| E | [BSS-V2-014-05](BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md) | Future IDSER successor, **not BSS** | Consumer replacement and one-reader cutover for BSS v2 full-request sizing. | `-03` CK PASS and `-04-03` CK PASS for production acceptance. |

`-03` and `-04-01` are independent after `-02-02`; `-05` freezes its contract before `-03` GO, then implements only after `-03` CK PASS. This is intentionally acyclic. `-02` and `-04` are retained as non-executable split maps so prior references stay resolvable. This has no dependency on repair of the isolated IDSER qualification environment recorded at `IDSER-012-05-07-02`.

## Parent-owned production activation and cutover gate

The existing activation epoch remains the only activation mechanism. `-02-02` may publish immutable successor data and qualify it in isolation, but it must not make a weighted successor production-active. The parent integration gate is satisfied only when all of the following evidence exists in the same release/cutover record:

1. `-02-02` has retired the former executable single-route publisher and proven the successor is the sole authorized publication entrypoint.
2. `-04-01`, `-04-02`, and `-04-03` have passed their respective contracts, so the active runtime admission chain enforces the successor semantics, including borrowing where applicable.
3. `-03` has qualified the v2 server contract in isolation and `-05` has completed the IDSER replacement against that exact contract.
4. The existing authenticated endpoint and its one active IDSER consumer are atomically switched to v2; no v1 reader, adapter, dual read, fallback, or prospective-to-active conversion remains executable.

The gate is not a new service or activation path. A failed condition blocks production activation and is reported as a planning/cutover blocker; it must not be bypassed with a compatibility lane.

## Non-negotiable contract rules inherited by every child

1. A quota domain is shared capacity. Multiple routes never duplicate provider quota or a process allocation.
2. `rpm`, `tpm`, `concurrency`, and only a known/enforced `rpd` participate. Anoman's exact approved `unknown/not_enforced` RPD is excluded from numeric vectors, denominators, window rows, and admission checks; it is neither zero nor unlimited. Missing/unapproved required authority fails closed.
3. Request sizing is Maximum Eligible Request: complete text, selected images, framing, and reserved output must fit the immutable process baseline and each qualified model/workload bound. TPM is never divided by concurrency.
4. Background may borrow only at atomic admission time from proven-idle background peers. Interactive protection and headroom are never background loans; historical reservations and physical liabilities are never rebased.
5. Existing route registry, desired-plan activation, authenticated snapshot reader, `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` → reservation → pg-boss → transport-claim chain are evolved in place. No alternate planner, reader, scheduler, queue, send lane, payload store, legacy adapter, dual read/write, or fallback is permitted.
6. Each executable child remains `planned` until its full contract is reviewed and frozen. A later GO may implement only that child and its named rows; a split map is never GO/CK/CFC/HMN authority.

## Coverage preservation after sizing split

No acceptance obligation is deleted or weakened by the two splits. `-01` owns WCA-01..04; `-02-01` and `-02-02` together own WCA-05 and the durable-authority portion of WCA-06; `-03` owns WCA-07/08; `-04-01` owns process-ledger reconciliation, `-04-02` owns WCA-09 plus the admission gate of WCA-06/12, and `-04-03` owns WCA-10/11; `-05` owns WCA-13. WCA-14 is a required negative boundary proof in every executable child. WCA-15 is apportioned only to the owners that can prove it: `-01` policy derivation, `-03` read, `-04-01/-02` projection and actual atomic admission, and `-05` consumer fit.

## Cross-owner seam disposition

The material cross-owner seams are intentionally owned: `-02-01` publishes qualified route identity; `-02-02` binds it immutably and retires the legacy publisher; `-04-02` carries the pinned identity through attempt, reservation, and claim; `-03` owns the BSS v2 server contract; and `-05` owns the IDSER consumer replacement. The current IDSER prospective reader accepts `CapacityPlanningSnapshot/v1`, while BSS-V2-014 requires an active calculated v2 handoff. No v1→v2 adapter or dual active reader is allowed. If an actual cutover requires either, the affected ticket stops for HMN/new planning authority rather than widening BSS scope.

## Family-level SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-014-B1` preserves BSS policy/publication/read/admission authority; `SR-014-B2` preserves IDSER as a read-only sizing consumer and SEM as reconstruction/execution owner.
- **Trust boundaries:** `SR-014-T1` registry route/model qualification → durable publication; `SR-014-T2` immutable calculated plan → authenticated read; `SR-014-T3` authenticated work → atomic reservation and sole transport claim.
- **Sensitive assets:** `SR-014-A1` provider bounds, enforcement approval/provenance, allocations, model qualification, held/spent window liabilities, and activation revisions.
- **Prohibited couplings:** `SR-014-C1` prohibits client-selected route/model/domain or direct table access; `SR-014-C2` prohibits a bypass send/limiter/scheduler; `SR-014-C3` prohibits payload/content/credential persistence in planning or allocation state.
- **Review bindings:** `SR-014-R1` is bound to `-02-01/-02-02` authority/publication negatives; `SR-014-R2` to `-03` authenticated zero-effect evidence; `SR-014-R3` to `-04-01/-02/-03` SQL/reconciliation/admission evidence; `SR-014-R4` to `-05` consumer zero-effect evidence. Each binding is independently CK-reviewable and together preserves the original end-to-end proof.

## Global hard stop

Stop the affected child for HMN/new planning decision if a required acceptance row needs a second operational lane, consumer-specific allocator, multi-active-route resolver, v1/v2 compatibility service, provider capacity fallback, or modification of an approved predecessor contract. Do not turn the separate IDSER environment bootstrap gap into a BSS-V2-014 prerequisite or repair scope.
