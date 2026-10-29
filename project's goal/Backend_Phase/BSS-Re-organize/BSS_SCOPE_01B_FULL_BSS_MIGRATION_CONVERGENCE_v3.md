# BSS Scope 01B - Full Existing-Migration Convergence Before the Final Development Reset

**Status:** Authorized implementation design for Codex; not yet executed.  
**Permanent context:** `atlas_bss_pipeline_baseline_function_first_v4.md` (use matrices A00-A13 and function-first rules).  
**Evidence:** `BSS_SCOPE_01A_FRESH_DB_CONTRACT_BLOCKER_DIAGNOSTIC_RESULT.md`, `BSS_SQL_SEED_DECOUPLING_AUDIT.md`.  
**Execution target:** Verified Atlas-only PostgreSQL development environment; repository working branch must be confirmed before edits.  
**Decision:** Existing SQL migrations may be amended directly because this project has an explicitly disposable development baseline. There is no requirement to preserve historical Atlas development database state or support an in-place upgrade from the prior baseline. **Do not create corrective successor migrations to repair the existing migration chain in this scope.**

## 1. Precise objective

This scope expands the former narrow `0000`/`0077` bootstrap amendment to the **complete currently implemented BSS migration chain**. Find and repair reproducible defects in the *existing* BSS SQL installation, object ownership, grants, function contracts, integrity boundaries, and migration ordering **before doing the final reset of the user's Atlas development database**.

Success means the real migration runner can build the entire existing Atlas schema on a pristine PostgreSQL cluster, leave only the allowed initial Anoman capacity profile among automatically seeded BSS business data, preserve the database-enforced BSS lifecycle fences, and make the resulting database usable by future production-capable function-first BSS services without manual schema patches.

**Not the objective:** Implement all unbuilt BSS application services, durable provider qualification evidence, Admin routes/UI, Release Attestation Authority, or unblock production activation. Those later features can add new forward migrations after this baseline is frozen. A future forward migration does **not** itself require resetting the database.

## 2. Scope boundary: what is fully audited and what is not

### Included

- The **entire current sequence of BSS-owned SQL migrations**, regardless of their numeric placement; do not inspect only `0000`, `0076`, `0077`, or `0088`. Find the effective definitions after every relevant successor/redefinition through the current final migration.
- BSS cross-dependencies on the generic migration runner, pg-boss initialization, role/schema provisioning, GHR/IDSER/AA migrations, and connection bootstrap, but edit non-BSS code only for a proven installation dependency and document why.
- Current production-facing SQL boundary contracts: provider capacity/profile, process/workload, route authority, policy/approval/derivation, desired plan and candidate publication, candidate/active snapshot, activation fence, fair admission, accounting and borrowing.
- PostgreSQL roles (`atlas`, `atlas_app`, `agents_bridge`), table/function owners, SECURITY DEFINER settings, schema privileges, function/table GRANTs, sequence privileges, and least-privileged real-call tests.
- All migration-time BSS DML and implicit hardcoded seed dependencies. Preserve only `0076` Anoman capacity profile as automatic BSS business configuration.
- Existing BSS integration tests affected by removal of `0077` seeds, plus an actual clean-install regression that calls `pnpm --filter @atlas/db migrate`.
- **Verified existing SQL-contract defects**, including a wrong account-alias/provider-ID predicate if confirmed on the final `publish_qualified_provider_route_authority` definition. Fix that predicate without faking qualification or creating an active route.

### Excluded

- General refactoring or moving TypeScript source files.
- Writing new qualification/policy/candidate/admin stage business services or endpoint handlers.
- Seeding route qualifications, approved policies, process/workload profiles, desired admission plans, release attestations, or active plans.
- Fabricating missing evidence to get a success result.
- Removing the shared-domain v2 release/activation fence or rewriting the current `ProviderWorkAdmission/v1` public contract.
- Changing the `CapacityPlanningSnapshot/v2` `maxEligibleCompleteRequestTokens` formula, `readIsNotAdmissionPermit`, or the IDSER consumption contract.
- Deleting non-Atlas PostgreSQL resources or wiping an unidentified/remote cluster.
- Reworking unrelated subsystems merely because their migrations appear in the shared runner; fix only directly verified installation blockers.

## 3. Exact real entry point and handoff

| Boundary | Contract |
|---|---|
| Actual caller | Atlas deployment/CI/operator invoking the existing migration CLI |
| Entry point | `pnpm --filter @atlas/db migrate` -> `packages/atlas-db/scripts/migrate.mjs` |
| Required inputs | `DATABASE_URL` and currently supported role/password configuration, sufficient PostgreSQL provisioning authority, existing migration list and files |
| Operation | Provision roles/schemas; apply the ordered migration chain, BSS tables/functions/grants; insert only `0076` as BSS bootstrap business data; record migration ledger |
| Durable handoff | Valid PostgreSQL schema + roles/ownership/privileges/functions; 1 Anoman capacity profile; 0 operational approval, route authority, process/workload, candidate, activation, work reservations |
| Current consumers | Bridge snapshot/runtime-capacity readers, Fair Admission services, migration checks; all must fail closed where an active/qualified configuration is absent |
| Future consumers | A01/A03/A04/A05/A06/A07/A08/A09/A10 operator-initiated production functions; only the installation contract is being implemented now |
| Integration state at GO | **Installer-integrated**: real CLI proven from an actually pristine cluster and after a second idempotent run; no UI or other stage integrations implied |

This is an infrastructure-entry scope; **do not invent an artificial business function** to satisfy the permanent baseline's function-first rule. All existing production SQL functions remain proper named entry points and must retain their input/output contracts.

## 4. Required audit-and-repair checklist (complete BSS migration coverage)

Codex MUST produce an inventory before modifications. For every BSS migration list: path/order, objects defined/altered/dropped, role/owner/grants, migration-time DML, replaced SQL function signatures, dependent successor, and any observed failure. Distinguish historical migration definitions from the **effective function** after the entire chain.

### M01. Cluster bootstrap and migration runner
- Verify cluster role `atlas` is absent at the start of a truly pristine PostgreSQL cluster.
- Inspect `0000_bss003_boundaries.sql` and `migrate.mjs` for role and schema provisioning; amend them only to establish a reproducible least-privileged bootstrap.
- Preserve distinct identities: schema `atlas` != role `atlas`; `atlas_app` != `agents_bridge`.
- Role `atlas` ownership is intentionally observed for protected route-authority and candidate-publication objects. Role LOGIN/NOLOGIN is a design decision to validate against connection and migration behavior; do not silently weaken it.
- Verify migration ordering, pg-boss bootstrap, function dependencies, extension assumptions and idempotent rerun.

### M02. Allowed/prohibited seeds
- Preserve `0076`'s single Anoman provider-capacity profile, limits and provenance. Do not add a full fabricated qualified route to it.
- Remove only the two migration-time Anoman policy approval and enforcement-policy INSERTs from `0077`; preserve schema, policy derivation, immutable triggers and grants.
- Scan **all current BSS migrations** for other top-level business authority inserts (distinct from transactional function bodies, grants, migration history and isolated test fixtures).
- Require 0 BSS authority rows other than the single Anoman profile after installation.

### M03. Protected authority owner and privileges
- Compare effective object ownership with the user's observed reference: route-authority table, calculated allocation, candidate and route-binding tables owned by `atlas`.
- `bridge.publish_qualified_provider_route_authority(...)` and `bridge.publish_shared_domain_calculated_desired_admission_profile(...)`: owner `atlas`, SECURITY DEFINER = true.
- `bridge.activate_desired_admission_profile(...)`: owner `agents_bridge`, SECURITY DEFINER = false.
- Verify protected tables cannot be directly written by `agents_bridge` where publication must occur through the function. Verify the publisher has its *necessary* schema/table/sequence/function permissions; no SUPERUSER, BYPASSRLS, broad privileges or owner substitution as a quick fix.
- Examine `0088`-`0091` and successor SQL for ownership/lookup/grant regressions, including the effective final publisher.

### M04. Profile, route and policy validation contracts
- Inspect `0023`, `0028`, `0076`-`0081`, `0088`-`0090` and all successor definitions for internally inconsistent identity checks, mandatory FK/version bindings and required error states.
- Confirm `0076` is a minimal unqualified route association. Do not convert it into qualification evidence.
- Audit/fix an incorrect comparison of `provider_account_alias` to provider ID **only if confirmed**; ensure association `providerId` is compared against provider identity and the full qualified tuple still needs verified evidence before publication.
- Missing approval must yield the existing fail-closed `authorized enforcement policy is missing or stale` outcome; never create one automatically.
- Do not implement the A03 qualification evidence authority here. Record its missing contract as a downstream feature dependency.

### M05. Candidate publication and immutable calculated allocation
- Verify `0091`-`0096` final effective candidate publisher, calculated allocation, route bindings, candidate fingerprint, exact process/workload input version and revision fences.
- Verify historical one-step publish+activate functions are retired/inaccessible when intended. Reject stale/foreign inputs.
- Verify candidate publication does **not** create an active pointer or activation row.
- If a test needs an approved policy or qualified route to exercise this SQL, it must create valid **isolated test fixtures** with the exact production shape; those fixtures may not enter production migrations.

### M06. Activation, admission and snapshot boundaries
- Preserve shared-domain v2 activation block. No fake Release Attestation Authority, no temporary unlock.
- Verify `ProviderWorkAdmission/v1` remains a valid public SQL/HTTP boundary and cannot admit without active authority. Review `0083`, `0098`-`0102` final effective admission, fairness, quota and borrowing functions for installation/ownership regressions; do not change business semantics without a verified contract defect.
- Verify `0097`, `0106`, `0107` final v2 planning snapshot can return an unconfigured/non-permit status without a candidate and preserves `maxEligibleCompleteRequestTokens = LEAST(processBaselineTPM, maxContextTokens)`.
- Any former definition that has been superseded must be classified, not accidentally restored to a callable bypass.

### M07. Tests and fixture provenance
- Update seed-dependent integration tests to create explicit policy approval and policy fixtures when required. Test that a fresh unconfigured database remains unapproved.
- Validate that isolated function tests use production-compatible parameters, identities, versions and return contracts.
- Add deterministic SQL metadata assertions against roles, privileges, function signatures/owners/SECURITY DEFINER, and reachable authorization paths.
- Do not replace actual SQL calls with test-only shortcuts that falsely claim real database authority is verified.

## 5. Safe implementation and RESET-ONCE sequencing

1. **Preflight**: Record branch/SHA, dirty worktree, the actual migration list, and verified identity of the Atlas-only PostgreSQL development resources. This is a destructive-target integrity check, not a new consent request.
2. **Inventory the full existing BSS migration chain and known blockers**, including `0077` automatic approval, `0088` role provisioning, last-effective route-authority predicate, and 0091/0107 function contracts. Record other defects found.
3. **Amend existing in-scope SQL files** and related runner/tests only as required by reproduced migration/contract failures. Do not add new corrective migration numbers or an alternate fresh-install baseline.
4. **Iterate on separately disposable PostgreSQL test clusters** as needed: create clean cluster -> real `pnpm --filter @atlas/db migrate` -> inspect first failure -> repair -> recreate disposable test cluster. These are test runs, **not repeated resets of the user's primary development DB**.
5. On the disposable cluster, run the complete focused BSS migration/SQL-contract regression set. Resolve all in-scope failures before touching the primary development DB.
6. **Only once the disposable acceptance gate is green**, stop Atlas processes and reset the user-designated, verified Atlas-only PostgreSQL development cluster/database. If dedicated Atlas cluster, recreate dedicated storage/cluster to remove hidden roles. If shared infrastructure unexpectedly appears, halt instead of deleting unrelated resources.
7. Migrate the primary clean development cluster from zero using the same real runner and verify all expected state, ownership, privilege and fail-closed checks. Rerun migration command to prove idempotency.
8. Report what changed and what is still **unimplemented by design**. Freeze the validated existing-migration baseline. Later features should normally use forward SQL migrations to avoid another database reset.

**If test-cluster migration is not fully green, do not reset the user's main `atlas_dev` yet.** Report remaining blockers and their scope. Do not claim GO solely because a subset of tests passes.

## 6. Acceptance gates

### Gate A - Fresh installer complete
- Migration runner succeeds through the **last registered migration** on a pristine PostgreSQL cluster, without manually precreating role `atlas`.
- Role/schema bootstrap, pg-boss initialization and migration ledger are consistent and reproducible.
- Second run makes no changes to BSS business state.

### Gate B - Clean BSS state
- Exactly one allowed `0076` profile (`anoman-shared-prod`, `2026-10-18.1`) with intended provenance and limits.
- Exactly zero enforcement policy approvals/policies/revocations, qualified route authorities, process/workload profiles, desired plans, calculated allocations, candidates, activation rows/pointers, admission work/reservations and related runtime business state.
- No startup or seed fallback silently populates those records.

### Gate C - SQL authority preserved
- Required owners, SECURITY DEFINER modes, privileges and immutable triggers verified by catalog queries and least-privileged execution attempts.
- Missing approval and missing active plan fail closed.
- No old publication/admission overload remains callable as a bypass; activation fence retained.
- Snapshot v2 sizing and non-permit semantics unchanged.

### Gate D - Test and environment evidence
- Existing focused BSS SQL/integration suites pass or each blocked test is separately reported with exact environment cause; no silent skipped failures.
- Production-shaped fixture tests exercise relevant authoritative SQL functions without seeding business authority in migrations.
- Disposable fresh-cluster PASS **before** primary development reset, and primary development clean install PASS **after** one final reset.

## 7. Status and scope-completion report

Report: changed files+lines and reason; complete BSS migration inventory; existing function/owner/privilege matrix; prohibited seed removal; every confirmed defect and amendment; actual CLI/test outputs; disposable-cluster outcomes; final development-cluster reset identity and row counts; idempotence; remaining next-scope work; GO/NO-GO.

Use **GO** only if the final requested installation and BSS contract gates are met. A current SQL function that correctly rejects an unqualified/unapproved workflow is not a migration failure. A missing future Admin/qualification/release implementation is a later lifecycle feature, not a reason to seed authority now.

## 8. Mandatory stop conditions

- Do not wipe a database/cluster unless it is verified Atlas-only development infrastructure.
- Do not reset the main development database repeatedly while auditing SQL; use throwaway test clusters first.
- Do not alter more application logic to 'fix' a migration acceptance test.
- Do not turn SQL migration convergence into a giant BSS feature refactor.
- Do not create a complete qualification/policy approval/activation chain merely to satisfy tests.
- Do not weaken protected authority or claim new production execution is enabled.
- Do not silently edit other people's unrelated working tree changes.
