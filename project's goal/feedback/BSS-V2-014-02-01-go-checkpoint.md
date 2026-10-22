# BSS-V2-014-02-01 GO checkpoint — model-bound durable qualified-route authority

- **Ticket:** [BSS-V2-014-02-01 — Model-bound durable qualified-route authority](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-02-01-model-bound-route-authority.md)
- **State:** `awaiting_review`
- **Authority:** the frozen ticket and [contract freeze 001](BSS-V2-014-02-01-contract-freeze-001.md). This checkpoint does not issue CK `PASS`.

## Bounded implementation

- Added forward-only migrations `0088` and `0089` to evolve `bridge.qualified_provider_route_authority` in place. Complete `qualified_v1` rows retain the route, domain, provider, model/processor, adapter, qualification reference/version, capability, and publisher-assigned append-only version. Historical incomplete rows remain migration input only.
- Replaced the incomplete four-argument publisher with a Bridge-executable, security-definer eight-argument publisher. It validates complete input and quota-domain/provider/route association, returns the immutable reference, prevents direct table mutation, and never accepts a caller-selected authority version.
- Evolved the existing resolver/publication portion of `bindProviderWorkRouteFromResolver()` to pass and verify the full `QualifiedRoute` tuple plus the attempt’s server-derived quota domain, then return the immutable authority reference. The existing later SQL bind invocation is intentionally unchanged for `BSS-V2-014-04-02`.
- Added the direct PostgreSQL/runtime fixture and updated existing fixture callers to the complete publisher contract. No plan publication, binding-table migration, allocation, activation, reservation, claim, transport, provider call, resolver, or parallel authority relation was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-0140201-01` | Ticket Binary Review Contract row 01 | Resolver → publication portion → publisher persists the exact complete tuple, quota domain, and publisher-assigned version; route ID alone is insufficient. | `apps/agents-bridge/tests/model-route-authority.integration.test.ts` asserts returned/durable fields and distinct successor versions; `pnpm --filter @atlas/agents-bridge exec node --env-file=C:\Workspace\atlas\ces-platform\.env ./node_modules/jiti/lib/jiti-cli.mjs tests/model-route-authority.integration.test.ts` passed (2/2). | `PROVEN` |
| `RC-0140201-02` | Ticket Binary Review Contract row 02 | Forged, mismatched, foreign-domain, revoked/non-qualified identity rejects before durable publication and cannot overwrite history. | Same fixture proves forged provider, foreign domain, incomplete model, disabled/expired registry routes, and immutable historical authority rows; all pass. | `PROVEN` |
| `RC-0140201-03` | Ticket Binary Review Contract row 03 | Existing registry/resolver/publisher remain the sole seam; no downstream operational effect. | Fixture source/DDL inventory rejects a new binder or reservation/claim/transport object; its PostgreSQL counters remain `{ attempts: 0, reservations: 0, dispatches: 0, claims: 0 }`. Focused downstream regressions passed: `provider-route-bound-admission`, `fair-admission-atomic-dispatch`, `background-route-aware-admission`, `policy-aware-runtime-admission-fairness`, and `provider-neutral-compatibility-regression-closure`. | `PROVEN` |
| `RC-0140201-04` | Ticket Binary Review Contract row 04 | Immutable versioned complete reference returns at publication boundary; no binder/transport implementation. | Fixture asserts idempotent stale replay, distinct successor version, immutable rows, static absence of binder/transport changes, and returned reference substitution checks; all pass. | `PROVEN` |

Additional frozen validation:

```text
pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env scripts/migrate.mjs --check
# Atlas database migration check passed

pnpm --filter @atlas/agents-bridge typecheck
# tsc -p tsconfig.json passed
```

Diagnostic limitation: the non-ticket `generic-multi-consumer-compatibility.integration.test.ts` fixture was also run and could not observe its in-process transport because an already-running external Bridge worker consumed and reconciled its fixture jobs. Database evidence showed those jobs were claimed/reconciled by the external worker; this does not alter the frozen publication-boundary conditions above.

Internal readiness: `READY_FOR_CK`
