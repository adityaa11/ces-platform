# CFC checkpoint — BSS-V2-006-04-05

- **Ticket:** `BSS-V2-006-04-05` — Constraint convergence and structural-replan projection
- **Batch:** `BSS-V2-BATCH-06-04-05`
- **Remediation base:** `d5d46275f1f3b7b165301969bbde63b31d5d9ef1`
- **Original frozen CK / closure-oracle source:** `project's goal/feedback/BSS-V2-BATCH-06-04-05-7d169e3-review.md`
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`
- **Status:** `awaiting_review`
- **Remediation commit:** this bounded CFC checkpoint commit

## Clause-keyed closure evidence

| Frozen clause | Status | Exact closure evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/constraint-convergence-structural-replan.integration.test.ts:113-138` drives qualified `rpm`, `tpm`, and `rpd` observations through the existing 03A feedback function and authenticated public runtime route. Each dimension asserts its 2-unit conservative clamp, a later 100-unit observation cannot raise it, and matching recovery restores only the 10-unit active-plan ceiling. The fixture uses only the established runtime projection and does not create a policy publication path. The frozen multidimensional public-boundary oracle passes. |
| `CK-001.b` | `PROVEN` | The same real PostgreSQL/pg-boss fixture asserts an otherwise eligible public read/admission control is unchanged by foreign-domain and stale qualified feedback at `:89-101`. Under an RPM numeric clamp it stops and recreates the ordinary production worker, then re-reads the public boundary and verifies activation revision 3, the 2-unit conservative clamp, one `active-plan:3` wakeup, unchanged historical immutable-work identity/liability, and zero historical sends at `:112-127`. The frozen restart/isolation/no-duplicate-send oracle passes. |

## Executed validation and outcomes

```text
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/constraint-convergence-structural-replan.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts  PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
corepack pnpm --filter @atlas/db typecheck  PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check  PASS
git diff --check  PASS
```

The direct-regression boundary is limited to the existing `RuntimeCapacityConstraint/v1` projection, 03A pressure input/recovery, plan activation/wakeup, and immutable-work admission. This remediation adds no provider, deployment, BSS-005 publication, consumer-replan execution, or predecessor change.

Internal readiness: READY_FOR_CK

**Handoff:** Stop for independent CK verification of the original frozen `CK-001.a` and `CK-001.b` oracles and this bounded remediation commit. CFC does not issue CK `PASS` and this first-pass authorization permits no further remediation cycle.
