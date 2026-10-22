# BSS-V2-014-02-01 — Model-bound durable qualified-route authority

- **State:** `planned`; executable BSS-V2-005 successor. No GO, activation, plan publication, admission, or provider operation is authorized.
- **Parent:** [BSS-V2-014-02 split map](BSS-V2-014-02-model-route-shared-domain-publication.md).
- **Dependencies:** BSS-V2-014-01 CK `PASS`; approved qualified-registry and effective-policy provenance predecessors.

## Exact scope

Evolve the existing qualified registry publication path and `bridge.qualified_provider_route_authority` in place. Each append-only authority version must retain the server-qualified `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and an `authorityVersion`. The existing runtime publisher passes those already-qualified values; stale, forged, mismatched, foreign-domain, or revoked identity cannot replace or create a durable authority record.

This child creates neither a desired plan nor a route binding, allocation, activation, reservation, job, transport claim, provider call, resolver, or model fallback. The successor publication relation belongs only to `-02-02`.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140201-01` | Registry → existing runtime publisher → durable authority retains the exact route, provider, model, adapter, qualification reference/version, domain, and append-only authority version. | Isolated PostgreSQL integration fixture plus `provider-operational-runtime` integration test. |
| `RC-0140201-02` | Forged, stale, mismatched, foreign-domain, revoked, or non-qualified model identity is rejected before durable authority publication; it cannot overwrite a prior authority version. | Negative SQL and runtime-publisher fixtures; historical-row immutability assertion. |
| `RC-0140201-03` | The existing qualified registry and publisher remain the sole route-authority seam. No resolver, plan table/binding, quota copy, scheduler, sender, dual write, provider activation, job, or transport is introduced. | Source/DDL entrypoint inventory and zero-effect counters. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/model-route-authority.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140201-T1`: server-qualified registry identity crosses into durable route authority.
- `SR-0140201-A1`: model/adapter/qualification identity and append-only authority version.
- `SR-0140201-C1`: prohibit caller-supplied identity, mutable overwrite, alternate registry/resolver, and provider fallback.
- `SR-0140201-R1`: `RC-0140201-01..03` verify exact provenance, rejection, and sole-entrypoint evidence.

## Hard stop

Stop if model/qualification identity cannot flow through the existing registry publication seam without a parallel authority table, resolver, compatibility write, or default model. Do not publish a plan as a workaround.
