# CFC checkpoint — BSS-V2-014-05

- **Ticket:** [BSS-V2-014-05 — IDSER calculated-capacity consumer handoff](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md)
- **Remediated CK review:** [BSS-V2-014-05 first review](BSS-V2-014-05-6c93922c-review.md)
- **Reviewed implementation commit:** `6c93922ccbce64a111723e493f211bec287beb57`
- **Remediation base:** `620b7863` (`docs(bss-v2): record idser v2 consumer go checkpoint`)
- **Authority:** initial bounded CFC after the first `CHANGES_REQUIRED` CK review. The authorized unresolved clauses are `CK-001.a` and `CK-001.b`; their active ticket authority is [replacement contract freeze 001](BSS-V2-014-05-replacement-contract-freeze-001.md), `RRC-01405-05.a` and `.b`.
- **Scope:** only the production IDSER v2 composition, the actual-reader negative evidence, their focused tests, and this checkpoint. No activation, admission, provider, scheduler, GHR, SEM, or database schema behavior changed.

## Authorized closure progress

| CK clause | Frozen oracle and evidence | Remediation evidence | Required command and outcome | Status |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `RRC-01405-05.a`: exactly one non-activating production IDSER composition binds one authenticated v2 reader/credential; no production v1, adapter, dual-read, direct-SQL, or alternate authority path. | `apps/agents-bridge/src/idser-capacity-planning-snapshot-v2-composition.ts` selects exactly one non-prospective v2 binding, returns no substitute consumer when absent, and rejects ambiguous v2 bindings. `apps/agents-bridge/src/main.ts` performs the sole production entrypoint composition. `apps/agents-bridge/tests/idser-capacity-planning-snapshot-v2.test.ts` inventories the production seam and proves single/none/ambiguous binding outcomes. | `pnpm --filter @atlas/agents-bridge exec jiti tests/idser-capacity-planning-snapshot-v2.test.ts` — **PASS** (7/7); `pnpm --filter @atlas/agents-bridge exec tsc -p tsconfig.json --noEmit` — **PASS**. | `PROVEN` — frozen inventory oracle passed. |
| `CK-001.b` | `RRC-01405-05.b`: the composed consumer must receive the existing authenticated reader and typed-stop/replan for actual-reader foreign, stale/unavailable, non-qualified, and mismatched snapshots with no numeric fallback. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts` routes foreign principal and process/class/route mismatches, model mismatch, stale authority, missing allocation, missing structural data, workload mismatch, approval failures, and revocation through `createIdserCapacityPlanningSnapshotV2Consumer`. Each asserts a typed `IdserCapacityPlanningSnapshotV2Error` disposition and unchanged effect counters, while retaining the composed positive read. | `pnpm --filter @atlas/agents-bridge exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\calculated-capacity-snapshot-v2.integration.test.ts` — **PASS** (2/2). | `PROVEN` — frozen actual-reader oracle passed. |

## Direct-regression validation

```text
pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env scripts\migrate.mjs --check
# PASS — Atlas database migration check passed

pnpm --filter @atlas/agents-bridge exec jiti tests\idser-structural-fit-corpus-partition.test.ts
# PASS — 7/7

pnpm --filter @atlas/agents-bridge exec jiti tests\idser-multimodal-structural-fit-partition.test.ts
# PASS — 4/4

pnpm --filter @atlas/agents-bridge exec jiti tests\ghr-03a-semantic-receiver.test.ts
# PASS — 4/4

pnpm --filter @atlas/contracts exec jiti tests\ghr-generic-handoff-envelope.test.ts
# PASS — 5/5

pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\ghr-03b-boundary.test.mjs
# PASS — 1/1

git diff --check
# PASS
```

## Shadow-CK evidence check

`CK-001.a` and `CK-001.b` are both `PROVEN` against their unchanged frozen
oracles. The remediation neither reopens the already proven `RC-01405-01` to
`-04` and `RRC-01405-05.c`/`.e` rows nor changes the parent-owned
`RRC-01405-05.d` activation gate. Direct regressions are passing.

Internal readiness: `READY_FOR_CK`

## Handoff

State: `awaiting_review`.

This is the one bounded remediation pass for `CK-001.a` and `CK-001.b`. It
does not issue `PASS`; CK must verify the frozen clauses, this remediation
diff, and direct regressions only.
