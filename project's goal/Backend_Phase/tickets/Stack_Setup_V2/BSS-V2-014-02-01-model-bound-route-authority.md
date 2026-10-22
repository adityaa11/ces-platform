# BSS-V2-014-02-01 — Model-bound durable qualified-route authority

- **State:** `approved`; contract freeze: [BSS-V2-014-02-01 contract freeze 001](../../../feedback/BSS-V2-014-02-01-contract-freeze-001.md); implementation checkpoint: [BSS-V2-014-02-01 GO checkpoint](../../../feedback/BSS-V2-014-02-01-go-checkpoint.md). Executable BSS-V2-005 successor. No activation, plan publication, admission, or provider operation is authorized.
- **Parent:** [BSS-V2-014-02 split map](BSS-V2-014-02-model-route-shared-domain-publication.md).
- **Dependencies:** BSS-V2-014-01 CK `PASS`; approved qualified-registry and effective-policy provenance predecessors.

## Exact scope

Evolve the existing qualified registry publication path and `bridge.qualified_provider_route_authority` in place. The current route-keyed row and `bridge.publish_qualified_provider_route_authority` are a successor-migration input, not sufficient authority by themselves. Each append-only authority version must retain the server-qualified `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and an `authorityVersion`, with the complete tuple immutable and addressable by the version. `authorityVersion` is assigned and returned by the versioned authority-publication mechanism; it is never invented by a resolver or accepted as caller-selected identity. Stale, forged, mismatched, foreign-domain, or revoked identity cannot replace or create a durable authority record.

`-02-01` owns only the route-authority publication portion of the existing `bindProviderWorkRouteFromResolver()` function: obtain the complete server-qualified tuple from `QualifiedRouteResolver.resolve()`, invoke the existing SQL publisher with that tuple, and retain the returned immutable authority reference for its existing caller. It supplies that reference and tuple to `-02-02`; the latter binds it to a desired plan. `-04-02` alone owns the later attempt-binding portion of the same function and carries the pinned identity through `bridge.bind_provider_work_route`, `bridge.provider_work_route_binding`, reservation, claim, and send. No child may re-resolve a model from a route id after authority has been published.

This child creates neither a desired plan nor a route binding, allocation, activation, reservation, job, transport claim, provider call, new resolver, or model fallback. The successor publication relation belongs only to `-02-02`.

## Affected existing interfaces and required change

| Existing interface | `-02-01` successor responsibility |
| --- | --- |
| `route-registry.ts` `QualifiedRoute` / `QualifiedRouteRuntime` | Remains the sole server-qualified source of the complete route/model tuple; no new resolver or caller-supplied authority object. |
| `provider-operational-runtime.ts` `QualifiedRouteResolver.resolve()` | Evolve its existing result shape in place so the authority-publication portion can read `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, and `qualificationVersion`; it does not accept or generate `authorityVersion`. |
| `provider-operational-runtime.ts` `bindProviderWorkRouteFromResolver()` | Own only its existing authority-publication sub-operation: pass the complete server-qualified tuple to the SQL publisher and receive the authoritative versioned reference. Its subsequent SQL attempt-binding call is owned by `-04-02`, not duplicated here. |
| `bridge.publish_qualified_provider_route_authority` / `bridge.qualified_provider_route_authority` | Evolve the existing publisher and table in place to validate, persist, and return the immutable complete authority tuple/version. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140201-01` | `QualifiedRouteResolver.resolve()` → the publication portion of `bindProviderWorkRouteFromResolver()` → existing SQL publisher → durable authority retains the exact route, provider, model/processor, adapter, qualification reference/version, domain, and append-only authority version; a route id alone cannot identify a successor authority row. | Isolated PostgreSQL integration fixture plus `provider-operational-runtime` type/runtime publication fixture. |
| `RC-0140201-02` | Forged, stale, mismatched, foreign-domain, revoked, or non-qualified model identity is rejected before durable authority publication; it cannot overwrite a prior authority version. | Negative SQL and runtime-publisher fixtures; historical-row immutability assertion. |
| `RC-0140201-03` | The existing qualified registry, `QualifiedRouteResolver`, and publisher remain the sole route-authority seam. No resolver, plan table/binding, quota copy, scheduler, sender, dual write, provider activation, job, or transport is introduced. | Source/DDL entrypoint inventory and zero-effect counters. |
| `RC-0140201-04` | The complete published authority tuple is immutable and versioned; its returned reference is sufficient for `-02-02` desired-plan binding and later `-04-02` attempt binding. Forged, stale, or substituted versions fail at the publication boundary. This child does not execute reservation, claim, or outbound transport functionality. | Publication-boundary SQL/runtime negatives, immutability assertion, and static proof that no binder or transport path was added. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/model-route-authority.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140201-T1`: server-qualified `QualifiedRouteResolver` identity crosses through the existing runtime publisher into durable route authority.
- `SR-0140201-A1`: model/adapter/qualification identity and append-only authority version.
- `SR-0140201-C1`: prohibit caller-supplied identity/version, mutable overwrite, alternate registry/resolver, binder, or provider fallback.
- `SR-0140201-R1`: `RC-0140201-01..04` verify exact publication provenance, rejection, sole-entrypoint evidence, and a later-bindable immutable reference without premature downstream execution.

## Hard stop

Stop if the publication portion cannot be separated from the existing function's later bind operation without temporary compatibility code, a parallel authority table, second resolver, compatibility write, or default model. Do not publish a plan or add a second function as a workaround.
