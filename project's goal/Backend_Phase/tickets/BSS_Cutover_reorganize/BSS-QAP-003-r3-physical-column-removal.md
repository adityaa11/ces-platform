# BSS-QAP-003: R3 physical quota-accounting-policy column removal

- **State:** `approved`
- **Review batch:** `BSS-QAP-BATCH-03`
- **Depends on:** BSS-QAP-001 and BSS-QAP-002 `PASS`; explicit R3 GO after all six preconditions below are recorded
- **Source authority:** [Removal Mechanism Audit](../../BSS-Re-organize/BSS_QUOTA_ACCOUNTING_POLICY_MIGRATION_REMOVAL_MECHANISM_AUDIT.md) §§1, 7, 10–12, 15
- **Active bounded amendment:** [Local Docker acceptance-boundary amendment 001](../../../feedback/BSS-QAP-LOCAL-DOCKER-ACCEPTANCE-AMENDMENT-001.md). It replaces only the production-wide portion of Mandatory R3 GO precondition 2 with a local-writer retirement gate; all other R3 preconditions remain in force.

## Outcome

After the complete R3 evidence gate, create/register/execute only `0113_bssv2_quota_accounting_policy_removal`, which drops `quota_accounting_policy_id` from both final tables and records its migration name. Prove fresh and upgrade convergence to the same column-free schema. This ticket finalizes schema removal; it does not alter writers, publisher guards, historical migrations, or operational runtime behavior.

## Mandatory R3 GO preconditions

1. Signed BSS-QAP-001 and BSS-QAP-002 `PASS` records, including their complete GO evidence.
2. Exact target release inventory proving zero deployed writers reference either column, including workers, jobs, scripts, one-off operational tools, external integrations, and migration executors.
3. Fresh target-database preflight proving no unplanned dependency and no active DDL/long-running transaction that makes the table-lock operation unsafe.
4. Passing R2 regression evidence for publisher guards, four-dimension validation, billing/weighted rejection, effective enforcement policy, unknown RPD, reservation/usage reconciliation, and `CapacityPlanningSnapshot/v2`.
5. An immutable retention/export decision if governance requires one; otherwise a recorded finding that immutable migration history is the retained evidence.
6. Reviewed R3 release diff proving `0113` is registered now—after conditions 1–5—and its only behavior is dropping both columns and recording its own name.

Absence of any item is a hard NO-GO. Leave both nullable columns in place; do not partially drop a column and do not create a compatibility mechanism.

## Scope

- Add transactional `0113` with only the two `ALTER TABLE ... DROP COLUMN quota_accounting_policy_id` operations and its `atlas.schema_migrations` insert.
- Register `0113` in the canonical runner only when the preconditions have been recorded; execute against a reviewed target release.
- Add final-schema tests for fresh replay and R2-complete upgrade; verify both table catalogs have no obsolete column and repeat execution applies the migration once.
- Capture target preflight/release/retention evidence and final catalog proof as checkpoint evidence.

## Forbidden work

- Do not revise `0023`, `0028`, `0076`, `0091`, `0093`, `0094`, or `0112`; do not change seed rows, function guards, TypeScript code, scripts, runtime accounting, public snapshot contracts, or candidate/activation history.
- Do not add another schema/data migration, recreate the values elsewhere, leave a compatibility field, or drop one column while retaining the other.
- Do not register `0113` before the six-item gate, during R1/R2, or through an alternate migration executor.

## Review Contract

| Row | Exact bounded behavior | Required proof and binary closure oracle | Direct regression boundary |
| --- | --- | --- | --- |
| RC-QAP-003-01 | R3 starts only with all six source-mandated preconditions recorded. | Inspect durable R1/R2 PASS, inventory, target preflight, regressions, retention decision, and reviewed diff. **PASS iff** each item is present, current, and attributable to the exact target release. | release authorization |
| RC-QAP-003-02 | `0113` is the only newly registered R3 migration and drops exactly both obsolete columns plus its own migration record. | Review migration source/runner diff and execute it once. **PASS iff** no unrelated DDL/data/runtime behavior appears and both drops occur atomically. | migration runner and schema |
| RC-QAP-003-03 | Fresh replay converges from preserved history to a final column-free schema. | Empty disposable PostgreSQL complete-chain replay after authorized 0113 registration. **PASS iff** historical seed/replay succeeds and neither final table contains the obsolete column. | fresh-install migration chain |
| RC-QAP-003-04 | R2-complete upgrade converges to the same final schema without history rewrite. | Upgrade disposable R2-complete clone, then re-run migration/check. **PASS iff** both columns disappear, migration is idempotent, and final catalog matches the fresh path. | upgrade migration chain |
| RC-QAP-003-05 | Finalization creates no direct regression in the proven R2 operational boundary. | Re-run the R2 named publisher/parser/accounting/snapshot regressions and inspect final diff. **PASS iff** all remain green and no writer/compatibility field returns. | publisher, parsers, admission, snapshot |

## Validation and handoff

- Run catalog-preflight queries for dependencies and lock safety immediately before DDL; record transaction/DDL observations, not just a prior repository search.
- On disposable fresh and upgrade paths, run the migration runner twice and `pnpm --filter @atlas/db migration:check`; inspect `information_schema.columns`/catalog output to prove absence in both tables.
- Re-run the R2 regression matrix and the final allowlisted search. Record exact commands/results, migration/release inventories, retention decision, and final catalog comparison in the GO checkpoint.
- R3 is NO-GO for any absent/expired precondition, remaining writer/dependency, unsafe lock condition, accounting/runtime regression, or early `0113` registration. A no-go result leaves the R1 nullable schema intact.
- CK `PASS` closes this ticket set; it does not authorize unrelated policy cleanup or reopening Scope 01B.

## Security Refactor Readiness

**Status:** `applicable`.

- `BOUNDARY-QAP003-01`: R3 consumes only the R1 nullable-schema and R2 zero-writer interfaces; it cannot redefine them.
- `TRUST-QAP003-01`: production DDL and migration registration can make legacy writes fail irreversibly after the lock-taking schema change.
- `ASSET-QAP003-01`: target profile/workload schema, immutable migration history, release inventory, and any approved retention export are the relevant protected assets.
- `SEAM-QAP003-01`: the explicit six-item gate attaches deployment, catalog, and governance proof to the sole physical-removal action.
- `COUPLING-QAP003-01`: do not couple column removal to policy redesign, data rewrite, runtime changes, or unreviewed external-retention storage.
- `SEC-GAP-QAP003-01`: whether an external immutable export is legally required is an authority decision; the ticket may consume its recorded result but cannot invent retention policy.
- `REV-READY-QAP003-01` (ref `RC-QAP-003-01`): verify all R3 authorization inputs are complete for the exact release. Evidence: durable records and reviewed release diff.
- `REV-READY-QAP003-02` (ref `RC-QAP-003-02` through `RC-QAP-003-04`): verify the migration is narrow, atomic, and convergent across fresh/upgrade paths. Evidence: source review, executed logs, and catalog comparison.
- `REV-READY-QAP003-03` (ref `RC-QAP-003-05`): verify physical finalization did not reintroduce a writer or regress the preserved operational boundary. Evidence: affected regression matrix and final effective-reference search.
