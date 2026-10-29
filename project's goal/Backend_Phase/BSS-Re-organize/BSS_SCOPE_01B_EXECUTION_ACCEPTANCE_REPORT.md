# BSS Scope 01B — Execution and Acceptance Report

**Date:** 2026-10-29  
**Outcome:** **GO** — existing-migration convergence completed and the one authorized Atlas development PostgreSQL reset was performed after disposable-cluster acceptance.

## Scope executed

The work followed:

1. `atlas_bss_pipeline_baseline_function_first_v4.md`;
2. `BSS_SCOPE_01B_FULL_BSS_MIGRATION_CONVERGENCE_v3.md`; and
3. `BSS_SCOPE_01A_FRESH_DB_CONTRACT_BLOCKER_DIAGNOSTIC_RESULT.md`.

No Admin routes, UI work, qualification-evidence authority, release-attestation authority, or activation-stage feature was added.

## Preflight and migration inventory

- Repository branch/SHA at start: `codex/new-atlas-backend` / `343c9ad8b0763c7fba985892136638a31223b539`.
- The working tree already contained unrelated modifications and untracked material. They were preserved.
- The actual installer is `pnpm --filter @atlas/db migrate`, backed by `packages/atlas-db/scripts/migrate.mjs`.
- The registered manifest contains 106 migrations, from `0000_bss003_boundaries` through `0111_aa001_bootstrap_conflict_and_sealed_fence`.
- BSS migration groups audited: bootstrap (`0000`); catalogues and historical activation (`0023`, `0028`–`0029`); runtime/admission (`0030`–`0038`, `0047`–`0075`); seed/policy/planning (`0076`–`0084`); route authority and candidate publication (`0088`–`0097`); final admission/snapshot definitions (`0098`–`0102`, `0106`–`0107`). Shared IDSER/GHR/Admin migrations in the same manifest were installed and checked for dependency regressions.
- The untracked `0039`–`0046` SQL files were present before this work but are not registered by the migration runner. They were preserved and were not treated as part of the executable chain.

## Confirmed defects and repairs

| Defect | Repair |
|---|---|
| A pristine cluster lacked the `atlas` role required by `0088` ownership changes. | `0000` now creates `atlas` as a NOLOGIN, non-superuser ownership role. Local development provisioning now uses PostgreSQL's `postgres` bootstrap role. |
| `0077` seeded an Anoman approval and enforcement policy. | Removed only those two migration-time business-authority inserts. Policy schema, immutability, derivation, ownership, and grants remain. |
| The final route-authority publisher compared account alias with provider ID. | `0090` now validates the `providerId` in the associated route tuple; the complete qualified tuple remains mandatory. |
| The NOLOGIN `atlas` SECURITY DEFINER publishers lacked their necessary predecessor privileges. | Added tightly scoped schema/table/function grants. `FOR KEY SHARE` predecessor reads receive the required lock privilege only through the NOLOGIN definer role. |
| Candidate publication could not invoke policy derivation without direct policy-table privilege. | The fail-closed policy derivation function is now Bridge-owned `SECURITY DEFINER` with a fixed trusted search path; policy rows remain Bridge-owned. |
| Integration fixtures assumed the removed policy seed or the retired string route-binder signature. | Tests now create production-shaped fixtures inside rollback transactions and bind immutable authority versions. |

No corrective successor migrations were created. No migration seeds qualification, policy approval, process/workload, candidate, release, activation, or runtime admission authority.

## Effective authority contract after the chain

| Object/boundary | Effective owner / setting |
|---|---|
| `bridge.qualified_provider_route_authority` | `atlas` |
| `bridge.calculated_class_process_allocation` | `atlas` |
| `bridge.desired_admission_profile_route_binding_v2` | `atlas` |
| `bridge.desired_admission_profile_candidate` | `atlas` |
| `publish_qualified_provider_route_authority(...)` | owner `atlas`, `SECURITY DEFINER` |
| `publish_shared_domain_calculated_desired_admission_profile(...)` | owner `atlas`, `SECURITY DEFINER` |
| `activate_desired_admission_profile(...)` | owner `agents_bridge`, not `SECURITY DEFINER`; shared-domain v2 activation fence retained |
| `derive_effective_enforcement_policy(...)` | owner `agents_bridge`, `SECURITY DEFINER`, fail-closed trusted derivation |

`agents_bridge` has no direct INSERT privilege on protected route-authority or calculated-allocation tables, but retains EXECUTE on the two publication functions. Missing policy yields `authorized enforcement policy is missing or stale`. The v2 planning snapshot remains non-permitting and preserves `maxEligibleCompleteRequestTokens = LEAST(process baseline TPM, max context tokens)`.

## Tests and evidence

Disposable PostgreSQL 18 cluster:

1. Fresh migration through `0111`: PASS.
2. Fresh-install metadata/authority contract: PASS.
3. Second migration run: `Atlas database migrations already up to date`.
4. Migration ledger check: PASS.
5. Authorized enforcement-policy provenance: PASS.
6. Calculated v2 candidate/snapshot: PASS.
7. Capacity-planning snapshot: PASS.
8. Fair Admission atomic dispatch: PASS.
9. Route-bound admission: PASS.
10. Runtime-capacity constraint read: PASS.
11. `@atlas/db` and `@atlas/agents-bridge` typechecks: PASS.

The separately run `semantic-batch-plan-ready-fixture` v3 test remains outside this scope: it fails before BSS use because its v3 fixture lacks an immutable reconstruction-policy binding. The BSS-dependent real accepted-source composition test in that file is retired/skipped. No unrelated IDSER behaviour was changed.

## Final development reset and state

After disposable acceptance, the verified Compose-owned local volume `ces-platform_postgres-data` was reset once. It is labeled as project `ces-platform`, volume `postgres-data`, and was mounted only by the stopped local Compose PostgreSQL container at verification time.

The clean development database `atlas_dev` was then migrated from zero and rechecked:

- migration: PASS;
- clean-install contract: PASS;
- idempotent second migration: PASS;
- migration check: PASS;
- ledger rows: 106.

Final BSS business-state counts:

| Entity | Count |
|---|---:|
| Anoman `provider_capacity_profile` | 1 |
| approvals, policies, revocations | 0 / 0 / 0 |
| qualified route authorities | 0 |
| process/workload profiles | 0 / 0 |
| desired profiles, allocations, candidates | 0 / 0 / 0 |
| activation history, active pointers | 0 / 0 |
| work attempts, reservations | 0 / 0 |

The retained seed is `anoman-shared-prod` version `2026-10-18.1`, with its minimal `{ routeId: anoman-semantic, providerId: anoman }` association. It is not qualification evidence or executable route authority.

## Files changed

- `.env.example` and local `.env`: PostgreSQL bootstrap connection uses `postgres`; protected `atlas` remains a distinct ownership role.
- `packages/atlas-db/migrations/0000_bss003_boundaries.sql`
- `packages/atlas-db/migrations/0077_bssv20060501_authorized_enforcement_policy_provenance.sql`
- `packages/atlas-db/migrations/0090_bssv20140201_qualified_tuple_publication_guard.sql`
- `packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql`
- `packages/atlas-db/tests/bss-fresh-install-contract.integration.test.ts`
- affected BSS/Bridge integration fixture tests and `packages/atlas-db/package.json`.

## Intentionally deferred

The baseline remains unconfigured by design. A future authorized scope must supply operator-driven profile succession, qualification evidence, explicit policy approval/revocation services, candidate publication orchestration, independent release attestation, guarded activation, and Admin/API/UI integration. No such lifecycle feature was implemented here.
