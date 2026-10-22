# BSS-V2-014-02-02 — Shared-domain calculated-allocation publication

- **State:** `planned`; executable BSS-V2-005 successor. No GO, admission, provider operation, or route enablement is authorized.
- **Parent:** [BSS-V2-014-02 split map](BSS-V2-014-02-model-route-shared-domain-publication.md).
- **Dependencies:** BSS-V2-014-01 and BSS-V2-014-02-01 CK `PASS`; approved BSS-V2-005 immutable desired-plan publication/activation and BSS-V2-006-05 effective-policy provenance contracts.

## Exact scope

Evolve the existing desired-plan publication seam atomically. Replace successor writes to the active single-route association with `DesiredAdmissionProfileRouteBinding/v2`, keyed by `(quotaDomainId, desiredProfileVersion, routeId, authorityVersion)`, and persist exactly one immutable `CalculatedClassProcessAllocation/v1` for that desired-plan identity. All bindings reference the same allocation and same capacity profile/effective mask; none copy provider quota or process baseline. The existing activation/epoch mechanism activates the complete immutable plan.

This child consumes only durable authority from `-02-01`. It neither changes registry publication, reader shape, runtime admission, consumer code, resolver behavior, provider activation, nor historical rows.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140202-01` | Two already-qualified routes in one quota domain bind one capacity profile, one effective mask, and one calculated process allocation; exact vectors/fingerprint occur once, not per route. | Shared-domain two-route isolated PostgreSQL fixture. |
| `RC-0140202-02` | A stale/forged authority version, different effective mask or capacity-profile version, foreign domain, inactive process/route, duplicate canonical binding, or missing allocation fails before publication/activation. | Negative SQL publication fixtures and zero activation assertion. |
| `RC-0140202-03` | A route/model/process/weight/policy revision publishes a new immutable desired-plan identity and activation revision. Historical plans, bindings, reservations, and claimed work remain readable with their prior identities and liabilities. | Publication/activation plus existing recovery fixture; historical immutability assertions. |
| `RC-0140202-04` | The existing desired-plan/activation seam is the sole active publication path. No second plan table, quota copy, resolver, scheduler, sender, legacy dual write, or provider activation is introduced. | Source/DDL entrypoint inventory and zero provider/job counters. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140202-T1`: durable route authority and allocation cross into immutable activation.
- `SR-0140202-A1`: effective mask, capacity/profile versions, allocation, bindings, fingerprints, and historical liabilities.
- `SR-0140202-C1`: prohibit authority substitution, quota cloning, mutable history, alternate publication/activation, and route fan-out.
- `SR-0140202-R1`: `RC-0140202-01..04` verify shared-domain uniqueness, closed publication negatives, immutable revisioning, and path inventory.

## Hard stop

Stop if the existing publication/activation primitive cannot represent the complete binding/allocation relation without a parallel active model, legacy dual write, resolver expansion, or cloning quotas. Do not defer the failed authority check to runtime admission.
