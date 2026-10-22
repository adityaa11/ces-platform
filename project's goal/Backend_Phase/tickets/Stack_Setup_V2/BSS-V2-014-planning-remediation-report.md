# BSS-V2-014 Planning Remediation Report

- **Status:** `READY_FOR_CONTRACT_FREEZE`.
- **Scope:** planning-contract remediation A–G only. This report is not GO, implementation, migration, activation, provider authorization, or evidence that the successor is already deployed.
- **Authority:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md) and the approved implementation context r2.

## Focused source inspection

The remediation is grounded in the present interfaces, not ticket inference: `bridge.qualified_provider_route_authority` is currently route-keyed and its publisher has only a limited identity; `bridge.provider_work_route_binding` and `bridge.claim_provider_admitted_transport` currently carry only a route/capability/adapter/qualification subset; `publish_effective_policy_converged_desired_admission_profile_v1` remains executable; and `bridge.read_capacity_planning_snapshot` returns v1. In `provider-operational-runtime.ts`, `QualifiedRouteResolver.resolve()` and the publication sub-operation of `bindProviderWorkRouteFromResolver()` currently narrow the qualified route before the SQL publisher, while `ClaimedTransport`, `claim()`, and `ProviderOutboundTransport` narrow the later claim/dispatch carrier. The existing immutable `bridge.workload_envelope_profile`, joined through `bridge.provider_process_profile` and desired-plan input, is the current versioned structural-bound/estimator/output-reservation source. The relevant current surfaces are migrations `0037`, `0038`, `0064`, `0079`, `0082`, and `0083`.

## Final contract precision remediation

The final correction changed only these existing planning files and rows:

| File | Corrected rows / outcome |
| --- | --- |
| `BSS-V2-014-02-01-model-bound-route-authority.md` | Scope and `RC-0140201-01..04`: assigns `QualifiedRouteResolver.resolve()`, the publication sub-operation of `bindProviderWorkRouteFromResolver()`, and the SQL authority publisher to `-02-01`; removes premature final-claim evidence. |
| `BSS-V2-014-04-02-atomic-process-baseline-enforcement.md` | Scope and `RC-0140402-02/04`: assigns the bind sub-operation, SQL binder/table, reservation validation, claim, `ClaimedTransport`, `claim()`, and `ProviderOutboundTransport` to `-04-02`; makes it prove the complete publication-to-existing-outbound-transport invariant. |
| `BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md` | `RC-01403-05`: requires isolated v2 qualification and premature-activation rejection only; removes positive consumer/cutover evidence from `-03` CK. |
| `BSS-V2-014-02-model-route-shared-domain-publication.md` and `BSS-V2-014-weighted-capacity-ticket-set.md` | Coverage and cross-owner references now place final transport proof in `-04-02`, and final consumer/cutover proof in `-05` plus the parent gate. |

## Seven issue dispositions

| Issue | Disposition | Frozen ownership and acceptance disposition |
| --- | --- | --- |
| A — route identity through attempt and claim | `RESOLVED` | [`-02-01`](BSS-V2-014-02-01-model-bound-route-authority.md) owns complete authority publication through `QualifiedRouteResolver.resolve()` and the publication sub-operation of `bindProviderWorkRouteFromResolver()`; [`-02-02`](BSS-V2-014-02-02-shared-domain-allocation-publication.md) pins it in the immutable desired binding; [`-04-02`](BSS-V2-014-04-02-atomic-process-baseline-enforcement.md) owns the later binding/claim/dispatch carrier. `RC-0140201-04` proves publication only; `RC-0140402-02` proves the full tuple through existing outbound transport. |
| B — single-route publisher retirement | `RESOLVED` | [`-02-02`](BSS-V2-014-02-02-shared-domain-allocation-publication.md) `RC-0140202-04` inventories callers, signatures, grants, owners, wrappers, triggers, and dependencies, then requires same-cutover retirement/revocation of every old signature, including `_v1`. |
| C — atomic snapshot v2 consumer cutover | `RESOLVED` | The [parent gate](BSS-V2-014-weighted-capacity-ticket-set.md) owns production readiness; [`-03`](BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md) qualifies server v2 in isolation and rejects premature activation, while [`-05`](BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md) replaces the sole consumer and proves the positive cutover. `RC-01403-05` and `RC-01405-05` prohibit an adapter, dual reader, v1 consumer, or fallback without imposing a future-consumer proof on `-03`. |
| D — one per-process accounting representation | `RESOLVED` | [`-04-01`](BSS-V2-014-04-01-process-window-usage-projection.md) now prefers a read-derived projection. Its exact invariant allows persistence only inside the same authoritative lifecycle transaction and forbids every independent writer, worker, reconciliation transaction, out-of-lifecycle trigger, and alternate accounting authority. |
| E — publication versus production activation | `RESOLVED` | [`-02-02`](BSS-V2-014-02-02-shared-domain-allocation-publication.md) can publish and qualify immutable data, but `RC-0140202-05` and the parent gate block production activation until `-04` enforcement and the `-03/-05` cutover are complete. |
| F — borrowing while a borrower is in flight | `RESOLVED` | [`-04-03`](BSS-V2-014-04-03-background-idle-borrowing.md) now requires existing liabilities in every vector calculation while explicitly allowing a further borrowed request when process, class, domain, and concurrency resources remain. |
| G — model structural-bound authority | `RESOLVED` | [`-02-01`](BSS-V2-014-02-01-model-bound-route-authority.md) owns the qualified route/model provenance; [`-03`](BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md) joins that version to the immutable workload structural-bound/profile; [`-05`](BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md) verifies it for full-request sizing. Missing any required bound fails closed; no name-default, TPM-derived context, or consumer-private profile is allowed. |

## Updated dependency graph

```text
-01 allocation
  -> -02-01 complete qualified authority publication
  -> -02-02 immutable multi-route publication + legacy publisher retirement
       -> -03 isolated v2 server qualification (after -05 contract freeze)
            -> -05 IDSER v2 consumer replacement + positive reader/consumer cutover proof
       -> -04-01 read-derived/same-transaction usage projection
            -> -04-02 atomic baseline + existing bind/claim/outbound identity enforcement
                 -> -04-03 atomic borrowing/fairness

parent production gate = -02-02 sole publisher + -03 + -04-03 + -05
```

The only pre-implementation dependency is `-05` contract freeze before `-03` GO. `-05` implementation follows `-03` CK PASS, so the graph has no cycle.

## Ownership matrix

| Concern | Sole owner(s) | Boundary |
| --- | --- | --- |
| Qualified route/model authority | `-02-01` | Existing `QualifiedRouteResolver.resolve()` and publication portion of `bindProviderWorkRouteFromResolver()` → existing SQL publisher → append-only authority version. |
| Desired-plan binding and publication | `-02-02` | Existing desired-plan seam; one successor publisher; legacy callable retired. |
| Snapshot v2 server | `-03` | Existing authenticated reader/endpoint evolved in place; read-only planning data. |
| IDSER v2 consumer | `-05` | One read-only complete-request sizing consumer; no BSS mutation. |
| Process usage | `-04-01` | Read-derived authoritative-ledger projection, or strictly same-lifecycle-transaction persistence. |
| Attempt, reservation, claim, and send identity | `-04-02` | Existing bind portion of `bindProviderWorkRouteFromResolver()` → SQL binder/table → domain-locked admission/reservation → claim → `ClaimedTransport`/`claim()` → existing `ProviderOutboundTransport`. |
| Borrowing | `-04-03` | Same atomic admission transaction only. |
| Production activation/readiness | Parent `BSS-V2-014` | Existing activation epoch; no new activation service. |

## Single-path confirmation

The remediated contracts require one authorized publication entrypoint after cutover, one existing authenticated reader and active v2 consumer, one existing atomic reservation/transport chain, and one authoritative reservation/window ledger. The publication and binding sub-operations remain inside the same existing runtime function, with separate ticket ownership but no duplicate function or temporary lane. They expressly prohibit dual publication, dual reading, adapters, alternate schedulers, alternate provider-send paths, independent accounting writers, consumer-specific allocation, a second resolver, metadata side channel, or alternate claim DTO/parser.

## Remaining freeze blockers

None in the planning contract. `-02-01` CK requires only publication-boundary evidence obtainable before `-02-02/-04-02`; `-03` CK requires only isolated server evidence obtainable before `-05` implementation. The later `-04-02`, `-05`, and parent gate retain the end-to-end and production-cutover proofs. Implementation evidence remains a future GO/CK obligation: the stated release gate must not be treated as passed until each named Review Contract row has its required migration, inventory, integration, and cutover evidence.

## Recommendation

`READY_FOR_CONTRACT_FREEZE`
