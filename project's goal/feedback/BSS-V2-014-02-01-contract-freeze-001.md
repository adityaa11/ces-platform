# BSS-V2-014-02-01 contract freeze 001 — Model-bound durable qualified-route authority

- **Ticket:** [BSS-V2-014-02-01 — Model-bound durable qualified-route authority](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-02-01-model-bound-route-authority.md)
- **Action:** initial bounded contract freeze before GO.
- **Operator authorization evidence:** explicit authorization in this task on 2026-10-23 to freeze `BSS-V2-014-02-01` only. No authorization ID is invented.
- **Reviewed source revision:** `2ae9fc539d969aa039f4379d8c70e668fd87010e` on `codex/new-atlas-backend` before this documentation-only commit.
- **Ticket state:** `frozen`. This record preserves the ticket's scope and Review Contract; it is neither a GO checkpoint nor a CK result.

## Preconditions verified

| Prerequisite | Evidence | Result |
| --- | --- | --- |
| Current target | `codex/new-atlas-backend` at `2ae9fc539d969aa039f4379d8c70e668fd87010e`; the named ticket resolves uniquely to `BSS-V2-014-02-01`. | `PROVEN` |
| BSS-V2-014-01 | [CK review](BSS-V2-014-01-15c5a73-review.md) records `PASS` for reviewed commit `15c5a73e87b2f252fae0ec194b4129dab1f3b1a0`; all six predecessor rows are `PROVEN`. | `PROVEN` |
| Qualified-route registry | [BSS-V2-BATCH-02 review](BSS-V2-BATCH-02-b83fa36-review.md) records `PASS` for the approved server-controlled qualified-route registry. | `PROVEN` |
| Immutable desired-plan publication boundary | [BSS-V2-BATCH-05-04 review](BSS-V2-BATCH-05-04-d25a08d-review.md) records `PASS` for the existing immutable `DesiredAdmissionProfile` publication/activation seam. It is a consumed boundary, not work in this ticket. | `PROVEN` |
| Effective-policy provenance | [BSS-V2-BATCH-06-05-06 review](BSS-V2-BATCH-06-05-06-cad0b9c2-review.md) records terminal BSS-V2-006-05 `PASS`, including the approved `EffectiveEnforcementPolicy/v1` provenance and fail-closed behavior. | `PROVEN` |
| Planning readiness | [BSS-V2-014 planning remediation report](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-planning-remediation-report.md) records `READY_FOR_CONTRACT_FREEZE`, no remaining planning blocker, and the ownership split used below. | `PROVEN` |

## Frozen existing seam

The qualified registry remains the only server-qualified source. Its `QualifiedRoute` supplies `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, and `qualificationVersion`; its resolver is the existing `QualifiedRouteResolver.resolve()` seam. The existing publication sub-operation of `bindProviderWorkRouteFromResolver()` invokes `bridge.publish_qualified_provider_route_authority`. The present publisher/table are route-keyed migration input only and are evolved in place by this ticket into an append-only, complete, version-addressable authority relation.

`-02-01` ends at that returned authority reference and complete tuple. `-02-02` alone owns immutable desired-plan binding/publication. `-04-02` alone owns the later bind call, attempt binding, reservation, claim, `ClaimedTransport`, and outbound identity enforcement. No downstream proof is imported into this ticket.

## Frozen Review Contract

The authority is the frozen ticket, its BSS-V2-014 split map and ticket-set rules, the approved BSS-V2-002 qualified registry, the approved BSS-V2-005-04 immutable publication boundary, and the accepted BSS-V2-006-05 effective-policy provenance interface. This record adds, removes, and reinterprets no requirement.

| Row | Required behavior | Required harness, scenarios, and observations | Boundary / forbidden substitute |
| --- | --- | --- | --- |
| `RC-0140201-01` | `QualifiedRouteResolver.resolve()` through the publication portion of `bindProviderWorkRouteFromResolver()` and the existing SQL publisher retains the exact server-qualified `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, quota domain, and append-only `authorityVersion`. A route ID alone cannot identify a successor authority row. | Isolated PostgreSQL integration fixture and `provider-operational-runtime` type/runtime publication fixture. Assert the durable row and returned reference field-for-field against the resolved tuple, including domain and publisher-assigned version. | Do not add a resolver, caller-supplied authority object, parallel authority table, desired plan, binding, allocation, or activation. |
| `RC-0140201-02` | Forged, stale, mismatched, foreign-domain, revoked, or non-qualified model identity rejects before durable authority publication and cannot overwrite a prior authority version. | Negative SQL and runtime-publisher fixtures for every named identity class. Assert no authority record is created for a rejected identity and historical-row immutability after a failed publication. | A type-only check, a mocked publisher, route-ID lookup after publication, mutable upsert, or caller-selected version is not proof. |
| `RC-0140201-03` | The existing qualified registry, `QualifiedRouteResolver`, and publisher remain the sole route-authority seam. | Source/DDL entrypoint inventory and zero-effect counters prove no new resolver, plan table/binding, quota copy, scheduler, sender, dual write, provider activation, job, or transport. | `-02-02` desired-plan work and `-04-02` attempt/reservation/claim/send work are excluded, not deferred implementation in this ticket. |
| `RC-0140201-04` | The complete published authority tuple is immutable and versioned; the publisher assigns and returns the reference adequate for later `-02-02` desired-plan binding and `-04-02` attempt binding. Forged, stale, or substituted versions fail at the publication boundary. | Publication-boundary SQL/runtime negative fixtures, immutable historical-row assertion, and static proof that no binder or transport path was added. | No reservation, claim, outbound transport, provider call, or end-to-end send proof belongs here; `RC-0140402-02` owns publication-to-transport proof. |

## Frozen validation and hard stops

The ticket's validation commands are frozen unchanged and are future GO/CK evidence, not executed by this planning record:

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/model-route-authority.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

The hard stop remains active. Return to planning authority if the existing publication sub-operation cannot be separated from the later bind operation without temporary compatibility code, a parallel authority table, a second resolver, compatibility write, or default model. No desired plan, route binding, allocation, activation, reservation, job, transport claim, provider call, model fallback, or new resolver is authorized here.

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0140201-B1` — BSS-V2-002 retains the qualified registry as the sole deployment-controlled route/model source; `SR-0140201-B2` — BSS-V2-005-04 remains the immutable desired-plan publication/activation seam; `SR-0140201-B3` — BSS-V2-006-05 remains effective-policy provenance authority.
- **Trust boundary:** `SR-0140201-T1` — server-qualified `QualifiedRouteResolver` identity crosses only through the existing runtime publisher into durable route authority.
- **Sensitive assets:** `SR-0140201-A1` — complete route/provider/model/adapter/qualification tuple, quota-domain identity, and publisher-assigned append-only authority version.
- **Identity context and extension seam:** `SR-0140201-I1` — the existing resolver result and publisher return reference retain complete qualified identity; later desired-plan and attempt-binding owners consume that immutable identity without re-resolution.
- **Prohibited couplings:** `SR-0140201-C1` — prohibit caller-supplied identity/version, mutable overwrite, alternate registry/resolver, parallel authority relation, binder, desired plan, scheduler, sender, provider fallback, dual write, and provider activation.
- **Verification seam:** `SR-0140201-V1` — isolated PostgreSQL publication fixture plus runtime publication fixture expose durable tuple/version and rejection without downstream execution.
- **Unresolved security policy:** none within this ticket; provider activation, desired-plan association, reservation, transport claim, and send remain explicitly owned by later tickets.
- **Planning findings:** none. The existing seam can be evolved in place without changing approved authority boundaries.
- **Review binding:** `SR-0140201-R1` — `RC-0140201-01..04` must prove exact publication provenance, fail-closed rejection, sole-entrypoint/zero-effect evidence, and an immutable later-bindable reference without downstream execution.

## GO boundary

A separate explicit `GO BSS-V2-014-02-01` may implement only these frozen rows through the existing qualified registry/publication seam, a forward-only migration, the bounded runtime shape change, direct fixtures, and a GO checkpoint. It does not authorize CK, CFC, HMN, `-02-02`, `-04-02`, desired-plan publication, activation, reservation, claim, transport, provider operation, or another ticket.
