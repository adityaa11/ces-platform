# GO checkpoint — BSS-V2-014-02-02

- **Ticket:** [BSS-V2-014-02-02 — Shared-domain calculated-allocation publication](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-02-02-shared-domain-allocation-publication.md)
- **Batch:** `BSS-V2-014`
- **Authorized action:** explicit `GO BSS-V2-014-02-02` in this task on 2026-10-23.
- **Predecessors:** `BSS-V2-014-01` CK `PASS` at `15c5a73e87b2f252fae0ec194b4129dab1f3b1a0`; `BSS-V2-014-02-01` CK `PASS` at `47d5612e8e7d1dd9505f01000b82c92ae964a80`.
- **State:** `awaiting_review`.
- **Reviewed target:** this checkpoint's containing implementation commit. This checkpoint does not issue CK `PASS`.

## Bounded implementation

The existing desired-plan seam now has one shared-domain successor publisher,
`bridge.publish_shared_domain_calculated_desired_admission_profile`. It writes
one immutable `CalculatedClassProcessAllocation/v1` per desired-plan identity
and immutable `DesiredAdmissionProfileRouteBinding/v2` rows keyed by domain,
plan, route, and qualified authority version. Every binding references the
same capacity-profile version, effective mask, and allocation version.

The retired single-route publisher and its `_v1` implementation are dropped.
The legacy convergence fixture is explicitly skipped because its only public
entrypoint is intentionally no longer executable. Candidate publication does
not call the activation primitive; the existing primitive rejects this
successor until the parent BSS-V2-014 `-03/-04/-05` cutover gate exists.

No registry/resolver, runtime admission, reservation, claim, transport,
provider activation, consumer, or historical-row mutation was introduced.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-0140202-01` | Frozen ticket binary contract row 01 | Two qualified routes share one capacity profile, mask, immutable allocation, and exact authority versions without quota/allocation cloning. | `weighted-capacity-publication.integration.test.ts`: two-route fixture asserts one allocation row and two bindings with one capacity/mask/allocation identity. | `PROVEN` |
| `RC-0140202-02` | Frozen ticket binary contract row 02 | Stale/forged authority, different mask, inactive route, duplicate binding, and missing allocation fail before candidate publication or activation. | Same fixture exercises each named rejection and observes zero candidate/activation rows before success. | `PROVEN` |
| `RC-0140202-03` | Frozen ticket binary contract row 03 | Changed planner/allocation revision creates a new immutable candidate while prior bindings/allocation remain readable and no activation occurs. | Same fixture publishes revisions 1 and 2, asserts distinct profile identities, four historical bindings, and zero activation rows. | `PROVEN` |
| `RC-0140202-04` | Frozen ticket binary contract row 04 | Inventory proves only the successor publisher is executable; legacy signature and `_v1` have no executable callable. | Migration `0091` drops both former signatures; fixture checks `to_regprocedure(...) IS NULL`, Bridge-only successor execution, and negative legacy invocation. | `PROVEN` |
| `RC-0140202-05` | Frozen ticket binary contract row 05 | Candidate publication succeeds but premature production activation rejects with zero runtime-policy change. | Same fixture calls the existing activation seam and observes parent-gate rejection plus no active-plan row. | `PROVEN` |

## Validation evidence

All commands ran through the `atlas-canonical-perception` Docker Compose
project against its PostgreSQL service:

```text
pnpm --filter @atlas/db migration:check
# PASS — Atlas database migration check passed

pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts
# PASS — 1/1

pnpm --filter @atlas/db exec jiti tests/effective-plan-publication-convergence.integration.test.ts
# PASS — 0 failures; 1 expected skip because its retired public publisher is intentionally absent

pnpm --filter @atlas/agents-bridge typecheck
# PASS — tsc -p tsconfig.json

git diff --check
# PASS
```

Internal readiness: `READY_FOR_CK`.
