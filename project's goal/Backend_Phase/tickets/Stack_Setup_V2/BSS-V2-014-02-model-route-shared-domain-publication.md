# BSS-V2-014-02 — Model-bound route authority and shared-domain allocation publication

- **State:** `planned`; BSS-V2-005 successor. No GO, implementation, migration, route activation, or provider call is authorized.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Dependencies:** BSS-V2-014-01 CK `PASS`; approved BSS-V2-005 immutable-plan publication and BSS-V2-006-05 effective-policy provenance contracts.

## Exact scope

Replace the active single-route desired-plan binding with a single shared-domain publication that can bind one or more already-qualified routes without multiplying quota or allocation. The successor must use the existing registry and publication path, not create a resolver or admission lane.

### Frozen successor contracts

1. Extend the existing durable qualified-route authority projection, sourced only from the existing qualified registry, with immutable `modelOrProcessorId`, `qualificationRef`, `adapterVersion`, `qualificationVersion`, and `authorityVersion`. A route authority version is append-only; a stale/forged/mismatched version cannot bind a new plan or attempt. This is an evolution of `qualified_provider_route_authority`, not a second registry.
2. Replace the active single-row plan-policy association with `DesiredAdmissionProfileRouteBinding/v2`, keyed by `(quotaDomainId, desiredProfileVersion, routeId, authorityVersion)`. It carries the exact qualified model identity and the policy/capacity-profile version that produced the domain-wide effective mask. All bindings in one plan must have the same domain, capacity-profile version, and effective dimension policy; conflicting bindings fail closed.
3. Persist one immutable `CalculatedClassProcessAllocation/v1` produced by `-01`, keyed by the desired-plan identity. Route bindings reference it; they never copy or multiply its process or provider quotas.
4. Change the existing publication function and its callers atomically: the active writer emits only the successor binding model, and the existing activation/epoch mechanism activates the complete immutable plan. Historical plans, reservations, and route bindings remain readable as historical records but are not an active compatibility path.

Existing resolver behavior remains one enabled route per capability. This ticket does not authorize multiple active routes for a capability, provider discovery, a provider profile change, or an Anoman route enablement.

## Affected existing interfaces and required change

| Existing interface | Required successor change |
| --- | --- |
| `route-registry.ts` / `provider-operational-runtime.ts` | Propagate existing pinned `modelOrProcessorId` and qualification reference to the durable authority publication; no alternate resolver. |
| `bridge.qualified_provider_route_authority` and `publish_qualified_provider_route_authority` | Add model-qualified immutable authority version and reject stale/forged route/model identity before binding/admission. |
| `desired_admission_profile_policy_binding` / `publish_effective_policy_converged_desired_admission_profile` | Retire the single-route active binding from successor writes; publish the multi-route relation and one domain allocation atomically. |
| `desired_admission_profile_input` and activation revision | Bind active registered processes exactly once to the allocation and preserve existing immutable activation behavior. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-01402-01` | Registry → durable authority → plan binding retains exact route, provider, model, adapter, qualification reference/version, and authority version. A forged/stale/mismatched model identity cannot publish, bind, reserve, or reach transport claim. | Isolated PostgreSQL integration fixture and `provider-operational-runtime` integration test. |
| `RC-01402-02` | Two qualified routes in one quota domain bind one capacity profile and one calculated process allocation. The provider quota and each process baseline are represented once, not once per route. | Shared-domain two-route SQL fixture; exact row/fingerprint/vector assertions. |
| `RC-01402-03` | Different effective masks, capacity profile versions, foreign domains, inactive process/route binding, or duplicated canonical binding fail closed before activation. | Negative SQL publication fixture. |
| `RC-01402-04` | A route/model/process/weight/policy revision produces a new immutable desired-plan identity and activation revision. Existing reserved/claimed work retains its prior route/model and physical liabilities. | Publication plus existing recovery fixture; historical-row immutability assertion. |
| `RC-01402-05` | The active publication path is the existing desired-plan/activation seam. No second resolver, plan table, quota copy, scheduler, sender, legacy dual write, or provider activation is introduced. | Source/DDL entrypoint inventory and zero provider/job counters. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/model-route-authority.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01402-T1`: configured qualified registry → durable model-bound authority is a privileged trust transition.
- `SR-01402-T2`: immutable plan publication → activation is the sole authority transition for calculated allocations.
- `SR-01402-A1`: model/adapter/qualification identity, effective policy provenance, route bindings, fingerprints, and historical liabilities are sensitive durable assets.
- `SR-01402-C1`: prohibit client route/model selection, policy-mask conflicts, mutable overwrite of historical route identity, quota cloning, and resolver fan-out.
- `SR-01402-R1`: `RC-01402-01..05` bind identity provenance, shared-domain arithmetic, database role constraints, and zero alternate-path evidence.

## Hard stop

Stop for HMN/new planning authority if the current publication primitive cannot be evolved without a parallel active binding model, route fan-out, legacy dual write, or a new resolver. Do not solve a missing qualified model/context bound by using provider TPM, a default model, or a route-specific fallback.
