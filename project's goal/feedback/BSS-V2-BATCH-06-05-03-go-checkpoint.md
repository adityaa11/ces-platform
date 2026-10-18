# BSS-V2-BATCH-06-05-03 GO checkpoint

- **Ticket:** `BSS-V2-006-05-03` — Authenticated effective-capacity snapshot
- **Ticket state:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-05-03`
- **Authorized checkpoint:** explicit `GO BSS-V2-006-05-03`
- **Scope:** BSS-V2-005 authenticated planning-reader/public schema only; no BSS-V2-006 admission mutation.

## Bounded implementation

`CapacityPlanningSnapshot/v1` is now a production-callable, authenticated
Bridge endpoint.  Its opaque, server-owned principal registration fixes the
quota domain, process/profile, route, class, and prospective-read grant before
the BSS-V2-005 database projection runs.  Consumers cannot select a policy,
profile version, activation revision, or admission scope.

Migration `0082_bssv20060503_authenticated_effective_capacity_snapshot` adds
the only public BSS-V2-005 database projection.  It reads immutable capacity
source provenance, the server-derived effective enforcement policy, exact
process/workload structural and estimator versions, and an active desired-plan
identity when one exists.  A prospective inactive read returns a typed inactive
planning view; it cannot publish/activate a plan, reserve, enqueue, send, or
mutate quota.  No consumer receives Bridge-table rights.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| `RC-00605-08` | `BSS-V2-006-05-03` Outcome, Review contract, SecurityReadiness `SR-0503-T1/A1/C1/R1` | Authenticated planning-only reader returns exact Anoman source/enforcement/structural/estimator identity with zero attempts, reservations, jobs, sends, or quota mutation; foreign/stale/unauthenticated access fails closed; prospective view cannot activate. | `apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts`; `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/capacity-planning-snapshot.integration.test.ts` from `apps/agents-bridge` — PASS (1/1). The test reads migration-0076 profile `anoman-shared-prod@2026-10-18.1`, observes RPD as authorized `not_enforced`, confirms inactive prospective status and `plan: null`, asserts zero-delta counters before/after positive and negative reads, rejects foreign/forged credentials, and proves `atlas_app` cannot execute the projection. | `PROVEN` |

Additional validation:

```text
corepack pnpm --filter @atlas/db typecheck                                      PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                           PASS
node --env-file=../../.env scripts/migrate.mjs --check (packages/atlas-db)     PASS
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/authorized-enforcement-policy-provenance.integration.test.ts (packages/atlas-db)  PASS (1/1)
git diff --check                                                                PASS
```

No runtime admission, reservation, dispatch, transport, provider call, route
activation, desired-plan publication, direct consumer table access, or
consumer-owned policy derivation was introduced.

Internal readiness: `READY_FOR_CK`.
