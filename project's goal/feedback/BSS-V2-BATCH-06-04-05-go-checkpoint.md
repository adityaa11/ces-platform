# BSS-V2-BATCH-06-04-05 GO checkpoint

- **Ticket:** `BSS-V2-006-04-05` — Constraint convergence and structural-replan projection
- **Ticket state:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-04-05`
- **Authorized implementation commit:** `7d169e3642e0663dc07b7a7fb062b48fc1a82a98` (`feat(admission): project constraint convergence outcomes`)
- **Dependency gate:** `BSS-V2-006-04-04` CK `PASS`, recorded by `project's goal/feedback/BSS-V2-BATCH-06-04-04-go-checkpoint.md` and approval commit `10d3a93d`.

## Bounded implementation

Migration `0075_bssv20060405_constraint_convergence_structural_replan_projection`
projects the existing active BSS-005 plan and 03A durable pressure facts as a
conservative `effectiveCapacity` on `RuntimeCapacityConstraint/v1`. The
projection starts at the active plan and can only decrease through qualified
domain pressure clamps. A missing operational accounting surface returns the
already-established conservative unknown state; runtime observations never
publish or raise a BSS-005 plan.

The existing immutable convergence intent is now public as the versioned
`consumer_replan_required` admission outcome with a
`ConsumerReplanRequired/v1` attribution record. It names the source and
required desired-profile/activation revisions. It does not rewrite, split,
truncate, retry, or send the immutable work. Cancellation keeps its established
terminal precedence, and old reservations retain their historic identity.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00604-04` | Active plan increase/decrease and wakeup must alter future public eligibility/admission without preemption; one wakeup and fairness rebase are required. | `apps/agents-bridge/tests/constraint-convergence-structural-replan.integration.test.ts` activates versioned `plan-v1` → lower `plan-v2` → increased `plan-v3` through the durable worker. It asserts one `active-plan:2` dispatch, the reset `plan-v2:2` fairness epoch, no send for historical work, and exactly one send for newly eligible versioned work. The existing real-worker `durable-wakeup-convergence.integration.test.ts` also proves replay deduplication and historical in-flight liability. Focused commands passed. | `PROVEN` |
| `RC-BSSV2-00604-05` | Public runtime observations may never exceed the active BSS-005 plan; higher runtime facts cannot raise capacity; retain only operational-minimum metadata. | The fixture reads the authenticated public route and asserts the active v1/v2/v3 vectors. A trusted domain RPM observation lowers the public vector from 10 to 2; a later higher 100-unit observation leaves it at 2. Matched recovery restores only the active plan ceiling (10). Migration 0075 uses `apply_domain_pressure_clamps` over the active profile and exposes no provider body, headers, secrets, or policy-authoring surface. | `PROVEN` |
| `RC-BSSV2-00604-07` | Trusted downgrade clamps immediately; ambiguous 429 gives only a conservative hold/probe; stale or foreign-domain feedback cannot affect another domain. | The real PostgreSQL/pg-boss fixture records an untrusted route 429, observes `temporarily_pressure_blocked` through the public read, rejects a stale recovery, verifies foreign-domain feedback leaves the fixture domain unchanged, then verifies matched recovery. The trusted qualified domain observation provides the separate immediate clamp proof. | `PROVEN` |
| `RC-BSSV2-00604-08` | A separately activated lower BSS-005 revision converges once; stale/high runtime facts cannot publish/raise policy; compatible old work resumes fairly while structurally unfit immutable work receives a versioned replan outcome without truncation or send. | `plan-v2` activation consumes its real wakeup and writes the existing `capacity_revision_request` intent once. The public `ProviderWorkAdmission/v1` outcome is `consumer_replan_required` with source/required profile and activation revisions; fake sends remain zero. `plan-v3` makes only a new compatible public admission sendable. No code path invokes BSS-005 publication from feedback. | `PROVEN` |
| `SR-0405-T1`, `SR-0405-C1`, `SR-0405-R1` | Trusted versioned transition is attributable; pressure cannot mint BSS-005 authority or alter corpus; CK can inspect revision, clamp, and deduplicated wakeup evidence. | Authenticated reader/admission remain principal-bound. Migration only reads active policy and existing pressure/intents; it grants no policy publishing path. The focused fixture records revision attribution, min-only clamp, one wakeup, immutable intent, and exact send counts. | `PROVEN` |

## Validation

Executed against the local Compose PostgreSQL service with the real Bridge
pg-boss worker; the outbound transport is the ticket-authorized fake provider
component.

```text
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migrate  PASS (applied 0075_bssv20060405_constraint_convergence_structural_replan_projection)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check  PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/constraint-convergence-structural-replan.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/interactive-provider-work-admission.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts  PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
corepack pnpm --filter @atlas/db typecheck  PASS
git diff --check  PASS
```

Internal readiness: READY_FOR_CK

This is implementation readiness, not a self-issued CK `PASS`. Control returns
to independent CK for `BSS-V2-006-04-05`.
