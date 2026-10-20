# CFC checkpoint: IDSER-012-05-04-01 / IDSER-BATCH-12-05-04-01 (002)

- **Remediation base:** post-CFC CK verification `project's goal/feedback/IDSER-BATCH-12-05-04-01-a47eaf7-verification.md` (`CHANGES_REQUIRED`).
- **Replacement freeze:** `project's goal/feedback/IDSER-BATCH-12-05-04-01-a47eaf7-replacement-contract-freeze.md`.
- **Original CK:** `project's goal/feedback/IDSER-BATCH-12-05-04-01-3f2bc03-review.md`.
- **Authorized CFC scope:** replacement `RCK-001.b` and original `CK-001.c` only.
- **HMN authorization consumed:** `HMN-IDSER-012-05-04-01-002` from `project's goal/feedback/IDSER-012-05-04-01-hmn-002.md`.
- **Checkpoint state:** `awaiting_review` after this one bounded evidence-remediation commit.

## Working closure view

| Authorized clause | Status | Frozen oracle evidence and outcome |
| --- | --- | --- |
| `RCK-001.b` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-v3-reference-resolution.integration.test.ts` uses the real `PostgresSemanticBatchV3ReferenceResolver` through `createSemanticBatchV3ReferenceReceivingBoundary` on persisted PostgreSQL rows. It proves service authentication precedes parsing/redemption, persisted source-derived scope, the bounded metadata-only output, and all frozen fail-closed categories. Before/after counts for pgboss jobs, BSS admissions/attempts/reservations, SEM executions/results, and reconciliation rows are equal. The replacement oracle passes; no interactive v3 API or session dependency was restored. |
| `CK-001.c` | `PROVEN` | The same isolated persisted test now includes explicit assertions for missing locator membership, substituted locator membership, corrupt inventory eligibility, and invalid batch membership/order. It preserves the prior plan/hash, source/cache, media, fingerprint, cancellation, and version/mixed negative assertions, plus the canonical positive redemption. The original frozen oracle passes. |

Protected rows remain unchanged: corrected `CK-001.a` is not reopened; historical `CK-001.b` remains historical and is not an active target; `RC-01205-0401-03` remains bounded metadata-only with no hydration, grants, or execution authority.

## Commands and outcomes

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution` — **PASS** (3 tests).
- In disposable Compose project `atlas-idser-012-05-04-01-test`, migrated a blank fixture at `127.0.0.1:15443/atlas_idser_012_05_04_01_test`; no canonical project or volume was mounted or reused.
- `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution-integration` with the isolated `DATABASE_URL` — **PASS** (1 test).
- The disposable project and volume were removed after test completion using its exact project name; canonical Safara services and volumes were untouched.
- `git diff --check` — **PASS**.

## Direct-regression boundary

Only the isolated v3 persisted-validation harness changed. No production resolver, receiving boundary, migrations, authenticated API, worker, GHR delivery, queue, BSS admission, provider, SEM, hydration, result, reconciliation, or canonical-volume behavior changed.

Internal readiness: READY_FOR_CK

## CK handoff

Verify only replacement `RCK-001.b` under the replacement freeze and original `CK-001.c` under the original CK closure matrix, along with this bounded test diff and its direct regressions. The next workflow command is `ck`.
