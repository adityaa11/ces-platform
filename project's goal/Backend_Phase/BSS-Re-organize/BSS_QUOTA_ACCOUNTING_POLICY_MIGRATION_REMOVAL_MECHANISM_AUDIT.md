# BSS Accounting Policy Migration Removal Mechanism Audit

**Audit date:** 29 October 2026 (Asia/Bangkok)  
**Mode:** read-only audit and implementation-planning only. No migration, source, test, database, or seed was changed.  
**Placement note:** the requested destination is `BSS-Re-organize`; this report is placed there although the pasted brief's example path omitted that directory.

## 1. Executive Answer

### Recommended mechanism: **Option C — forward deprecation, then physical removal**

Use **two bounded successor migrations**, released through **three independently controlled checkpoints**. The migration runner executes every pending *registered* name in order ([`migrate.mjs:114-130`](../../../packages/atlas-db/scripts/migrate.mjs#L114)); therefore `0113` must not be registered in the runner before R3.

1. **R1 — deprecation only:** preserve every historical migration and the `0076` seed; register and execute **`0112` only**. It makes both columns nullable and removes the final publisher's accounting-ID equality predicate. `0113` is neither added to `migrate.mjs` nor present in the release artifact.
2. **R2 — application cutover only:** deploy code that removes the two TypeScript fields, parser/set validation, test and script inserts. During R2 old code can still write legacy values, while new code can omit them. Do not register or execute `0113`.
3. **R3 — physical removal only:** after R2 proves that every writer has stopped referencing the columns and all release gates pass, register and execute `0113`. It drops both columns and leaves no permanent compatibility field.

This is safer than an immediate physical drop because the existing TypeScript/SQL fixtures explicitly write the columns and current tables require them. It is materially simpler than preserving the obsolete columns indefinitely. It does **not** introduce a registry, resolver, dummy seed, or new accounting policy.

**Final recommendation: `GO — REMOVAL MECHANISM READY FOR IMPLEMENTATION REVIEW`.** The release plan has three separately authorized checkpoints; R3 is a hard NO-GO until its complete evidence set is recorded.

## 2. Migration Origin and Dependency Map

| Object / dependency | Introduced or changed | Final effective state | Removal implication | Status |
|---|---|---|---|---|
| `bridge.provider_capacity_profile.quota_accounting_policy_id` | `0023` introduces a non-null, non-blank text column ([`0023...sql:2-18`](../../../packages/atlas-db/migrations/0023_bssv200501_provider_capacity_catalogue.sql#L2)). | No later migration changes its constraint or references it except the publisher equality checks. | First successor drops `NOT NULL`; second successor drops column. | PROVEN |
| `bridge.workload_envelope_profile.quota_accounting_policy_id` | `0028` introduces equivalent non-null/non-blank text ([`0028...sql:18-30`](../../../packages/atlas-db/migrations/0028_bssv200502_process_workload_catalogue.sql#L18)). | Same. | Same two-stage treatment. | PROVEN |
| Anoman value | `0076` writes `anoman-quota-tokens-v1` as one capacity-profile value ([`0076...sql:19-49`](../../../packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql#L19)). | It is not consumed in a seed-time expression. | Leave historical seed unchanged; later schema migrations first tolerate, then remove its field. | PROVEN |
| Historical publishers | `0067` and `0078` compare workload/capacity strings ([`0067...sql:101-125`](../../../packages/atlas-db/migrations/0067_bssv20050503_authorized_desired_plan_convergence.sql#L101), [`0078...sql:148-160`](../../../packages/atlas-db/migrations/0078_bssv20060502_effective_plan_publication_convergence.sql#L148)). | `0091` drops the public historical publisher functions ([`0091...sql:239-242`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L239)). | Do not modify dead historical definitions. | PROVEN |
| Shared-domain publisher | `0091` creates the active public function and its only active accounting-ID comparison ([`0091...sql:66-81`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L66), [`0091...sql:174-190`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L174)). | `0093` and `0094` patch candidate-table aliases in its installed definition ([`0093...sql:4-17`](../../../packages/atlas-db/migrations/0093_bssv20140202_candidate_fingerprint_resolution.sql#L4), [`0094...sql:4-17`](../../../packages/atlas-db/migrations/0094_bssv20140202_candidate_revision_resolution.sql#L4)). No later redefinition was found. | Redefine the current, patched function with exactly one predicate removed; retain signature and every other guard. | PROVEN |
| Candidate fingerprint / revision | `0091` fingerprint contains domain, capacity profile version, planner, time, profile, inputs, authority, and allocation ([`0091...sql:193-203`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L193)). | No accounting ID is a direct fingerprint member. | Removing the comparison does not retroactively alter stored fingerprints; new candidates retain the same input shape/fencing. | PROVEN |
| Runtime admission and usage | Effective enforcement, vectors, windows and ledger are used instead ([`0083...sql:5-58`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L5), [`0101...sql:120-153`](../../../packages/atlas-db/migrations/0101_bssv20140403_background_idle_borrowing.sql#L120)). | No read of either column. | No function signature or runtime-accounting change. | PROVEN |
| Snapshot contracts | v1/v2 snapshots do not emit the ID ([`0082...sql:100-108`](../../../packages/atlas-db/migrations/0082_bssv20060503_authenticated_effective_capacity_snapshot.sql#L100), [`0107...sql:99-107`](../../../packages/atlas-db/migrations/0107_bssv201406_candidate_allocation_fingerprint_fencing.sql#L99)). | `CapacityPlanningSnapshot/v2` is already independent. | Preserve public snapshot contract exactly. | PROVEN |
| Migration runner | It tracks applied **names** and executes only missing names ([`migrate.mjs:83-92,114-130`](../../../packages/atlas-db/scripts/migrate.mjs#L83)). | No migration-content checksum is inspected. | Add successors after `0111`; never rewrite applied history. | PROVEN |

The final migration list currently ends at `0111` ([`migrate.mjs:77-82`](../../../packages/atlas-db/scripts/migrate.mjs#L77)). R1 appends only `0112`; `0113` remains unregistered until an explicit R3 GO decision after R2 evidence.

## 3. Anoman Seed Investigation

`0076` creates exactly one provider capacity profile with the canonical identity:

- `quota_domain_id = anoman-shared-prod`
- `profile_version = 2026-10-18.1`
- `provider_account_alias = anoman-atlas-free-account`
- route `anoman-semantic` / provider `anoman`
- known RPM 20, TPM 40,000, concurrency 25; unknown RPD
- provenanced fixed-window/unknown window definitions
- the obsolete text value `anoman-quota-tokens-v1`.

All are visible in [`0076...sql:19-49`](../../../packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql#L19).

**PROVEN:** the policy value is simply one `VALUES` item; it is neither used to calculate limits nor used by any following seed expression. A repository-wide history search found no migration keyed to its literal value other than its insertion and test fixtures.

**PROVEN:** the fresh-install authority test deliberately expects this seed while asserting zero approvals, enforcement policies, route authorities, process/workload profiles, candidates, activations, and reservations ([`bss-fresh-install-contract.integration.test.ts:28-60`](../../../packages/atlas-db/tests/bss-fresh-install-contract.integration.test.ts#L28)). The removal successors must preserve this result.

**Required seed outcome:** do **not** change `0076`; historical replay inserts the value successfully before successor migration `0112`. The final `0113` schema then removes the obsolete column. No qualification, approval, candidate, attestation, activation, or replacement dummy value is created.

## 4. Final Effective Schema Findings

1. **The final publisher is not source-text `0091` alone.** Its installed body equals the `0091` body after the forward alias repairs in `0093` and `0094`. `0095`/`0096` repair `activate_desired_admission_profile`, not this publisher ([`0095...sql:4-14`](../../../packages/atlas-db/migrations/0095_bssv20140202_activation_gate_column_resolution.sql#L4), [`0096...sql:4-20`](../../../packages/atlas-db/migrations/0096_bssv20140202_activation_revision_resolution.sql#L4)).
2. **The function has no accounting ID in its signature, public result, desired-profile input rows, route bindings, allocation rows, or fingerprint.** The only live read is the `IS DISTINCT FROM` clause at `0091:186`.
3. **No view, trigger, FK, generated column, or runtime function dependency was found.** The original constraints are inline `NOT NULL CHECK (length(trim(...)) > 0)` columns, and the tables' immutability triggers only reject `UPDATE`/`DELETE` ([`0023...sql:20-28`](../../../packages/atlas-db/migrations/0023_bssv200501_provider_capacity_catalogue.sql#L20), [`0028...sql:32-43`](../../../packages/atlas-db/migrations/0028_bssv200502_process_workload_catalogue.sql#L32)).
4. **NOT VERIFIED:** live production/development catalog state was not queried, by instruction. The implementation must run the catalog preflight in Section 12 before DDL, because an out-of-repository extension could add a dependency.

## 5. Historical vs Fresh-Database Compatibility

```text
Empty database
  -> 0023/0028 create historical required columns
  -> 0076 inserts intact Anoman seed with its historic value
  -> 0091 + 0093/0094 establish the final pre-removal publisher
  -> 0112 deprecates columns and replaces publisher without equality check
  -> new code writes no ID
  -> 0113 physically removes both columns
  -> effective final schema has no Accounting Policy dependency
```

**Fresh install:** all historical SQL remains byte-for-byte intact and therefore keeps Scope 01B replay semantics. The successor migrations converge the end state to the target schema.

**Existing upgrade:** an already-migrated database runs only the new migration names because the runner checks names, rather than re-running/validating changed historical content ([`migrate.mjs:114-130`](../../../packages/atlas-db/scripts/migrate.mjs#L114)). It reaches the same effective schema without changing old migration artifacts.

**Historical operational truth:** provider limits/windows, desired-profile version/activation identity, route authority, reservations, feedback, usage ledger and candidate fingerprints do not contain or derive from the ID. Dropping the obsolete metadata does not mutate them. The migration history itself preserves the fact that historical schema/seed included the text.

## 6. Removal Options A/B/C Comparison

| Option | Result | Assessment |
|---|---|---|
| **A — Rewrite `0023`, `0028`, `0076`** | Fresh databases receive a different historical chain; already-migrated databases do not re-run changed names. | **Reject.** This creates fresh-vs-upgrade divergence and violates Scope 01B reproducibility. The runner has no content-hash protection, which makes rewriting especially unsafe rather than safe. |
| **B — one forward migration immediately drops columns** | Final schema becomes clean in one migration, but every old caller/fixture inserting the old columns fails immediately. | **Reject for ordinary rolling deployment.** Acceptable only with proven complete writer shutdown and atomic code/database replacement; that is unnecessarily brittle here. |
| **C — forward nullable deprecation, then removal** | New code can omit fields after phase 1; old writers remain temporarily compatible. A later removal leaves no permanent legacy schema. | **Select.** Two minimal phases isolate code/schema ordering without fabricated values or permanent dual contract. |

## 7. Recommended Migration Mechanism

### Successor 1 — `0112_bssv2_quota_accounting_policy_deprecation.sql` (proposed name; **R1 only**)

It must perform these operations in one transaction, in this order:

```sql
-- 1. New writers may omit obsolete metadata; historical values remain untouched.
ALTER TABLE bridge.provider_capacity_profile
  ALTER COLUMN quota_accounting_policy_id DROP NOT NULL;
ALTER TABLE bridge.workload_envelope_profile
  ALTER COLUMN quota_accounting_policy_id DROP NOT NULL;

-- 2. CREATE OR REPLACE the current 0091+0093+0094 function body.
--    Preserve exact signature, SECURITY DEFINER, search_path, owner, grants,
--    candidate-alias fixes, and all validation. Delete ONLY this condition:
--      OR v_workload.quota_accounting_policy_id
--           IS DISTINCT FROM v_capacity.quota_accounting_policy_id

-- 3. Record the successor migration name using the repository convention.
INSERT INTO atlas.schema_migrations(name)
  VALUES ('0112_bssv2_quota_accounting_policy_deprecation') ON CONFLICT DO NOTHING;
```

The inline `CHECK (length(trim(column)) > 0)` need not be removed in phase 1: PostgreSQL CHECK accepts `NULL`, while non-null non-empty legacy values still satisfy it. The successor publisher must be written as an explicit canonical `CREATE OR REPLACE FUNCTION`, **not** another text replacement of `pg_get_functiondef`; `0093`/`0094` show that string patching is fragile. Its body must carry their candidate-table aliases forward.

**R1 registration rule:** append `0112` to `migrate.mjs` after `0111`, and do **not** add `0113` to the migration array, package/release artifact, or any alternate migration executor. Because every pending listed name is executed in one runner invocation, merely listing `0113` would invalidate the intended application-cutover checkpoint.

No function signature changes. `CREATE OR REPLACE` with the same signature preserves callers; the implementation must nevertheless explicitly retain `SECURITY DEFINER SET search_path = pg_catalog, bridge`, owner `atlas`, and the existing `agents_bridge` execute grant established at [`0091...sql:274-297`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L274).

### Successor 2 — `0113_bssv2_quota_accounting_policy_removal.sql` (proposed name; **R3 only**)

Do not register, ship to a migration executor, or execute this migration during R1 or R2. Its source may be reviewed as a future ticket artifact, but its name must not be appended to `migrate.mjs` until the R3 GO decision is recorded.

Execute only after the R3 criteria below are met:

```sql
ALTER TABLE bridge.provider_capacity_profile
  DROP COLUMN quota_accounting_policy_id;
ALTER TABLE bridge.workload_envelope_profile
  DROP COLUMN quota_accounting_policy_id;

INSERT INTO atlas.schema_migrations(name)
  VALUES ('0113_bssv2_quota_accounting_policy_removal') ON CONFLICT DO NOTHING;
```

PostgreSQL removes the inline constraints with their columns. The table immutability triggers do not prevent DDL because they are row-level `UPDATE OR DELETE` triggers. Do **not** recreate the data elsewhere unless a legal/audit retention policy outside BSS requires it: the prior audit found no operational interpretation use. If such external retention is required, export an immutable one-time migration audit before the drop; do not retain an application-visible mandatory compatibility column.

## 8. SQL Function Replacement Requirements

The `0112` replacement must preserve the following checks from the existing final publisher:

- complete candidate inputs and advisory lock ([`0091...sql:99-113`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L99));
- exact candidate domain/capacity-profile/planner/time tuple ([`0091...sql:115-120`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L115));
- allocation version/effective-mask shape ([`0091...sql:122-126`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L122));
- qualified route identity, immutable authority, and effective enforcement-mask validation ([`0091...sql:128-172`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L128));
- process/workload existence, activity, exact workload reference, and eligible-route membership ([`0091...sql:174-190`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L174));
- fingerprint, idempotence, revision fence, immutable candidate/allocation/binding inserts ([`0091...sql:193-235`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L193)).

The only removal is the accounting-ID equality operand at line 186. After removal, a process/workload/route can publish based on the remaining real contracts. It does not loosen route qualification, capacity-profile version binding, effective-enforcement approval, allocation validation, fingerprint/revision fencing, or runtime admission authority.

**PROVEN:** no candidate fingerprint directly includes the value. **INFERRED:** new candidates built from otherwise identical input will retain the same effective fingerprint algorithm; historical candidate rows are not recomputed.

## 9. TypeScript Contract Cutover

The code part of phase 2 must remove production contract coupling from:

| Area | Required change | Preserve |
|---|---|---|
| [`capacity-catalogue.ts:18-32,98-124`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L18) | Remove `quotaAccountingPolicyId` from the type, accepted-key list, required-string parse, and return object. | Capacity dimensions, source/provenance, non-secret checks, and window validation. |
| [`process-workload-catalogue.ts:36-46,142-175,222-232`](../../../apps/agents-bridge/src/process-workload-catalogue.ts#L36) | Remove field/type, `quotaAccountingPolicyIds` authority input, membership loop, and the resolver argument. | Process/workload compatibility, active/qualified-route validation, four-dimension envelope parsing. |
| Planner and admission | No production accounting-ID change was found. Remove only test input construction made necessary by parser types. | TPM planning cost, resource envelope, `ProviderWorkAdmission/v1`, effective policy, ledger. |
| SQL integration tests and qualification script | Remove obsolete insert columns/values from all fixtures, including [`qualify-real-data.mts:92-95`](../../../scripts/idser-012-04-07/qualify-real-data.mts#L92). | Each test's actual capacity, authority, window, envelope, admission or snapshot assertion. |
| Unit tests | Replace “explicit quota-accounting authority” tests with direct tests of the actual safety boundary: unsupported weighted/billing fields remain rejected; valid structural/estimator/output contracts create correct independent dimensions. | Existing negative field tests ([`capacity-catalogue.test.ts:36-39`](../../../apps/agents-bridge/tests/capacity-catalogue.test.ts#L36)). |

No application code currently invokes `publish_shared_domain_calculated_desired_admission_profile` outside integration tests in the searched repository; the implementation must re-run that search before landing to detect concurrently added caller code.

## 10. Historical Data Preservation

| Concern | Finding / mechanism |
|---|---|
| Immutable profile rows | Phase 1 does not change any row. Phase 2 removes only redundant metadata from both table schemas; it does not update immutable row values. |
| Candidate fingerprints and activation revisions | Preserved. Neither stores nor calculates from the ID directly. Do not republish or reactivate any plan. |
| Reservations, feedback, and physical windows | Preserved. Their accounting is based on envelopes and policies, not the obsolete column. Do not touch ledger tables or runtime functions. |
| Historical migration evidence | Preserved through immutable historical SQL files and `atlas.schema_migrations` records. Do not rewrite old migrations or the seed. |
| Obsolete metadata retention | No BSS operational need found. Optional external export is a governance decision, not a reason to leave an active dependency. |

## 11. Implementation-ticket Breakdown and Exact Release Sequence

### Ticket R1 — migration-only deprecation checkpoint

**Authorized contents:** create/register/execute `0112` only; update the canonical publisher body as specified above; add R1-specific migration tests. No TypeScript contract removal and no `0113` registration.

**R1 GO evidence (all required):**

- reviewed migration array/release artifact contains `0112` after `0111` and contains **no `0113` name**;
- target-database catalog preflight finds no unreviewed dependent view, trigger, generated expression, function, or external writer contract;
- isolated fresh replay through `0112` passes: the untouched `0076` Anoman seed is exactly one canonical provider profile and creates no approval, enforcement policy, route authority, process/workload, candidate, activation, or reservation;
- isolated upgrade from an `0111` baseline passes: existing rows remain; old-shape inserts with non-empty legacy values remain accepted; new provider/workload inserts that omit the values are accepted; and the final publisher accepts the latter while retaining every non-ID guard;
- regression evidence proves billing/weighted fields remain rejected, unknown RPD stays unknown/not-enforced, and TPM reservation/reconciliation is unchanged.

**R1 NO-GO:** any `0113` registration; a catalog dependency not covered by the ticket; seed/authority-count drift; inability to accept both legacy and ID-free writes; or a regression in publisher guards/accounting invariants.

### Ticket R2 — application-contract cutover checkpoint

**Authorized contents:** remove TypeScript/parser/SQL-fixture/script dependency as listed in Section 9; deploy application writers after R1; update regressions. No physical schema drop and no `0113` registration.

**R2 GO evidence (all required):**

- deployed artifact/source inventory confirms every writer of `provider_capacity_profile` and `workload_envelope_profile`, including scripts/jobs/out-of-repository integrations, uses the ID-free column list;
- code search of the release payload returns no effective identifier reference except immutable historical migrations and audit materials;
- the unit, publisher, admission/reservation/reconciliation, snapshot, and effective-policy suites in Section 12 pass against the R1 database schema;
- monitored deployment evidence confirms no old application revision, job, worker, or migration executor remains capable of writing the obsolete columns; and
- no application introduces a dummy/default policy ID.

**R2 NO-GO:** any remaining writer or unverified external integration; any failed regression; mixed active deployment where the old binary can still write; or any workaround that substitutes a new hardcoded identity.

### Ticket R3 — physical-removal checkpoint

**Authorized contents:** only after an explicit R3 GO, register `0113` in the runner, execute it, and add schema-finalization tests. It does not change historical migrations, seed data, publisher guards, admission code, or public contracts.

**Exact evidence required before R3 GO:**

1. Signed R1 and R2 completion records with all their GO evidence.
2. The exact target release inventory proving **zero deployed writers** reference either obsolete column; include workers, scripts, one-off operational tools, and any external integrations.
3. A fresh target-database catalog preflight showing no unplanned dependency on the two columns and no active DDL/long-running transaction that would make the table-lock operation unsafe.
4. Passing regression evidence from R2 for publisher guards, four-dimension envelope validation, billing/weighted-field rejection, Effective Enforcement Policy, unknown RPD, reservation/usage reconciliation, and `CapacityPlanningSnapshot/v2`.
5. An immutable export/retention decision for the redundant metadata, if governance requires one; otherwise an explicit recorded finding that migration history is the retained evidence.
6. Reviewed R3 release diff proving that `0113` is registered **now**, only after the preceding five conditions, and that the migration does nothing except dropping the two columns and recording its own migration name.

**R3 NO-GO:** any missing evidence above, any writer/dependency still present, any runtime/in-flight-liability regression, or `0113` already registered in R1/R2. On NO-GO, leave the nullable deprecated columns in place; do not partially drop one column.

### Ordered release actions

1. **R1:** run preflight, register `0112` only, execute it, and collect R1 evidence.
2. **R2:** deploy and verify the ID-free application contract while `0113` remains unregistered; collect R2 evidence.
3. **R3:** after explicit review of the six-item evidence set, register `0113` only, execute it, and verify the final column-free schema on both fresh replay and upgrade paths.

This ordering prevents both failure modes: the new application never faces a required obsolete column, and the database never loses the columns while an old writer is still live.

## 12. Regression and Acceptance Matrix

No database test below was executed by this read-only audit. “Required command” names the implementation-validation action, not a claimed PASS.

| Scenario | Required evidence / command | Required outcome |
|---|---|---|
| R1 fresh migration chain | Disposable empty PostgreSQL with only `0112` registered; `pnpm --filter @atlas/db migrate`; then `pnpm --filter @atlas/db test:bss-fresh-install-contract` | PASS; historical seed/zero-authority invariant holds; columns are nullable and no `0113` executes. |
| R1 existing upgrade | Disposable clone at current `0111`; register/apply `0112` only | PASS; old and ID-free inserts both work; no history rewrite. |
| R2 deployment regression | Deploy ID-free app to R1 schema; execute application, publisher, admission, snapshot suites | PASS; every writer is ID-free while nullable columns remain. |
| R3 fresh final migration chain | Disposable empty PostgreSQL with `0113` registered only after R2 evidence; replay complete chain | PASS; final tables have no obsolete columns. |
| R3 existing upgrade | Disposable R2-complete clone; then register/apply `0113` | PASS; no history rewrite; final catalog matches fresh path. |
| Catalog preflight | Query `pg_depend`, `pg_views`, `pg_proc`, `pg_trigger`, and `information_schema.columns` for each table/column | No unplanned dependency; otherwise stop for bounded amendment. |
| Canonical Anoman seed | Existing fresh-install test plus `SELECT count(*)`/identity query matching [`bss-fresh-install-contract...:28-37`](../../../packages/atlas-db/tests/bss-fresh-install-contract.integration.test.ts#L28) | Exactly one canonical profile; zero approvals/policies/routes/processes/candidates/activations/reservations. |
| New capacity profile without ID | Add/update provider catalogue integration test; insert after `0112` and after `0113` without column/value | Accepted. |
| New workload profile without ID | Add/update process-workload catalogue integration test | Accepted. |
| Publisher | Update [`weighted-capacity-publication.integration.test.ts:32-67`](../../../packages/atlas-db/tests/weighted-capacity-publication.integration.test.ts#L32) with no obsolete fields | Publishes with all remaining guards; mismatch-ID-only case is removed. |
| TypeScript parser | `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` and `... process-workload-catalogue.test.ts` | No obsolete field accepted/required; billing-weighted fields still reject. |
| Admission/reservation/reconciliation | `pnpm --filter @atlas/db test:provider-work-reservation-window`; Agent Bridge provider-admission tests; compare deterministic envelope/ledger assertions | Numerically unchanged held/spent/deficit behavior. |
| Effective policy / unknown RPD | `pnpm --filter @atlas/db test:capacity-planning-snapshot` plus policy-aware admission tests | Unknown RPD remains not-enforced; Effective Enforcement Policy unchanged. |
| Snapshot compatibility | Capacity snapshot integration tests and API-contract assertions | `CapacityPlanningSnapshot/v2` unchanged and non-permitting. |
| Repeated deployment | Separately run R1 migration twice, then R3 migration twice, and `pnpm --filter @atlas/db migration:check` at each checkpoint | Each registered migration applies once; no checkpoint accidentally runs the unregistered successor. |
| Final proof of absence | `rg -n "quota_accounting_policy_id|quotaAccountingPolicy(Id|Ids)|anoman-quota-tokens-v1" apps packages scripts` with an allowlist limited to immutable historical migrations/audits | No effective code, schema, writer, or test dependency remains. |

## 13. Scope 01B / Scope 02B Decision

### Scope 01B

**PROVEN:** Scope 01B completed fresh-database convergence; its report records the retained `0076` seed and explicitly says it is not qualification evidence ([`BSS_SCOPE_01B_EXECUTION_ACCEPTANCE_REPORT.md:51-95`](BSS_SCOPE_01B_EXECUTION_ACCEPTANCE_REPORT.md#L51)).

**Decision:** this is a **new bounded successor scope**, not an amendment/reopening of completed Scope 01B. Its mechanism deliberately preserves the replay chain that 01B accepted and adds forward convergence after it.

### Scope 02B / `ProviderProfileService.publishVersion`

The new Provider Profile backend may be designed against the target no-accounting-ID contract, but it **must not be integrated or used to publish profiles until phase 1 (`0112`) is applied**. Before that, PostgreSQL still requires the obsolete column; supplying `anoman-quota-tokens-v1` or any substitute would violate the no-workaround requirement.

Thus: **Scope 02B implementation work can proceed only in a contract-isolated form; its publication integration/GO is blocked on the phase-1 deprecation migration.** After `0112`, it can publish without the dependency; after `0113`, the database enforces that the obsolete field cannot return.

## 14. Remaining Blockers

| Item | Status | Resolution needed |
|---|---|---|
| Live PostgreSQL dependency catalog | NOT VERIFIED | Run preflight against the exact target database before DDL. |
| Deployment inventory | NOT VERIFIED | Confirm every writer and migration executor, including out-of-repo services, before phase 2. |
| Migration names / frozen implementation ticket | BLOCKED for implementation, not for design | Allocate exact successor IDs and a bounded ticket; do not alter historical migrations. |
| External retention requirement for obsolete metadata | NOT VERIFIED | Decide whether a one-time export is required; no runtime compatibility field is justified by current evidence. |

## 15. Final GO / NO-GO Recommendation

### **GO — REMOVAL MECHANISM READY FOR IMPLEMENTATION REVIEW**

Implement Option C as **R1, R2, and R3 independently controlled releases**. Register and execute `0112` only in R1; deploy/prove the ID-free writer cutover in R2; and register/execute `0113` only in R3 after the explicit six-item R3 evidence set is complete. Preserve all historical migrations—including `0076`—and every proven operational safety mechanism.

Do not register `0113` during R1 or R2. Do not start the physical-drop phase until the catalog and deployment preflights pass. Do not reintroduce a hardcoded ID, compatibility resolver, policy registry, or any automatic authority creation.

## 16. BSS-QAP-001 blocker-resolution amendment (2026-10-29)

The target-database preflight subsequently found the still-supported Bridge
publisher `bridge.publish_converged_desired_admission_profile(...)`, introduced
by `0067`, which this audit had incorrectly treated as superseded. The bounded
resolution is recorded in
[BSS_QAP_001_PUBLISHER_BLOCKER_RESOLUTION_ADDENDUM.md](BSS_QAP_001_PUBLISHER_BLOCKER_RESOLUTION_ADDENDUM.md).

That addendum corrects R1's publisher inventory without changing historical
migrations: `0112` must explicitly redefine both supported publisher bodies,
removing only the obsolete accounting-policy equality operand from each while
retaining their distinct existing authority models. It also expands the R1
catalog proof to inspect procedural bodies rather than relying on `pg_depend`.
`0113` remains R3-only.
