# CFC checkpoint — BSS-V2-006-04-05 (cycle 2)

- **Ticket:** `BSS-V2-006-04-05` — Constraint convergence and structural-replan projection
- **Batch:** `BSS-V2-BATCH-06-04-05`
- **Remediation base:** `8f518542a34aad20d960590218baca16682d70af`
- **Original frozen CK / closure-oracle source:** `project's goal/feedback/BSS-V2-BATCH-06-04-05-7d169e3-review.md`
- **Latest CK residual / unchanged closure-oracle source:** `project's goal/feedback/BSS-V2-BATCH-06-04-05-8f51854-verification.md`
- **Prior CFC checkpoint:** `project's goal/feedback/BSS-V2-BATCH-06-04-05-cfc-checkpoint.md`
- **HMN authorization consumed:** `HMN-BSS-V2-006-04-05-001` (`project's goal/feedback/BSS-V2-006-04-05-hmn-001.md`)
- **Authorized frozen clause:** `CK-001.b` only
- **Protected frozen clause:** `CK-001.a` remains `RESOLVED / PROTECTED` and was not reopened.
- **Status:** `awaiting_review`
- **Remediation commit:** this bounded CFC checkpoint commit (`test(admission): prove historical restart reservation`)

## Clause-keyed closure evidence

| Frozen clause | Status | Exact closure evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/tests/constraint-convergence-structural-replan.integration.test.ts:109-175` establishes historical work through the authenticated `ProviderWorkAdmission/v1` path, waits for the real worker to claim it, and persists a live reservation with source `plan-v1` / revision `1`. The fixture uses the durable `active-plan:3` pg-boss completion plus claimed-dispatch barrier at `:19-27` and `:144-157` before snapshotting its identity/liability. Under a qualified RPM clamp it stops and recreates the ordinary production worker, then re-reads the authenticated runtime boundary and proves revision `3`, the same conservative numeric clamp, one `active-plan:3` wakeup, the identical reservation ID/source plan/revision/live liability, and exactly one historical send at `:158-175`. The unchanged foreign-domain and stale-control baseline remains at `:127-138`. The frozen restart/isolation/no-duplicate-send oracle passes. |

## Executed validation and outcomes

```text
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/constraint-convergence-structural-replan.integration.test.ts  PASS (1 test; three consecutive isolated runs)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check  PASS
corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
corepack pnpm --filter @atlas/db typecheck  PASS
git diff --check  PASS
```

The direct-regression check is limited to the existing public runtime constraint projection, authenticated admission boundary, durable wakeup convergence, pressure clamp/recovery, and immutable historical-work handling. This remediation changes neither production behavior nor schema, migration, policy authority, public contract, provider/deployment path, or consumer-replan behavior.

Internal readiness: READY_FOR_CK

**Handoff:** Stop for independent CK verification of the unchanged frozen `CK-001.b` oracle, preserving `CK-001.a` as resolved/protected. CFC does not issue CK `PASS` or authorize another cycle.
