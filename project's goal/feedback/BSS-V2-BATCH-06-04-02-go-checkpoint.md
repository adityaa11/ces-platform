# BSS-V2-BATCH-06-04-02 GO checkpoint

- **Ticket:** `BSS-V2-006-04-02`
- **State:** `awaiting_review`
- **Authority:** frozen ticket `BSS-V2-006-04-02-provider-work-admission-exclusive-send-boundary.md`; approved predecessor `BSS-V2-006-04-01` (`3ae601f`).
- **Scope:** `ProviderWorkAdmission/v1` only: authenticated server-bound background registration/admission, opaque reference/hash persistence, one 03A reservation/pg-boss/claim send lane, and pre-send cancellation. No semantic parsing, provider implementation, retry, result projection, or cutover.

## Review Contract Closure

| Row | Required proof | Evidence | Outcome |
| --- | --- | --- | --- |
| `RC-BSSV2-00604-01` | One reservation and attempt per fake send; no double send on replay/denial. | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` uses external HTTP admission and real PostgreSQL/pg-boss/03A. | `PROVEN` |
| `RC-BSSV2-00604-12a` | Independent background consumer reaches the generic boundary with no direct adapter bypass. | Same fixture uses only authenticated `ProviderWorkAdmission/v1`, a post-claim payload adapter, and one fake transport. | `PROVEN` |
| `RC-BSSV2-00604-14a` | Stale revision, payload-hash conflict, duplicate registration, and pre-send cancellation cannot transport stale/unreserved/double work. | Same fixture labels and asserts every negative; migration `0070` extends cancellation across dispatched-but-unclaimed pg-boss work. | `PROVEN` |

## Validation

All passed against isolated local PostgreSQL/pg-boss:

```text
corepack pnpm --filter @atlas/agents-bridge typecheck
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.test.ts
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check
```

The default production adapter/transport intentionally fails closed until a later ticket qualifies a consumer-owned payload/result adapter. This checkpoint makes no `PASS` claim.

Internal readiness: READY_FOR_CK
