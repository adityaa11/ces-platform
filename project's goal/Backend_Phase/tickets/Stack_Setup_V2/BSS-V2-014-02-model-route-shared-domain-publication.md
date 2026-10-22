# BSS-V2-014-02 — Model-route authority and shared-domain publication — split map

- **State:** `planned`; non-executable BSS-V2-005 family/traceability map. It is not GO, CK, CFC, HMN, migration, activation, or provider authority.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Authority:** [implementation context r2](../../atlas-bss-weighted-capacity-implementation-context-DRAFT-r2.md) §§2, 3.3, 5, and 7–10.
- **Dependencies:** BSS-V2-014-01 CK `PASS`; approved BSS-V2-005 immutable-plan publication and BSS-V2-006-05 effective-policy provenance contracts.

## Why the original leaf cannot complete one review flow

The original leaf combined two durable authority transitions: qualified registry → model-bound route authority, and authority/allocation → immutable multi-route desired-plan publication and activation. The first can be corrected without changing an active plan; the second changes a plan relation, allocation persistence, activation and historical-liability proof. A CFC finding in either transition would otherwise force CK to re-open evidence for the other. The split retains one planner, one registry and one activation seam.

## Executable children and dependency fence

| Order | Child | Sole implementation/proof seam | Requires |
| --- | --- | --- | --- |
| B1 | [BSS-V2-014-02-01](BSS-V2-014-02-01-model-bound-route-authority.md) | Existing qualified registry → append-only complete route/model/qualification authority version | `-01` CK `PASS` |
| B2 | [BSS-V2-014-02-02](BSS-V2-014-02-02-shared-domain-allocation-publication.md) | Existing desired-plan publication/activation → one shared-domain multi-route relation, one allocation identity, and retirement of the legacy single-route publisher | `-02-01` and `-01` CK `PASS` |

Only `-02-02` CK `PASS`, after `-02-01` CK `PASS`, completes this family and satisfies the `-03` and `-04-01` dependencies. A remediation stays in the child owning its failed row; it must not reopen an independently passed sibling.

## Preserved frozen authority

- The existing `qualified_provider_route_authority` is evolved in place; no second registry, resolver, provider route fan-out, client-selected model/route, or provider-specific path is permitted.
- A shared quota domain has one provider capacity and one calculated process allocation. Route bindings reference them; they never clone them.
- Successor writes are append-only. Candidate data may be published and qualified, but production activation occurs only through the parent BSS-V2-014 gate and existing activation epoch. Historical plans, bindings, reservations and liabilities remain readable but are not a compatibility path.
- The `publish_effective_policy_converged_desired_admission_profile` caller/signature/grant/dependent-object inventory is complete before cutover. Its legacy single-route callable, including `_v1` where present, is retired in the same cutover; no overload or historical reference remains executable as a publisher.
- Existing one-enabled-route-per-capability behavior remains unchanged. This family neither qualifies/enables a provider nor supplies absent model/context limits.

## Original review-contract coverage

`RC-01402-01` is discharged by `RC-0140201-01..04` and the admission identity gate in `RC-0140402-01`; `RC-01402-02/03` by `RC-0140202-01/02`; `RC-01402-04` by `RC-0140202-03`; and `RC-01402-05` by `RC-0140202-04/05`. The combined evidence remains the original requirement that a forged/stale identity cannot publish, bind, reserve, or reach transport claim—each gate is proven by its owner rather than asserted by publication alone.

## Family SecurityReadiness

- **Status:** `applicable`.
- `SR-01402-T1`: qualified registry to durable authority; `SR-01402-T2`: authority/allocation to immutable activation.
- `SR-01402-A1`: model, adapter, qualification, policy provenance, bindings, allocation fingerprints, and historical liabilities.
- `SR-01402-C1`: no client selection, mutable history, quota cloning, resolver fan-out, dual write, or alternate activation path.
- `SR-01402-R1`: `-02-01` proves the first transition, `-02-02` proves publication/activation, and `-04-02` proves the resulting route/model fence before reservation/send.

## Hard stop

Stop the affected child for HMN/new planning authority if the existing publication primitive cannot be evolved without a parallel active binding model, route fan-out, legacy dual write, new resolver, or provider-capacity fallback. Do not fold the other child into the repair.
