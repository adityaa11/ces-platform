# BSS-V2-014-04-02 — Atomic process baseline and cap enforcement

- **State:** `awaiting_review`; GO implementation is committed at `5e3cf7a24b75f0b172a93d400b572cc57b7ef77e` and is pending CK. Borrowing, provider operation, and route activation remain unauthorized.
- **Parent:** [BSS-V2-014-04 split map](BSS-V2-014-04-atomic-process-admission-and-borrowing.md).
- **Dependencies:** BSS-V2-014-04-01 CK `PASS`, BSS-V2-014-02-02 CK `PASS`, and approved BSS-V2-006 fairness/recovery predecessors.

## Exact scope

Inside the existing domain-locked `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` transaction, consume the immutable allocation and `ProcessCapacityWindowUsage/v1` to enforce exact active plan/process/profile/route/model authority, each process baseline, explicit cap, class pool, protected interactive reserve, and physical domain quota. This child owns the attempt-binding portion of the existing `bindProviderWorkRouteFromResolver()` after `-02-01` has published authority: consume its authoritative reference, invoke the existing `bridge.bind_provider_work_route` seam, and never republish or re-resolve identity. `bridge.provider_work_route_binding` must pin the complete `-02-01` tuple—`routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and `authorityVersion`—not merely a route id. `bridge.require_provider_work_route_before_reservation`, `bridge.reserve_provider_operational_windows`, and `bridge.claim_provider_admitted_transport` must validate or carry that same immutable identity, with the final transport claim exposing the exact claimed tuple. Enforce RPM, TPM, concurrency and every other effective dimension independently. An attempt above its baseline is denied/deferred in this child; borrowing is exclusively `-04-03`.

Preserve existing fairness, reservation/job/transport ordering and `0084` recovery. Stale or oversized waiting work follows the existing typed replan/stop pathway; historical held/claimed liabilities retain their original plan identity.

## Affected existing interfaces and required change

| Existing interface | `-04-02` successor responsibility |
| --- | --- |
| `provider-operational-runtime.ts` `bindProviderWorkRouteFromResolver()` | Evolve only its existing attempt-binding sub-operation to consume the `-02-01` authority reference and call the evolved binder. Do not duplicate, replace, or re-run its authority-publication sub-operation. |
| `bridge.bind_provider_work_route` / `bridge.provider_work_route_binding` | Evolve the existing signature and durable binding in place to pin and validate the complete authority tuple/version against the desired-plan binding. |
| Existing reservation and window functions | Preserve the existing reservation transaction and validate the pinned identity before reservation/window mutation; no alternate admission transaction or route service. |
| `bridge.claim_provider_admitted_transport` | Evolve the sole claim to return the full pinned tuple/version from the binding; it cannot re-resolve by route id. |
| `provider-operational-runtime.ts` `ClaimedTransport` and `claim()` | Evolve the existing DTO, parser, and required-field validation in place so the full claimed tuple/version is retained; no side-channel metadata object or alternate parser. |
| `provider-operational-runtime.ts` `ProviderOutboundTransport` | Evolve the existing dispatch input to receive the full claimed tuple/version. The outbound implementation must use that claimed identity and must not select a model through route id, capability, provider default, or a second resolver. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140402-01` | Exact active plan, process/profile, complete route authority tuple/version, sizing identity, process RPM/TPM/concurrency baseline, explicit cap, class pool, interactive protection, and domain quota are independently checked in one SQL transaction. Saturating any one creates no reservation, job, or send. | Isolated PostgreSQL admission matrix with exact counters. |
| `RC-0140402-02` | A stale, forged, revoked, mismatched, or incomplete route/model/adapter/qualification/authority-version/policy/allocation identity cannot reserve, claim, or reach an authorized provider send. The `-02-01` published tuple → `-02-02` desired-plan binding → `bindProviderWorkRouteFromResolver()` attempt binding → reservation → final claim → existing `ProviderOutboundTransport` input is field-for-field the same immutable authority. Revision preserves old held/claimed liabilities; incompatible waiting work is typed `REPLAN_REQUIRED`/`UNFIT` through the existing recovery path. | Cross-ticket publication-to-existing-outbound-transport fixture; TypeScript DTO/parser required-field negatives; SQL binding/reservation/claim equality assertions; revision/recovery fixture; and zero forbidden-send assertion. |
| `RC-0140402-03` | Authorized Anoman excluded RPD performs no RPD admission check or RPD ledger reservation while RPM/TPM/concurrency remain exact. Missing/revoked/mismatched exclusion approval fails closed without fallback. | WCA-15 positive/negative atomic-admission fixtures. |
| `RC-0140402-04` | The existing atomic admission/reservation/pg-boss/claim/`ProviderOutboundTransport` chain remains sole authority. No borrowing, new resolver, route-binding service, side-channel metadata object, alternate claim DTO/parser, queue, scheduler, reservation family, direct transport, or provider call is introduced. | Source/SQL/TypeScript entrypoint inventory and non-admission/zero-send checks. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140402-T1`: immutable allocation and complete route/model authority cross through the existing attempt binder, atomic reservation, sole transport claim, and existing outbound dispatch input.
- `SR-0140402-A1`: process baseline/cap, usage projection, activation identity, complete route authority tuple, and physical liabilities.
- `SR-0140402-C1`: prohibit off-lock checks, above-baseline admission, route/model fallback, second resolver, metadata side channel, alternate DTO/parser, new reservation/send paths, and rebase of historical liabilities.
- `SR-0140402-R1`: `RC-0140402-01..04` verify all-resource atomic negatives, end-to-end authority/recovery fences, RPD policy, and sole-path evidence.

## Hard stop

Stop if a process baseline/cap cannot be checked against reconciled facts under the existing lock, if the complete route authority tuple cannot remain pinned through the existing outbound transport input, or if the publication/binding split in `bindProviderWorkRouteFromResolver()` requires a compatibility lane. Do not add borrowing, a second resolver, or a compensating scheduler.
