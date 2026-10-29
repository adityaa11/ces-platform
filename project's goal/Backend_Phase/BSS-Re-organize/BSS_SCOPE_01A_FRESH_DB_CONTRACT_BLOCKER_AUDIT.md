# BSS Scope 01A - Fresh-DB Bootstrap Contract Blocker Verification

**Task mode:** CONTRACT AUDIT / DIAGNOSTIC / DECISION GATE ONLY. No repository changes are authorized.

**Permanent governing baseline:** `atlas_bss_pipeline_baseline_function_first_v3.md`, including both matrices in Section 5A and the function-first contract rules in Sections 6-7.

**Supporting evidence:** `BSS_SQL_SEED_DECOUPLING_AUDIT.md` (2026-10-28); use as a prior observation, not as proof that the current branch has remained unchanged.

**Future work:** Scope 01B will implement only an approved solution to the contract blockers verified here. **Do not implement Scope 01B as part of this task.**

## 1. Why this is the first scope

We are transitioning Atlas BSS from SQL-seeded business authority to a lifecycle initiated by authorized operators through future Atlas Admin actions:

`Provider Profile -> Qualification -> Route Authority -> Policy Approval -> Process/Workload Configuration -> Allocation Preview -> Candidate Publication -> Release Approval -> Activation -> Runtime Admission`

The first prerequisite is a correct **fresh-install bootstrap state**. Today the migration runner executes SQL `0076`, which is the one allowed Anoman provider profile seed, and `0077`, which additionally inserts Anoman approval and enforcement-policy business authority. This violates the target state before any operator has performed an action.

**We must solve only that bootstrap boundary first.** File moves, Admin routes, qualification services, route publication, candidate publication, attestation and activation are future scopes.

### Relationship to the permanent matrices

- **A01 Provider Profile:** preserve the `0076` Anoman bootstrap record and immutable profile table.
- **A05 Enforcement Policy Approval:** eliminate *migration-time issuance* of approval/policy as fresh-install business decisions. Preserve the SQL approval authority, provenance validation, revocation, and fail-closed derivation.
- **A00 Admin Gateway:** a future consumer/caller, NOT implemented here.
- **A02-A04, A06-A13:** unchanged, except inspect startup/read behavior necessary to prove that the unconfigured state is safe.

## 2. Scope boundary: actual entry point and handoff contract

This is a migration-only scope, so it uses the permanent baseline's explicit migration exception to the function-first requirement.

| Field | Contract |
|---|---|
| **Actual entry point** | `packages/atlas-db/scripts/migrate.mjs`, invoked through the existing `@atlas/db` migrate command (verify package script and caller). |
| **Caller** | Authorized installation/deployment operator or test runner initiating database migrations. No Admin API involvement yet. |
| **Inputs** | Existing `DATABASE_URL` and migration-runner credentials/environment; current migration manifest and SQL files. Do not introduce user/session data as an input. |
| **Operation** | Install schema, database roles/grants/functions, bootstrap infrastructure, and the single allowed Anoman BSS business profile; do **not** issue operational approval/policy as a migration side effect. |
| **Durable handoff** | PostgreSQL schema and data state, not a synthetic DTO: `bridge.provider_capacity_profile` contains only the one allowed Anoman profile; policy/approval and downstream business authority are absent on fresh installation. |
| **Next consumer** | Future A01 provider profile read/versioning and A02/A03 route/qualification operations; A05 policy approval receives an initially unapproved state. |
| **Failure semantics** | Missing approval is a valid unconfigured state; consumers reject requested planning/execution operations, and unrelated service startup must not be blocked by fabricated authority. |
| **Scope completion** | First produce verified contract/amendment findings; implementation and tested fresh-install PASS are separately authorized in Scope 01B. |

No new HTTP endpoint or TypeScript lifecycle service is required in Scope 01A. The **production** migration runner is the exact entry point to audit; a hand-made fixture that bypasses it is insufficient evidence.

## 3. Exact desired fresh-install postconditions

After applying the **future approved fresh-install path**, these BSS business entities should be:

| Entity/table | Target count | Notes |
|---|---:|---|
| `bridge.provider_capacity_profile` | 1 | Only `anoman-shared-prod`, seed version `2026-10-18.1` from `0076`. Verify actual seed identity. |
| `bridge.provider_enforcement_policy_approval` | 0 | No operator-approved policy yet. |
| `bridge.provider_enforcement_policy` | 0 | No effective policy is automatically authorized. |
| `bridge.provider_enforcement_policy_revocation` | 0 | No revocations yet. |
| `bridge.qualified_provider_route_authority` | 0 | Qualification/route publication is separate future work. |
| `bridge.provider_process_profile` | 0 | A06 future stage. |
| `bridge.workload_envelope_profile` | 0 | A06 future stage. |
| `bridge.desired_admission_profile` | 0 | Candidate publication has not happened. |
| `bridge.calculated_class_process_allocation` | 0 | No allocated candidate. |
| `bridge.desired_admission_profile_candidate` | 0 | No published candidate. |
| `bridge.active_desired_admission_profile` | 0 | No production activation. |
| `bridge.desired_admission_profile_activation` | 0 | No activation history. |

Release-attestation tables may not exist yet; **do not create them** in this scope. Runtime reservation/usage state should also be empty. Infrastructure rows such as `atlas.schema_migrations`, Admin bootstrap coordination, Better Auth, pg-boss schema, role/grant setup and other unrelated operational infrastructure are not forbidden BSS business seeds.

Do not conflate a fresh-install state with an existing deployment: legitimate existing approval/activation/history records must be preserved.

## 4. Evidence that must be rechecked, not assumed

Prior audit at commit `343c9ad8b0763c7fba985892136638a31223b539` reported:

- A real disposable PostgreSQL migration through `0111` produced **1 profile, 1 approval, 1 policy**; other inspected BSS authority tables had zero rows.
- Migration `0076` contains the permitted Anoman bootstrap INSERT.
- Migration `0077` contains the prohibited automatic approval and policy INSERTs.
- `bridge.derive_effective_enforcement_policy` correctly rejects absent or stale approval rather than manufacturing one.
- Migration runner tracks applied migrations by **name**, creating an upgrade/history concern if the body of `0077` is changed.
- Prior audit found an **additional, independent** `0076`/`0090` Anoman route tuple and provider alias mismatch. That belongs to a later onboarding scope, not this bootstrap-seed task.

Codex must verify branch, current commit, runner, SQL, and executable results again. Do not report the prior audit as newly verified if the tests cannot be repeated.

## 5. Mandatory contract-blocker register to investigate

For **each** blocker, classify as `CONFIRMED`, `NOT REPRODUCED`, `ALREADY RESOLVED`, or `UNVERIFIED`, with exact `file:line`, caller/consumer and runnable evidence.

| ID | Contract or blocker to test | Required audit question | Scope disposition |
|---|---|---|---|
| **CB-01** | Migration-time business approval/policy (`0077`) | Are the Anoman approval and policy inserted by the runner on every zero-to-current fresh installation? What are their exact rows/IDs, and are there any additional triggers or inserts? | **Scope 01 contract to amend.** |
| **CB-02** | Schema and business seed co-located in `0077` | Can schema, triggers, ACL, derivation and runtime checks be preserved while omitting only automatic data issuance on fresh installs? Are the policy tables referenced by later migrations at install time? | **Scope 01 contract to amend.** |
| **CB-03** | Migration ledger/history semantics | Does `migrate.mjs` use ordered explicit names, checksums, on-disk file identity, conditional paths or baseline metadata? What happens if an already-applied file's contents change? | **Scope 01 decision gate.** |
| **CB-04** | Historical upgrade compatibility | Can an existing DB with `0077` approved rows, immutable references and later candidates continue to migrate/read safely without deletion or rewrite? Is there an upgrade-only path versus a fresh-install path? | **Scope 01 compatibility gate.** |
| **CB-05** | Missing approval fail-closed contract | Which functions/readers call `derive_effective_enforcement_policy`? Without policy rows, do they return the correct inactive/unfit/stale rejection, or does application startup crash or silently fall back? | **Scope 01 verification; amend only if required for unconfigured state.** |
| **CB-06** | Seed/reference hardcoding | Does TypeScript, SQL, env config, CLI bootstrap or production code require `anoman-rpd-not-published-approval-2026-10-18`, `anoman-v1`, or assume one approval row exists? | **Scope 01 if bootstrap-coupled; report other paths separately.** |
| **CB-07** | Test harness conflation | Do test setups depend on `0077` existing rather than inserting isolated explicit test approval? Identify each broken test/fixture once the fresh seed is absent. | **Scope 01 tests to adapt in 01B; never add production seeds to fix tests.** |
| **CB-08** | Bootstrap postcondition observability | How will the real runner/installer be tested and exact row counts verified without bypassing the migration path? | **Scope 01 test contract.** |
| **CB-09** | First-provider qualified-route bootstrap (`0076`/`0090`) | Confirm existence and relationship only: missing full route tuple and alias/provider-ID mismatch. | **Document as next-scope blocker; do not fix here.** |
| **CB-10** | Shared-domain activation and snapshot | Confirm absence of unintended auto-activation and no admission-permit fallback; do not attempt to resolve release attestation. | **Regression boundary only; no A09/A10 implementation.** |

Investigate further blockers discovered through the actual source, but **do not silently widen this scope**. File them as separate issues, distinguishing immediate bootstrap blockers from later pipeline design gaps.

## 6. Source targets and precise questions

### 6.1 Migration runner and installer

Inspect:

- `packages/atlas-db/scripts/migrate.mjs` (entire migration array and execution loop).
- `packages/atlas-db/package.json` and root package scripts calling migrations.
- Any docker/startup/deployment scripts that run migrations or bootstrap SQL outside that runner.
- `atlas.schema_migrations` DDL and applied-migration behavior.

Answer:

1. Is a new database distinguishable from an upgrade within the existing installer?
2. How is a migration considered already applied? Is there any checksum/digest/history verification?
3. Is the migration list ever generated, selected, or conditional based on environment?
4. Could a migration run from clean state create the forbidden approval before later clean-up? If so, why is that unsafe or inappropriate given immutability/provenance?
5. Is a fresh-only baseline or installer variant compatible with existing history, CI, and deployment tooling?

### 6.2 SQL seed and authority

Inspect:

- `0023_bssv200501_provider_capacity_catalogue.sql`
- `0076_bssv200501_anoman_capacity_profile.sql`
- `0077_bssv20060501_authorized_enforcement_policy_provenance.sql`, especially approval/policy INSERTs and immutability/derivation.
- Effective successor SQL definitions referencing approval, policy, plan publication, snapshot, and admission, including `0078`-`0084`, `0091`, `0102`, `0106`, `0107` as relevant.

Answer:

1. Which SQL writes occur **at migration execution time** versus only inside functions called later?
2. What exact constraints make seeded `0077` rows immutable or restrict their deletion?
3. Is any later migration DDL/DML **dependent on the seeded approval's existence**, not just its table/function?
4. Does the effective deriver preserve expected fail-closed behavior with an empty approval/policy catalog?
5. Is the intended target *schema installed + zero approval rows* feasible without altering policy semantics?

### 6.3 Application consumers and tests

Inspect:

- `apps/agents-bridge/src/` policy planning and snapshot readers.
- `apps/agents-bridge/src/app.ts`, `main.ts`, `worker-main.ts` for startup/registration.
- BSS integration tests in `apps/agents-bridge/tests/` and `packages/atlas-db/tests/`.
- Production startup/env default logic and any hardcoded Anoman policy ID/ref.

Answer:

1. Can the Bridge HTTP process and Admin start in an unconfigured state?
2. Does a missing approved policy return a legitimate fail-closed result, rather than giving capacity or creating an approval?
3. Which tests depend on seeded policy rows and need isolated test fixture setup changes?
4. Are tests proving the actual migration runner outcome or merely direct fixtures?

## 7. Verification plan (do not mutate existing databases)

**Preflight:** Record branch, commit SHA, `git status --short`, exact migration list, PostgreSQL version, commands and environment type. Do not print passwords, access tokens, or secret URLs.

**A. Static audit:** Inventory all top-level INSERT/UPDATE/DELETE on BSS business tables across ordered migrations, excluding schema history, transactional function bodies, test-only fixture SQL, and runtime writes. Report `file:line` and object.

**B. Disposable fresh-DB reproduction:** If supported tools/containers are available, create a uniquely named disposable PostgreSQL 18 DB, run the repo's actual migration command end-to-end, record the count of each entity from Section 3, verify `atlas.schema_migrations` state, then safely discard **only** the disposable DB. Confirm `0076` identity.

**C. Safe missing-policy checks:** On a separate disposable DB or transactional throwaway fixture, verify that an empty approval/policy catalog yields a fail-closed `derive_effective_enforcement_policy` and appropriate reader response. Do not attempt to delete immutable history from an existing database or bypass triggers. If an empty policy catalog cannot be established without modifying the migration path, report that verification blocker instead of using a destructive workaround.

**D. Existing-deployment upgrade simulation:** Use a disposable **copy/fixture** containing the historical `0077` rows and any material downstream references. Determine whether the proposed baseline mechanism leaves those valid records, activation history, and migration ledger unchanged. Do not touch a shared/dev/production database unless expressly scoped and disposable.

**E. Regression review:** Identify existing focused test commands and whether they run against production-equivalent code paths. May run safe isolated tests, but report them as isolated, not fresh-install or full integration proof.

**If Docker/PostgreSQL or credentials are unavailable:** perform static audit, label DB observations UNVERIFIED, and provide exact reproducible commands for the owner. Never claim PASS without execution.

## 8. Required design comparison - do not pick prematurely

Compare at least the following approaches, using actual migration runner semantics:

1. **Explicit fresh-install baseline manifest:** a new baseline that installs the same schema/function contracts and the allowed Anoman profile without `0077` authority data; old migration history remains available to existing upgrades.
2. **Fresh-install versus upgrade installer path:** a versioned branch/manifest that omits only the authority issuance for new DBs while retaining schema and compatible history, without operator-controllable bypass flags.
3. **Verified alternative:** any other repository-supported approach, if it preserves exact fresh/upgrade semantics, auditable migration history and no hidden auto-approval.

For each: enumerate changed files, migration-ledger identity/checksum effects, upgrade compatibility, startup/test implications, production deployment risk, maintainability, and rollback/release plan.

Reject or explicitly flag designs that:

- delete historical approval records solely to zero a database;
- weaken immutability triggers or authorization grants;
- rewrite already-applied migrations without a supported history/versioning strategy;
- silently skip migration checks in CI/production;
- introduce a mutable env switch that can enable/disable approval issuance at runtime;
- treat a migration timestamp/account alias as proof of human approval;
- alter qualification route publication, activation or Fair Admission while fixing the seed;
- hardcode a new default policy in application startup to replace `0077`.

**Important:** This scope does not grant Codex permission to choose an implementation and edit files. It produces a reasoned recommendation and a bounded Scope 01B amendment plan for review.

## 9. Detailed output requirements

Return a report with these exact sections:

1. **Repository baseline:** branch, SHA, working tree, migration runner version and actual start command.
2. **Current effective contract:** diagram showing installer -> `0076` allowed seed -> `0077` approval issuance -> downstream policy derivation/consumption.
3. **Contract blocker register:** CB-01..CB-10, verified status, exact evidence, severity, affected callers/consumers, root cause, and stage where remediation belongs.
4. **Migration data classification:** S1 schema; S2 infrastructure metadata; S3 allowed Anoman seed; S4 prohibited business authority seed; S5 runtime transactional write; S6 test fixture; S7 historical/retired; S8 implicit dependency.
5. **Actual fresh-DB counts:** comparison of observed versus required tables/counts; include command and disposable DB proof, or explicitly unverified.
6. **Existing DB compatibility:** how historical `0077` data/references survive, version/checksum/manifest risks and compatibility evidence.
7. **Recommended bootstrap amendment design:** precise minimal file/function touchpoints, old vs new behavior, accepted tradeoffs, and why other approaches were rejected.
8. **Scope 01B proposal:** smallest set of files and tests to change to implement chosen design; no unrelated BSS lifecycle code.
9. **Exit contract:** exact expected database state, unconfigured fail-closed behavior, and next consumer A01/A03/A05.
10. **GO/NO-GO checklist:** evidence supporting a decision; unresolved architecture/authority choices; required operator approval.

Attach a compact proposed diff outline **as prose or pseudocode only**. Do not write actual migration patches or change the checkout.

## 10. Completion and stop rules

**Scope 01A PASS** means: all material bootstrap-contract blockers have a precise evidenced disposition, the fresh-install migration effect is understood, a compatibility-safe amendment approach is recommended, and Scope 01B can be written without guessing. If tests were unavailable, make the limitation and remaining gate explicit.

**Scope 01A NO-GO** means: the migration history/upgrade path cannot be safely distinguished, an unstated seeded authority dependency remains, or the recommended approach would alter/destroy existing authority history without authorization.

When done: **STOP. Do not implement, refactor, create Admin routes, add SQL migrations, approve a policy, or alter activation.**
