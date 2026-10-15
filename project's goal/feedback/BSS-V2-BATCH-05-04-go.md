# GO Checkpoint — BSS-V2-BATCH-05-04

- Ticket: `BSS-V2-005-04`, [versioned DesiredAdmissionProfile publication and cutover](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-04-desired-admission-profile-publication.md)
- Batch: `BSS-V2-BATCH-05-04`
- Review target: the commit containing this GO checkpoint.
- Dependency gates: BSS-V2-005-03 CK `PASS` at `4d8f830`; BSS-003 Bridge operational persistence boundary is retained through `bridge.*` ownership and `agents_bridge`-only access.
- Scope: Bridge operational plan publication/activation/read only. No provider client, admission, dispatch, new broker, Atlas-domain write, or customer-entitlement state was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00504-01` | Immutable profiles bind one capacity version, planner version, and exact process/workload input versions; old and active versions remain queryable. | `packages/atlas-db/migrations/0029_bssv200504_desired_admission_profile_publication.sql` defines immutable profile/input tables and `resolve_active_desired_admission_profile`; integration test publishes and reads `plan-v1` then retains it after `plan-v2`. | PROVEN |
| `RC-BSSV2-00504-02` | Activation is atomic per quota domain and fails closed for missing/invalid referenced inputs; readers cannot resolve partial publication. | Version foreign keys, exact process-to-workload trigger, and `activate_desired_admission_profile` validate the complete profile before appending activation history and changing the active pointer in one transaction. The integration test rejects a missing profile and missing capacity reference while the reader stays on `plan-v1`. | PROVEN |
| `RC-BSSV2-00504-03` | Changed inputs create a distinct immutable plan and monotonic activation revision without rewriting history or in-flight references. | The integration test publishes `plan-v1`/`capacity-v1` and `plan-v2`/`capacity-v2` with distinct effective times; it observes immutable activation history revisions `1` and `2`. | PROVEN |
| `RC-BSSV2-00504-04` | Publication provides a transaction-capable plan-change seam and performs no admission or dispatch. | Append-only `desired_admission_profile_activation` plus active revision is the BSS-V2-006 seam. The integration test compares `pgboss.job` immediately before/after cutover and finds no created job. No queue, provider, or dispatch code is present in the migration. | PROVEN |
| `RC-BSSV2-00504-05` | Bridge operational ownership and roles remain intact; no Atlas trusted/domain/customer-entitlement state is introduced. | All new relations/functions are in `bridge.*`, owned/executable only by `agents_bridge`; public and `atlas_app` access is revoked. The integration test proves `atlas_app` cannot resolve the active plan. | PROVEN |

## Validation evidence

- `pnpm --filter @atlas/db migrate` — PASS; applied `0029_bssv200504_desired_admission_profile_publication` to the local PostgreSQL stack.
- `pnpm --filter @atlas/db test:desired-admission-profile-publication` — PASS: 1 test, 0 failures.
- `pnpm --filter @atlas/db test:provider-capacity-catalogue` — PASS: 1 test, 0 failures.
- `pnpm --filter @atlas/db test:process-workload-catalogue` — PASS: 1 test, 0 failures.
- `pnpm --filter @atlas/db migration:check` — PASS.
- `pnpm --filter @atlas/db typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `git diff --check` — PASS.
- Compose commands/counts: no mutation command; the already-running local PostgreSQL service was used. Provider calls: `0`. Admission/dispatch operations: `0`.

Internal readiness: READY_FOR_CK
