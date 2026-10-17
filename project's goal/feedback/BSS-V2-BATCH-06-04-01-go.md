# GO checkpoint — BSS-V2-006-04-01

- **Ticket:** `BSS-V2-006-04-01` — Runtime capacity-constraint read boundary
- **Batch:** `BSS-V2-BATCH-06-04-01`
- **Authority:** explicit user command `GO BSS-V2-006-04-01`; frozen ticket `BSS-V2-006-04-01-runtime-capacity-constraint-read-boundary.md`, its explicit 006-04 split map, and the versioned consumer-interface checkpoint.
- **Predecessors:** CK `PASS` is recorded for 006-01 (`3889798`), 006-02 (`da34a0c`), 03A-01..06 (`29c7ef3`, `7ed97f1`, `bb3b514`, `a00ffd2`, `46e46d3`, `36246f2`), and 005-05-04 (`e76e43f`). No awaiting-review predecessor was consumed.
- **Implementation commit:** `ad76fbaf4e9e5cf4e451b607d8fc0daa72bb6cc1` (`feat(admission): add runtime capacity constraint read`).
- **State:** `awaiting_review`. This is GO evidence, not a CK decision.

## Bounded implementation

Added the authenticated `RuntimeCapacityConstraint/v1` Bridge entrypoint and a single read-only database projection. The entrypoint accepts only an opaque credential and server-resolves process/profile, route, quota-domain, and service-class identity; the caller cannot choose a foreign scope. The projection returns active desired-plan/policy and opaque effective-constraint revisions, safe window/cooldown/clamp state, both service-class eligibility flags, and one conservative typed reason. It exposes neither raw counters nor a send permit.

The projection reads the accepted active-plan, 03A window, pressure, and qualified-route state only. It creates no attempt, reservation, pg-boss job, transport claim, provider send, quota mutation, BSS-005 publication, consumer adapter, semantic/reconciliation behavior, or provider call.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact validation command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `RC-BSSV2-00604-11` | Frozen ticket review contract, Required evidence, and `SR-0401-T1/C1/R1`. | A genuine authenticated external planning fixture uses the real Bridge read entrypoint with isolated PostgreSQL/pg-boss. It must prove active BSS-005 policy identity and BSS-006 effective constraints without counter/attempt/reservation/job/claim/send/quota mutation; background and interactive identities qualify; forged class/domain/route and unknown/stale/cooldown/unavailable state fail closed; reading cannot authorize sending. | `apps/agents-bridge/src/runtime-capacity-constraint.ts` is the opaque-credential, server-bound entrypoint. `packages/atlas-db/migrations/0068_bssv20060401_runtime_capacity_constraint_read.sql` is the agents-bridge-only read projection. `apps/agents-bridge/tests/runtime-capacity-constraint.integration.test.ts` drives two independent external fake consumers through that entrypoint, establishes non-inert admitted 03A state, snapshots exact durable counters, and proves zero deltas. It also observes forged credential/domain/class/route rejection, stale revision fencing, cooldown, unavailable policy, and an unknown window. `atlas_app` is denied direct execution. | `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/runtime-capacity-constraint.integration.test.ts` from `apps/agents-bridge` — PASS (1/1); `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS; `corepack pnpm --filter @atlas/db typecheck` — PASS; `node --env-file=../../.env scripts/migrate.mjs --check` from `packages/atlas-db` — PASS; `git diff --check ad76fbaf^ ad76fbaf` — PASS. | `PROVEN` |

Internal readiness: `READY_FOR_CK`

Control returns to CK for an independent review of the frozen row. No provider-work admission or send authority is handed off by this read boundary.
