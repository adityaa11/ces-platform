# BSS Scope 01A — Fresh-DB Contract Blocker Diagnostic Result

**Date:** 2026-10-29  
**Mode:** diagnostic / decision gate only. No repository code, migration, or configuration changes were made.  
**Outcome:** Scope 01A evidence collection is complete. Scope 01B is **NO-GO** until the listed installer and authority-design decisions are approved.

## 1. Repository baseline

- **Branch / SHA:** `codex/new-atlas-backend` / `343c9ad8b0763c7fba985892136638a31223b539`.
- **Working tree:** dirty before the audit; preserved unchanged.
- **Migration entry point:** `pnpm --filter @atlas/db migrate` -> `packages/atlas-db/scripts/migrate.mjs`.
- **Package:** `@atlas/db` version `0.1.0`.
- **Database evidence:** a uniquely named disposable PostgreSQL `18.6` container was created, used, and removed. No existing database was accessed.

## 2. Current effective contract

```text
fresh DB
  -> migration runner (migration ledger checks names only)
  -> 0076 inserts the allowed Anoman capacity profile
  -> 0077 creates policy schema/deriver and inserts approval + policy
  -> downstream planning derives the effective enforcement policy
  -> 0088 fails because it assigns ownership to an absent `atlas` role
```

`0076` is the allowed profile seed at `0076_bssv200501_anoman_capacity_profile.sql:19-49`. `0077` inserts the prohibited approval and policy at `0077_bssv20060501_authorized_enforcement_policy_provenance.sql:195-212`.

## 3. Contract blocker register

| ID | Status | Evidence and disposition |
|---|---|---|
| CB-01 | **CONFIRMED** | The actual runner inserted one Anoman approval and one policy from `0077`. This is the Scope 01 contract amendment. |
| CB-02 | **CONFIRMED** | `0077:5-193` contains schema, immutability, derivation, and grants; `0077:195-212` contains separately removable authority data issuance. |
| CB-03 | **CONFIRMED** | `migrate.mjs` uses an ordered explicit array and `atlas.schema_migrations.name` only. There is no checksum, digest, baseline marker, or conditional manifest. Changing an applied file body does not re-run it. |
| CB-04 | **CONFIRMED (static)** | Existing `0077` records are immutable and restrict-referenced. They must survive unchanged. Full upgrade simulation is blocked by the fresh-installer defect below. |
| CB-05 | **CONFIRMED** | A transactional disposable fixture with a profile but no approval/policy raised exactly `authorized enforcement policy is missing or stale`; the transaction rolled back. |
| CB-06 | **NOT REPRODUCED in production code** | Exact seeded Anoman approval/policy IDs occur in `0077` and test code, not Bridge/Admin production source. |
| CB-07 | **CONFIRMED** | Seed-dependent tests were identified; they need explicit fixtures or unconfigured-state assertions in a later authorized scope. |
| CB-08 | **NO-GO** | There is no fresh-install target-state test, and the real runner cannot complete on a pristine DB. |
| CB-09 | **CONFIRMED** | `0076`'s route tuple is incomplete for `0090`; its account alias also differs from provider ID. This is a later onboarding scope, not a Scope 01 fix. |
| CB-10 | **UNVERIFIED end-to-end** | Static SQL preserves the activation fence and non-permit snapshot semantics, but the installer stops before later migrations. |
| CB-11 (new) | **CONFIRMED** | Fresh migration halts at `0088_bssv20140201_model_bound_route_authority.sql:117`: `ALTER TABLE ... OWNER TO atlas`, while no preceding migration creates role `atlas`. |

The fail-closed policy deriver is defined at `0077:91-193`; it rejects a missing/stale policy at `0077:127`.

## 4. Migration data classification

| Class | Observed material |
|---|---|
| S1 — schema | `0077` policy tables, constraints, immutability triggers, derivation, and grants. |
| S2 — infrastructure | `atlas.schema_migrations`, roles/grants, pg-boss bootstrap. |
| S3 — allowed seed | The single Anoman provider profile in `0076`. |
| S4 — prohibited seed | The Anoman approval and policy inserted by `0077`. |
| S5 — runtime transactional writes | Function-owned publication/activation writes in `0078` and `0091`. |
| S6 — test fixtures | Explicit profile/policy inserts in integration tests. |
| S7 — historical/retired | Conditional legacy route-authority conversion in `0038`; it produced no authority row in the disposable run. |
| S8 — implicit dependencies | `0076` tuple incompleteness, alias/provider mismatch, and the undeclared `atlas` ownership role. |

## 5. Actual fresh-DB counts

The actual runner recorded 82 migrations through `0087`, including `0077`, then failed at `0088`.

| Entity | Observed | Required target |
|---|---:|---:|
| `provider_capacity_profile` | 1 | 1 |
| `provider_enforcement_policy_approval` | 1 | 0 |
| `provider_enforcement_policy` | 1 | 0 |
| `provider_enforcement_policy_revocation` | 0 | 0 |
| `qualified_provider_route_authority` | 0 | 0 |
| process / workload profiles | 0 / 0 | 0 / 0 |
| desired / active profiles / activation history | 0 / 0 / 0 | 0 / 0 / 0 |
| calculated allocation / candidate | table not installed | 0 / 0 |

The one profile was exactly `anoman-shared-prod:2026-10-18.1`, with alias `anoman-atlas-free-account` and route association `{ routeId: anoman-semantic, providerId: anoman }`.

The intended fresh state is therefore not currently reachable.

## 6. Existing DB compatibility

Do **not** edit `0077` in place. The runner will skip it for existing databases because its name is already recorded, and no checksum validates content. Existing approval/policy rows are protected by foreign keys, `ON DELETE RESTRICT`, and immutable triggers in `0077:17-69`.

Any approved solution must preserve deployed historical authority records and make the fresh/upgrade distinction explicit and auditable.

## 7. Recommended bootstrap amendment design

Recommend a versioned, explicit **fresh-install baseline manifest/installer path**:

1. A new database installs equivalent schema/function contracts, preserves `0076`, and omits only `0077`'s approval/policy inserts.
2. Existing databases retain the normal historical name-ledger upgrade path without deletes or rewrites.
3. The fresh baseline records an auditable, safe migration-equivalence identity so historical migrations are not replayed later.
4. Selection is structural/ledger-based only; it is never a mutable environment flag.

Rejected approaches:

- changing `0077` in place;
- later cleanup that first issues then deletes authority;
- application-startup default policy creation; and
- an environment switch that controls authority issuance.

The missing `atlas` role is a separate installer prerequisite. Its ownership/creation contract must be explicitly decided before the fresh baseline can be proven.

## 8. Scope 01B proposal

Do not start Scope 01B until approval. Its smallest authorized file/test set should cover only:

1. `packages/atlas-db/scripts/migrate.mjs`: deterministic fresh-install versus upgrade selection.
2. A reviewed static fresh-baseline representation retaining `0077` schema/deriver but excluding `0077` authority DML.
3. A disposable PostgreSQL migration integration test asserting row counts and migration-ledger state.
4. Explicit test setup or unconfigured assertions for:
   - `packages/atlas-db/tests/authorized-enforcement-policy-provenance.integration.test.ts`;
   - `apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts`; and
   - `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts`.
5. A separately authorized resolution of the `atlas` role prerequisite, without lifecycle refactoring.

Proposed behavior only:

```text
if migration ledger is absent:
  install approved fresh baseline
  record safe migration-equivalence identity
else:
  run the normal pending-name upgrade path
```

## 9. Exit contract

A future fresh-install PASS requires exactly one `0076` Anoman profile and zero policy approvals, policies, revocations, route authorities, process/workload profiles, plans, allocations, candidates, activation history, active pointers, and runtime reservations.

Missing policy is a valid unconfigured, fail-closed state. The next consumers remain future A01 profile versioning, A03 qualification, and A05 explicit policy approval.

## 10. GO / NO-GO checklist

### Evidence supporting the direction

- Prohibited `0077` authority issuance was reproduced through the real runner.
- Schema/derivation can be retained independently from the two seed inserts.
- Empty-policy derivation fails closed.
- No production Bridge/Admin hardcoded fallback was found.
- Focused isolated checks passed: 19 tests, 0 failures.

### Current NO-GO blockers

- A pristine migration fails at `0088` due to missing role `atlas`.
- No approved baseline/ledger strategy distinguishes fresh installations from historical upgrades.
- No end-to-end fresh-install target-state test exists.
- Later activation/snapshot regression cannot run until the installer reaches those migrations.

### Required approval

Authorize the fresh-baseline ledger design and decide the ownership/creation contract for role `atlas` before writing Scope 01B.
