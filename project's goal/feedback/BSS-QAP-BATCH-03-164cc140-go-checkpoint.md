# BSS-QAP-BATCH-03 GO checkpoint — BSS-QAP-003 R3

- **Ticket:** `BSS-QAP-003` — R3 physical quota-accounting-policy column removal
- **Batch:** `BSS-QAP-BATCH-03`
- **Ticket state:** `awaiting_review`
- **Implementation commit:** `164cc1400440eee588e4aaf9c606168e283a253f`
- **Target boundary:** this workspace's local Docker development environment and local `atlas_dev` PostgreSQL instance only
- **Scope:** register and execute only `0113_bssv2_quota_accounting_policy_removal`; preserve all application, publisher, runtime, and public-contract behavior

## R3 GO precondition record

1. **Accepted predecessors:** BSS-QAP-001 has signed `PASS` at
   `project's goal/feedback/BSS-QAP-BATCH-01-9a84ddae-review.md`; BSS-QAP-002
   has signed local-boundary `PASS` at
   `project's goal/feedback/BSS-QAP-BATCH-02-9bce3243-verification.md`.
2. **Local writer retirement boundary:** the refreshed Compose inventory named
   seven services; the workspace-label inventory found only one active and two
   stopped PostgreSQL containers, with no application/worker/migration-executor
   container. The five configured writer-capable image IDs are the R2-verified
   images: migrate `5f31e6214770`, bootstrap `aada2be81bc0`, Bridge
   `4bc07955088b`, Atlas `d802d8d6c72c`, and worker `ab38719ef82c`.
   The committed R2 verification classifies their payloads ID-free under the
   approved same-image immutable/R1 migration-copy rule. The live `atlas_dev`
   connection inventory contained only the evidence `psql` session; 180 enabled
   scheduled tasks produced zero PostgreSQL-connection-path matches.
3. **Target preflight:** immediately before target DDL, both columns were
   nullable; `pg_depend` found only their inline nonblank constraints; `pg_views`
   and installed procedural bodies returned no reference; and active
   transaction/lock queries returned zero rows.
4. **R2 operational evidence:** the focused BSS parser, publisher,
   reservation-window, ledger usage, policy-aware admission, snapshot, and
   provider-admission commands below all passed before and after `0113`.
5. **Retention decision:**
   `project's goal/feedback/BSS-QAP-003-r3-retention-decision-001.md` records
   that no export/duplicate retention is required and immutable migration
   history is the retained historical evidence.
6. **Reviewed release diff:** this commit adds only `0113`, its canonical
   runner registration after `0112`, a final-schema test, and R3 evidence. The
   migration wraps the two `DROP COLUMN` operations and its migration-record
   insert in one transaction. The final effective-reference search found only
   immutable historical/R1 migrations, `0113`, and the final-schema assertion;
   no application, script, fixture, or writer contract remains.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-QAP-003-01` | All six R3 GO preconditions must be present, current, and attributable to the target release. | Precondition record above; predecessor PASS records; retention decision; final catalog/lock preflight; reviewed `164cc140` diff. | `PROVEN` |
| `RC-QAP-003-02` | `0113` is the sole new registered migration; it atomically drops both columns and records its name. | `0113_bssv2_quota_accounting_policy_removal.sql`; canonical runner entry after `0112`; target `pnpm --filter @atlas/db migrate` applied only `0113`, second run reported up to date, and `migration:check` passed. | `PROVEN` |
| `RC-QAP-003-03` | Empty complete-chain replay reaches the column-free final schema while preserving historical replay. | Disposable `qap003_fresh_20261029`: full runner applied through `0113`; second runner execution was up to date; `migration:check`, `test:bss-fresh-install-contract`, and `test:qap-003-r3` passed; both catalog-column queries returned zero rows. Database was then removed. | `PROVEN` |
| `RC-QAP-003-04` | R2-complete upgrade converges without history rewrite and repeats idempotently. | Disposable `qap003_upgrade_20261029` was cloned from 0113-free `atlas_dev`; runner applied only `0113`, second execution was up to date, `migration:check` and `test:qap-003-r3` passed, and both catalog-column queries returned zero rows. Database was then removed. | `PROVEN` |
| `RC-QAP-003-05` | Preserve the proven R2 publisher/parser/accounting/snapshot boundary; no writer or compatibility field returns. | Post-DDL BSS regression matrix below passed serially against `atlas_dev`; final allowlisted source search has no effective writer. | `PROVEN` |

## Validation record

Post-DDL against local `atlas_dev`:

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts                 PASS (3)
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts         PASS (5)
pnpm --filter @atlas/db test:qap-001-r1                                                        PASS (1)
pnpm --filter @atlas/db test:authorized-desired-plan-convergence                              PASS (1)
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts     PASS (1)
pnpm --filter @atlas/db test:provider-work-reservation-window                                 PASS (1)
pnpm --filter @atlas/db exec jiti tests/process-capacity-window-usage.integration.test.ts     PASS (1)
pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts PASS (1)
pnpm --filter @atlas/db test:capacity-planning-snapshot                                        PASS (1)
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts PASS (2)
pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts PASS (1)
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts PASS (2)
pnpm --filter @atlas/db migration:check                                                       PASS
pnpm --filter @atlas/db test:qap-003-r3                                                        PASS (1)
```

The IDSER semantic-reconciliation test hang is recorded separately at
`project's goal/feedback/BSS-QAP-003-r3-idser-reconciliation-diagnostic-001.md`.
It is neither a PASS nor an R3 blocker: the frozen R3 ticket and incorporated
audit name BSS provider reservation-window and deterministic ledger evidence,
not that IDSER command.

## Final target catalog

After the target migration, `information_schema.columns` returned zero rows
for `quota_accounting_policy_id` on both
`bridge.provider_capacity_profile` and `bridge.workload_envelope_profile`.
`atlas.schema_migrations` contains exactly one
`0113_bssv2_quota_accounting_policy_removal` record.

Internal readiness: `READY_FOR_CK`

This checkpoint is not a CK result and does not self-issue `PASS`.
