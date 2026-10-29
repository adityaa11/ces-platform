# Atlas BSS — SQL Seed Decoupling Audit

**Audit date:** 2026-10-28  
**Mode:** read-only source and test audit; no application or migration changes were made.  
**Repository state:** `codex/new-atlas-backend` at `343c9ad8b0763c7fba985892136638a31223b539`.  
**Migration baseline:** `packages/atlas-db/scripts/migrate.mjs` applies the ordered set through `0111_aa001_bootstrap_conflict_and_sealed_fence` ([lines 11–82](packages/atlas-db/scripts/migrate.mjs#L11)). The effective fresh-install migration version is therefore **0111**, subject to the migration-history table.  
**Working tree:** dirty before the audit, including existing modified tests, generated fixture files, untracked migration files `0039`–`0046`, and extensive `.codex-tools/`, `tmp/`, and project-note material. None was changed by this audit.

## Executive summary

The repository has **two confirmed migration-time BSS business-data inserts**:

1. `0076` inserts the permitted initial Anoman capacity profile.
2. `0077` inserts an Anoman enforcement-policy approval and policy. This is the prohibited SQL-seeded authority dependency.

The latter is not merely an innocuous default. It supplies the exact approval reference needed to exclude Anoman's unknown RPD dimension, and downstream planning cannot derive an effective enforcement policy without it. `derive_effective_enforcement_policy` correctly rejects a missing, revoked, mismatched, or malformed policy; the defect is that the migration creates the authority decision rather than a controlled application operation doing so.

There is a second, independent bootstrap defect: the allowed `0076` profile records only `routeId` and `providerId`, while the effective qualified-route publisher requires `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and `capability` to already be present in the immutable profile association. Thus an operator cannot publish a first qualified Anoman route from the seed-only profile. The current code also attempts to publish route authority lazily at provider-work binding time, using environment-configured routes. That is the wrong lifecycle owner and still cannot overcome the incomplete `0076` association.

The database's runtime safety boundaries are largely sound and should remain PostgreSQL-owned: immutable authority, exact policy provenance, atomic candidate publication, activation epochs, admission fencing, accounting, and authenticated snapshots. The application-layer command seams required to create profiles, record qualification evidence, approve policy, publish process/workload records, publish candidates, attest releases, and activate are mostly absent. The Admin application currently provides only the authenticated Super Admin shell and an identity endpoint.

The existing `shared_domain_calculated_allocation/v2` candidate path is deliberately **not activatable**: `activate_desired_admission_profile` raises the BSS-V2-014 parent-cutover gate. Do not remove that fence. A release-attestation authority and successor activation operation must be introduced first.

## Scope, evidence, and limitations

Source inspection covered the migration runner and BSS migrations, Bridge composition and runtime modules, Admin authorization/API/UI modules, and relevant tests. Three isolated, non-database Bridge test files passed:

- `apps/agents-bridge/tests/route-registry.test.ts` — 9 passed.
- `apps/agents-bridge/tests/idser-capacity-planning-snapshot-v2.test.ts` — 7 passed.
- `apps/agents-bridge/tests/capacity-catalogue.test.ts` — 3 passed.

### Disposable fresh-DB verification

After the initial inspection, a new throwaway `postgres:18-alpine` container was started on `127.0.0.1:55432` with a unique database and credentials. The checked-out `pnpm --filter @atlas/db migrate` command completed successfully through migration `0111`; no existing user database was accessed. The following direct post-migration counts were observed:

| Entity | Count |
|---|---:|
| `bridge.provider_capacity_profile` | 1 |
| `bridge.provider_enforcement_policy_approval` | 1 |
| `bridge.provider_enforcement_policy` | 1 |
| `bridge.provider_enforcement_policy_revocation` | 0 |
| `bridge.provider_process_profile` / `workload_envelope_profile` | 0 / 0 |
| `bridge.desired_admission_profile` / calculated allocation / candidate | 0 / 0 / 0 |
| active profile / activation history / qualified route authority / reservation | 0 / 0 / 0 / 0 |

The sole profile is `anoman-shared-prod:2026-10-18.1`, with alias `anoman-atlas-free-account` and exactly the minimal route association from `0076`. The seeded `0077` approval and policy are present, and `derive_effective_enforcement_policy` succeeds using that approval.

The database also rejected an attempted first publication of the full Anoman route tuple with `qualified route authority is foreign, revoked, or mismatched for its quota domain; non-qualified identity is rejected`; authority count remained zero. A v2 planning snapshot read with no candidate returned `{status:"stale", reason:"calculated_candidate_missing", readIsNotAdmissionPermit:true}`. This is a **verified fresh-install failure against the requested target**, not a target-baseline PASS.

No full database integration-test suite was run; those tests use their own setup and are not a substitute for the required seed-only lifecycle tests.

## SQL seed dependency matrix

| Migration/file | Seed or implicit dependency | Affected entity | Current consumer | Empty-DB failure | Recommended decoupling | Risk |
|---|---|---|---|---|---|---|
| `0076_bssv200501_anoman_capacity_profile.sql:19–56` | **S3 allowed bootstrap.** Inserts one Anoman profile, domain `anoman-shared-prod`, version `2026-10-18.1`, account alias `anoman-atlas-free-account`, and a minimal route association. | `bridge.provider_capacity_profile` | Policy derivation, candidate publisher, runtime/snapshot readers. | The one intended profile exists, but it cannot meet the current fully-qualified-route publisher predicate. | Retain as the sole automatic BSS business profile. Treat it as a bootstrap-capacity observation, then publish an operator-created successor profile containing a verified full association after qualification. | High if changed in-place: applied migrations are historical. |
| `0077_bssv20060501_authorized_enforcement_policy_provenance.sql:195–212` | **S4 prohibited seed.** Inserts approval `anoman-rpd-not-published-approval-2026-10-18` and policy `anoman-v1`. | `bridge.provider_enforcement_policy_approval`, `bridge.provider_enforcement_policy` | `bridge.derive_effective_enforcement_policy` (`0077:104–192`), candidate publication, runtime admission and snapshots. | Without it, derivation correctly raises `authorized enforcement policy is missing or stale`; current migrations instead pre-authorize the exclusion. | Remove the inserts from the fresh-install baseline through a migration-baseline strategy; replace with an explicit Bridge-owned approve-policy command. Preserve tables, triggers, derivation, and revocation. | Critical authority provenance violation. |
| `0076:39` plus `0090_bssv20140201_qualified_tuple_publication_guard.sql:40–55` | **S8 implicit identity dependency.** The seed's association lacks five identity fields required by the current publisher. It also stores an account alias distinct from provider ID. | `provider_capacity_profile.associated_routes`; `qualified_provider_route_authority` | `bindProviderWorkRouteFromResolver` ([`provider-operational-runtime.ts:87–127`](apps/agents-bridge/src/provider-operational-runtime.ts#L87)); candidate publisher. | First-time Anoman route publication always rejects as non-qualified/mismatched. | Add a qualification-evidence authority and a profile-version publication operation. It must create a successor profile with the complete, verified tuple; do not mutate the seed. Correct lookup to compare association `providerId` to input `providerId`, not account alias to provider ID. | Critical onboarding deadlock. |
| [`route-registry.ts:46–108`](apps/agents-bridge/src/route-registry.ts#L46) and [`config.ts:164`](apps/agents-bridge/src/config.ts#L164) | **S8 configuration dependency.** `AGENTS_BRIDGE_QUALIFIED_ROUTES` supplies qualification identity and enabled state outside database authority. | process-local route registry | Bridge and worker startup; lazy route publication. | Empty route config permits development bridge startup but route resolution returns unavailable; live worker throws when required routes are unavailable ([`worker-main.ts:34–36`](apps/agents-bridge/src/worker-main.ts#L34)). | Replace execution-route authority loading with a Bridge read model of active, DB-authorized routes. Keep deployment-only adapter availability/config separate. | High: split-brain authority. |
| [`provider-operational-runtime.ts:87–127`](apps/agents-bridge/src/provider-operational-runtime.ts#L87) | Route authority is published during execution binding, not an operator publication stage. | `qualified_provider_route_authority` | admitted-provider work path | Route authority can be manufactured late from env configuration; with the seed it fails due to the tuple mismatch. | Move call into A04 qualified-route publication application service, before candidate publication. Execution should only bind an authority already pinned by its active plan. | High lifecycle crossing. |
| DB integration tests, e.g. `weighted-capacity-publication.integration.test.ts:45–61` and `capacity-planning-snapshot.integration.test.ts:56–62` | **S6 test fixtures.** Tests insert profiles, approvals, policies, process/workload records, authority, candidates and activation state. | test databases only | integration tests | Not production migration data. | Retain as isolated fixtures; add a seed-only fresh-DB fixture instead of promoting test rows to migrations. | Medium test coverage gap. |
| `0088`–`0090`, `0091`, and `0029` inserts inside SQL functions | **S5 transactional authority writes**, not migration seeds. | route authority, candidate/plan/input/binding, activation pointer/history | publication and activation operations | Expected rejection when prerequisites absent. | Preserve and call only from explicit authorized application services. | High if mistaken for seeds. |

Static scan found no other top-level BSS business-data `INSERT` outside `0076` and `0077`. Inserts in earlier/later migration files are schema-migration bookkeeping, function bodies, or runtime state/accounting writes.

## Current fresh-database state and startup diagnosis

After the migration list is applied from zero, source evidence says the BSS business rows are:

- one `provider_capacity_profile` from `0076`;
- one approval and one policy from `0077` (contrary to the requested target); and
- no migration-time inserts into process profiles, workload profiles, qualified route authority, desired profiles/candidates, activations, reservations, or runtime usage.

Schema, roles, functions, constraints, grants, migration records, Better Auth, and Admin bootstrap infrastructure are legitimate S1/S2 infrastructure. `0028` creates but does not seed process/workload tables ([`0028:2–48`](packages/atlas-db/migrations/0028_bssv200502_process_workload_catalogue.sql#L2)). `0029` creates but does not seed plans/activation ([`0029:2–153`](packages/atlas-db/migrations/0029_bssv200504_desired_admission_profile_publication.sql#L2)).

| Component | Seed-only/unconfigured behaviour | Assessment |
|---|---|---|
| Admin page/API | Better Auth session plus persisted `admin`/`SEALED` state gates dashboard and `/api/admin/identity` ([`admin-guard.ts:23–60`](apps/atlas/lib/admin-guard.ts#L23)). It does not read BSS configuration. | Starts independently; no BSS command endpoints exist. |
| Bridge HTTP process | A development profile can start with no enabled route. Snapshot endpoint returns inactive when unavailable/unauthorized ([`app.ts:21–76`](apps/agents-bridge/src/app.ts#L21)); admission returns `policy_or_resource_unfit` ([`app.ts:79–97`](apps/agents-bridge/src/app.ts#L79)). | Correct fail-closed behaviour. |
| Worker | Live mode throws if the env route registry is not ready ([`worker-main.ts:34–36`](apps/agents-bridge/src/worker-main.ts#L34)). | Intended production readiness gate, but it is environment authority rather than DB read-model authority. |
| Runtime capacity reader | Missing active profile is returned as `inactive_or_unauthorized` by `read_runtime_capacity_constraint` (`0068:40–41`), and TypeScript passes only recognized fail-closed data ([`runtime-capacity-constraint.ts:49–74`](apps/agents-bridge/src/runtime-capacity-constraint.ts#L49)). | Correct fail-closed rejection. |
| Fair Admission | The effective path requires an active desired profile; scheduler raises `active desired admission profile is required` (`0101:164–170`); route-aware admission returns unavailable for a missing/stale active plan (`0100:164–189`). | Correctly does not create authority or grant default capacity. |
| Planning snapshots | v2 returns stale `calculated_candidate_missing` without a candidate (`0106:51–62`); reader maps unavailable/error to a non-permit inactive/stale result ([`capacity-planning-snapshot.ts:39–86`](apps/agents-bridge/src/capacity-planning-snapshot.ts#L39)). | Correctly non-authorizing; candidate publishing is nevertheless unreachable through application commands. |

## Operator authority lifecycle matrix

“Current dependency” describes the checked-out code; “required Admin operation” is target design, not implemented behaviour.

| Group | Actual entry point | Current dependency | Required Admin operation | Existing SQL authority | Missing implementation | Proposed handoff |
|---|---|---|---|---|---|---|
| A00 Admin Command Gateway | Admin page + `/api/admin/identity` only | Better Auth admin + sealed bootstrap | authorize BSS command and capture operator identity/idempotency | Admin state only | BSS API routes, operational permission, audit command/result records | Admin API → authenticated Bridge command client |
| A01 Provider Profile | none | `0076` seed or fixture direct inserts | publish immutable profile/version | immutable table/trigger (`0023`) | command contract, provenance validation, read model | Bridge service → profile publication function/table authority |
| A02 Model/Route Configuration | env `AGENTS_BRIDGE_QUALIFIED_ROUTES` | process configuration | declare non-executable adapter/route candidate | none durable | route configuration record and adapter compatibility validation | Bridge command/read model |
| A03 Qualification | live probe modules exist, but no durable BSS result | environment route identity | launch bounded qualification and persist signed/result evidence | no qualification-evidence table found | async operation/result/evidence authority | Admin command → Bridge job → immutable evidence |
| A04 Qualified Route Publication | lazy `bindProviderWorkRouteFromResolver` | env route + profile tuple | publish route authority from verified evidence | `publish_qualified_provider_route_authority` (`0090`) | dedicated application service; corrected profile identity representation | Bridge command → `0090` successor function |
| A05 Enforcement Policy Approval | migration `0077` or direct test inserts | seeded approval | approve/reject/revoke policy for exact profile/route/version | immutable tables/triggers + `derive_effective_enforcement_policy` | approval/revocation commands, permission and idempotency | Bridge command → authoritative validation/write |
| A06 Process/Workload Configuration | none | direct test inserts | publish immutable versioned profiles | immutable tables/triggers (`0028`) | validated publisher, lifecycle read model | Bridge command → Bridge-owned tables/function |
| A07 Capacity Allocation | pure `planEffectiveDesiredAdmissionProfile` ([`capacity-planner.ts:235`](apps/agents-bridge/src/capacity-planner.ts#L235)) | caller-provided objects/policy | preview/recompute exact inputs | SQL candidate publisher revalidates | orchestration that reads durable inputs and returns a preview | Bridge service (pure planner) |
| A08 Candidate Publication | no application call found | direct integration-test calls | publish immutable calculated candidate | `publish_shared_domain_calculated_desired_admission_profile` (`0091:66–236`) | service, expected-revision/idempotency handling, command result | Bridge service → SQL publisher |
| A09 Release Attestation | none | parent cutover fence | attest candidate for promotion | none | attestation table/function and approval provenance | Bridge command → attestation authority |
| A10 Activation | SQL callable only by `agents_bridge` | no attestation; v2 fence blocks candidate | promote attested candidate | guarded activation epoch function | successor that requires attestation; service command | Bridge service → successor activation function |
| A11 Fair Admission | HTTP service → SQL | active route-bound plan | consume only active authority | atomic SQL and accounting | no onboarding responsibilities should be added | unchanged runtime boundary |
| A12 Planning Snapshot | authenticated bridge reader | candidate or active v2 binding | read planning-only evidence | `read_capacity_planning_snapshot` (`0106`) | command-independent credential/read-model registration | unchanged read boundary |
| A13 IDSER Consumer | v2 composition/consumer | authenticated v2 snapshot | consume qualified planning evidence | validation is TypeScript consumer-side | none for calculation; update bindings only | unchanged server-owned credential handoff |

## Actual current call chains

### Runtime admission

`Bridge HTTP / provider-work-admissions` → `createProviderWorkAdmissionService` → `bridge.admit_provider_work_admission_v1` → active-plan/version fencing → fair-admission functions → reservation/dispatch → `claim_provider_admitted_transport` → outbound adapter → immutable operational feedback.

The caller cannot choose the provider route; the TypeScript admission service pins the principal’s domain/process/route ([`provider-work-admission.ts:70–111`](apps/agents-bridge/src/provider-work-admission.ts#L70)). SQL keeps revision, route, and allocation fencing (`0100:12–66`, `0101:87–197`). This is runtime work, not qualification or capacity publication.

### Current, incorrectly placed route publication

`provider-work attempt` → `bindProviderWorkRouteFromResolver` → env registry resolves capability → `publish_qualified_provider_route_authority` → route binding.

The route resolver is configuration-derived, while `0090` demands that exact full identity already exist in the capacity profile. This is both late in the lifecycle and impossible from the minimal seed association.

### Candidate and snapshot chain

The SQL publisher writes plan/input/allocation/route-bindings/candidate atomically (`0091:218–235`) but intentionally does not activate. `read_capacity_planning_snapshot` reads the newest isolated candidate or matching active v2 plan (`0106:31–105`). `createCapacityPlanningSnapshotReader` authenticates a server credential and calls it ([`capacity-planning-snapshot.ts:52–86`](apps/agents-bridge/src/capacity-planning-snapshot.ts#L52)); `createIdserCapacityPlanningSnapshotV2Consumer` then validates provenance and complete request limits ([`idser-capacity-planning-snapshot-v2.ts:140–214`](apps/agents-bridge/src/idser-capacity-planning-snapshot-v2.ts#L140)); `proposeStructuralFitCorpusPartition` is invoked by the async semantic batch job.

## Anoman bootstrap compatibility

**Can Anoman be qualified from the seed alone? No.**

`0076` associates `{routeId: "anoman-semantic", providerId: "anoman"}` ([`0076:39`](packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql#L39)). The effective `0090` publisher requires all of this in that same association: `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and `capability` ([`0090:40–55`](packages/atlas-db/migrations/0090_bssv20140201_qualified_tuple_publication_guard.sql#L40)). It also compares `capacity.provider_account_alias = p_provider_id` ([`0090:45`](packages/atlas-db/migrations/0090_bssv20140201_qualified_tuple_publication_guard.sql#L45)); the seed’s account alias is `anoman-atlas-free-account`, while its provider ID is `anoman`. The query therefore fails twice.

There is no table discovered for independently verifiable provider-adapter qualification evidence; `qualificationRef` and `qualificationVersion` are currently submitted strings, then copied into immutable authority. The qualification runner/probe files are not a durable authority pipeline. The `route-registry` hard-codes that Anoman cannot be enabled before qualification ([`route-registry.ts:140–149`](apps/agents-bridge/src/route-registry.ts#L140)), but this is a configuration guard rather than durable evidence.

**Required bootstrap shape:** preserve `0076` unchanged as an observed capacity record; add an operator-authorized qualification operation which persists evidence; publish a new immutable profile version that carries the complete verified route tuple and separately preserves account alias; then publish qualified-route authority from that evidence. The publisher must compare provider identity to association `providerId`, not to account alias. Qualification must run in a bounded, isolated lane and must not require an active plan or Fair Admission; it must not automatically create a production route/plan.

## Enforcement approval diagnosis

`derive_effective_enforcement_policy` already has the desired fail-closed semantics:

- requires an exact capacity-profile/domain/route association (`0077:121–129`);
- requires a currently effective policy (`0077:131–140`);
- rejects revocation (`0077:141–148`);
- verifies approval’s exact tuple matches the policy (`0077:150–156`);
- requires known dimensions to stay enforced and unknown dimensions to carry the exact approved exclusion (`0077:164–185`).

The missing application contract must include the target `(domain, capacity-profile version, route, policy id/version)`, full four-dimension decision, reasoned unknown-dimension exemptions, effective time, operator identity, and idempotency key. The record’s uniqueness already prevents duplicate exact tuples; the domain-mask trigger prevents conflicting dimension masks across routes for one profile. Revocation is append-only and must be a separate authorized command. An approval must never be reused for another profile because both the policy and approval rows carry, and derivation compares, the exact profile version.

The present Admin role proves browser-session Super Admin access; it does not establish a defined BSS operational permission. Before implementation, decide whether Super Admin alone can approve provider capacity exclusions or whether a distinct `bss.policy.approve` role/dual-control policy is required. Better Auth should authenticate the human only. The Admin API must call a service credential owned by the Bridge/BSS mutation process and pass an auditable operator-provenance payload; it must not grant browser/UI writes to Bridge tables.

## Candidate publication, activation, and Fair Admission

The two operations are already logically separate: candidate publication is idempotent/fingerprinted and writes `desired_admission_profile_candidate`; activation advances history/pointer. The old single-route effective-policy publishers are dropped in `0091:239–242`, so they are historical/retired rather than callable compatibility paths.

Activation of the new shared-domain candidate is intentionally blocked at `0091:244–259`. No release-attestation table or function exists, and so no safe candidate activation path currently exists. A successor must make activation require: exact candidate fingerprint/version, a non-revoked attestation issued by the required authorizer, expected active revision, and the current atomic epoch/pointer transaction. It must preserve advisory locking, immutable activation history, and active-pointer update. Removing the block would be a safety regression.

Fair Admission is independent of onboarding: it reads only active authority, applies revision fencing, and writes runtime reservation/accounting records. It does not create profile, approval, route, candidate, or plan records. Borrowing remains evaluated inside the active-plan runtime path (`0101:6–85`). This should remain unchanged.

## IDSER snapshot semantics

The contract is preserved by current v2 code. SQL computes:

`maxEligibleCompleteRequestTokens = LEAST(processBaselineTPM, maxContextTokens)`

at `0106:101`, rejects input/output/request-byte/context/TPM excess at `0106:91–94`, and always returns `readIsNotAdmissionPermit: true` (`0106:97`). The IDSER consumer independently verifies the same TPM/context minimum and rejects `inputTokens + reservedOutputTokens` over that limit ([`idser-capacity-planning-snapshot-v2.ts:167–203`](apps/agents-bridge/src/idser-capacity-planning-snapshot-v2.ts#L167)). It accepts a qualified isolated candidate and represents it as `productionActive: false`, so planning evidence does not authorize execution.

The missing publication command is the only seed-related obstacle to producing this snapshot from valid operator-created inputs. Do not move the sizing calculation or substitute capacity ceiling into IDSER/UI.

## File ownership and refactoring matrix

| Group | Current file/function | Actual responsibility | Seed coupling | Proposed code location | Required change |
|---|---|---|---|---|---|
| route config/A02-A04 | `route-registry.ts`, `provider-operational-runtime.ts` | env route selection and late authority publication | high | `apps/agents-bridge/src/bss/route-authority-service.ts` + DB read repository | split deployment adapter validation from durable route authority; remove runtime publication |
| qualification/A03 | `live-*-qualification*.ts` | bounded probes | not durable | `bss/qualification-service.ts` plus DB migration | store verified evidence/job outcome; publish route only from it |
| profiles/A01 | `capacity-catalogue.ts` | validates in-memory input | profile seed only | `bss/provider-profile-service.ts` | add versioned publish command/provenance/idempotency |
| policy/A05 | `0077`, capacity planner | database derivation; pure planning | seeded policy | `bss/policy-approval-service.ts` | issue/deny/revoke commands; retain SQL derivation |
| process/workload/A06 | `process-workload-catalogue.ts` | validation only | no migration seed | `bss/catalogue-service.ts` | transactional versioned publisher and read model |
| candidate/A07-A08 | `capacity-planner.ts`, `0091` | pure calculation; authoritative publish | depends on seeded policy today | `bss/candidate-publication-service.ts` | assemble durable input, expected revision, idempotency/result view |
| attestation/activation/A09-A10 | `0091` activation function | historical activation and v2 fence | no seed | `bss/release-attestation-service.ts`, new successor migration | implement attestation authority and successor activation; retain fence until then |
| runtime/A11 | admission/runtime/worker modules | operational execution/accounting | active authority only | remain in existing modules | remove publication side effect only |
| Admin/A00 | `apps/atlas/lib/admin-guard.ts`, `app/api/admin` | human authorization | no BSS operation | protected Admin BSS route handlers/client | command DTOs, status/read endpoints; no direct SQL writes |

## Fresh-install and upgrade compatibility

### Fresh database target

The target is viable only after removing `0077`’s two inserts from the fresh-install baseline and resolving the profile/route bootstrap mismatch. The resulting initial BSS business state should be exactly the single `0076` profile, no policy/approval/qualification/process/workload/candidate/activation rows, and no runtime history. Bridge/Admin should return unconfigured/inactive responses, not synthetic authority.

### Existing deployments

Do not alter applied migration files for installed systems: the runner determines pending work only by migration name ([`migrate.mjs:115–130`](packages/atlas-db/scripts/migrate.mjs#L115)), and existing rows are immutable/restrict-referenced. Editing `0077` would not remove the already-applied policy, yet would make fresh and upgrade semantics ambiguous.

Recommended approach: establish a new fresh-install migration baseline (or a supported baseline manifest) where the schema portion of `0077` is retained but its authority inserts are absent; ship forward migrations for existing installations that preserve historical seed-derived approvals and mark/reconcile their origin without deleting them. New application operations must work for both historical and operator-created records. This requires an explicit deployment/baseline decision; a single successor migration cannot prevent an earlier seed from running on a zero-to-current migration path.

## Dependency-ordered modification strategy

1. **Freeze and test the baseline.** Add a disposable-DB migration test that applies the chosen fresh baseline, counts every BSS table listed in the request, and proves only `0076` data exists. Prerequisite for all later work.
2. **Decide migration-history strategy.** Choose baseline replacement versus versioned fresh bootstrap installer. Preserve `0077` schema/derivation and existing deployed rows; eliminate only fresh-install policy/approval insertion.
3. **Introduce BSS command infrastructure.** Add Bridge-owned command/result/idempotency and operator-provenance records, a service credential boundary, and Admin protected endpoints/read models. Use the current `createAtlasAdminGuard`; do not share Better Auth browser credentials with Bridge.
4. **Profile and qualification foundation.** Add immutable qualification evidence/results and provider profile version publishing. Make the association tuple complete only after verified qualification; correct account-alias versus provider-ID comparison. Add isolated qualification execution with no active-admission dependency.
5. **Move route authority publication.** Create A04 service that calls the retained `publish_qualified_provider_route_authority`; remove its execution-time invocation from `bindProviderWorkRouteFromResolver`. Make execution read/pin only plan-bound authority.
6. **Implement policy approval/revocation commands.** Validate four dimensions and exact profile/route/version, enforce explicit authorization and idempotency, retain `derive_effective_enforcement_policy` unchanged.
7. **Implement process/workload version publishers.** Validate/process immutable catalog entries before candidate planning.
8. **Implement candidate preview/publication.** Feed the pure planner from durable reads, call `0091` with expected revision, and return immutable candidate/result. Assert it does not create active pointer/history.
9. **Implement attestation then successor activation.** Introduce release authority and a new guarded activation function. Do not alter the existing shared-domain fence until this is in place. Preserve locks, revision fencing, and history.
10. **Replace env route authority with DB read model.** Keep environment variables only for adapter credentials/capabilities and deployment transport configuration. Validate unconfigured startup/readiness semantics.
11. **Compatibility and regression verification.** Exercise existing historical rows, snapshot v2, Fair Admission, and IDSER structural limits before cutover. Rollback should disable new command/UI entry points, not mutate/deactivate historical authority.

## Required verification backlog

- Fresh migration state: exact row counts and allowed `0076` profile only.
- Seed-only state: Admin/Bridge start, snapshot inactive/stale, admission denies, worker readiness is explicit.
- First-time Anoman onboarding: qualification evidence → successor profile → route authority, with no active plan.
- Policy lifecycle: unauthorized/malformed/foreign/duplicate/revoked decisions reject; valid explicit approval permits candidate publication.
- Candidate/activation separation: candidate produces planning snapshot yet does not alter active pointer; activation requires valid attestation.
- Runtime: Fair Admission cannot create authority and rejects inactive/stale plan; borrowing remains runtime-only.
- IDSER: existing v2 structural test plus DB integration test proves identical `MIN(TPM, context)` semantics.
- Upgrade: migrate a fixture containing legacy `0077` records and active history, verify no deletion/rewrite and valid reads continue.

## Final answers

**Q1.** The exact SQL authority seeds are `0077:195–212`: the Anoman RPD approval and enforcement policy. `0076:19–56` is the sole allowed Anoman profile seed.

**Q2.** `0077` is genuine S4 coupling; `0076` is allowed S3 but has S8 tuple incompleteness. SQL inserts within publication/activation functions are S5 runtime authority writes. Test inserts are S6 fixtures. Schemas, immutability, grants, and migration records are S1/S2.

**Q3.** Current fresh state includes the allowed profile **and** forbidden seeded policy/approval. It is otherwise unconfigured. Admin and development Bridge can function fail-closed; live workers require env route readiness; Fair Admission cannot operate without activation.

**Q4.** No. First-time Anoman route authority cannot publish from `0076` due to missing tuple fields and alias/provider-ID mismatch. No durable qualification, profile-publish, policy-approval, process/workload-publish, candidate-publish application commands, or release-attestation activation path exists.

**Q5.** Dedicated Bridge application services should own profile publication, route configuration, qualification/evidence, route authority publication, policy approval/revocation, process/workload publication, candidate preview/publication, release attestation, and activation. Runtime admission is not one of them.

**Q6.** Keep PostgreSQL authoritative for immutable records, referential/tuple integrity, policy derivation, candidate publication, idempotency/revision fencing, activation epochs, atomic Fair Admission, accounting, and snapshot integrity.

**Q7.** Organize by lifecycle services with Bridge as mutation owner; Admin owns human authorization and presentation; database functions own validity/atomicity; runtime modules only consume active plan authority.

**Q8.** Establish/test a fresh baseline, choose explicit migration-history treatment, introduce command/evidence foundation, solve qualification/profile tuple bootstrap, then policy/catalog/candidate, then attestation/activation, and only then route-authority/read-model cutover.

**Q9.** Yes, provided the retained `0106` SQL and v2 consumer remain authoritative. Current code explicitly preserves the requested complete-token formula and non-admission marker.

**Q10.** Explicit approval is required for: fresh-install migration-baseline strategy; whether policy approval needs separate/dual authorization; qualification evidence/signature and retention standard; release-attestation authorizer(s); provider-profile successor semantics; and production activation/cutover criteria.

