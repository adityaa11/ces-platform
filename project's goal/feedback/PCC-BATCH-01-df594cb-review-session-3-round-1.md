# Review: PCC-BATCH-01

- Ticket / batch: `PCC-001` / `PCC-BATCH-01`
- Reviewed commit: `df594cb2883890ff8216175e82329e985f23aa71`
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-001-atlas-project-domain-and-persistence.md` at `df594cb`; baseline anchors `SRC-PCC-01` through `SRC-PCC-04`
- Review round: 1 (fresh session explicitly authorized by the user)
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-01-df594cb-review-session-2-round-1.md` (`BLOCKED`); legacy review: `project's goal/feedback/PCC-BATCH-01-df594cb-review.md` (`INCONCLUSIVE`)
- Remediation commit: None
- Result: `CHANGES_REQUIRED`

## Evidence

- Reviewed the frozen PCC-001 ticket and implementation sources at `df594cb`. `git diff --stat df594cb HEAD -- packages/atlas-core packages/atlas-db pnpm-lock.yaml` is empty; the later current `HEAD` changes documentation only. The worktree has untracked review/context documents, with no implementation changes.
- BSS-003, BSS-004, and BSS-007 are marked `approved`. The migration is additive and numbered `0007`; it creates Atlas metadata tables, keeps source bytes outside those tables, and revokes `agents_bridge` table access. Core contracts contain no database implementation dependency.
- `PostgresAtlasProjectRepository.create` inserts the project, owner membership, Master, Initial Draft, and document metadata in one transaction. `listAccessibleTo` joins `atlas.project_member` in PostgreSQL and omits storage keys, filenames, and source hashes from its result.
- Security readiness bindings applied:
  - `REV-READY-PCC-001-01`: the core interface accepts source metadata without importing Drizzle or DocumentStore details; the database adapter owns one atomic Atlas transaction.
  - `REV-READY-PCC-001-02`: project listing is scoped by membership in SQL; the repository integration test checks owner access and isolation from a second user.
  - `REV-READY-PCC-001-03`: schema review confirms the Atlas document table has no source-byte or filesystem-path field and the listing projection omits storage metadata. The committed integration test does not explicitly assert the absence of raw source bytes; see CK-002.
- The document table has separate foreign keys for `project_id` and `workspace_id`, but no constraint that the selected workspace belongs to the same project. The normal repository create path supplies its new Initial Draft workspace, yet the database accepts an inconsistent cross-project relation; see CK-001.
- Compose PostgreSQL was healthy (`docker compose ps`: `Up (healthy)`). The migration runner succeeded twice against the Compose database, with existing-object notices on reapplication; `migration:check` passed and confirmed the sequence through PCC-001. These runs verified reapplication against the current database; they were not a fresh empty-database bootstrap.
- `@atlas/core` and `@atlas/db` typechecks passed. `@atlas/core test` passed 12 tests, 0 failed, 0 skipped. `@atlas/db test:project-repository`, `test:permissions`, and `test:perception-authority` each passed 1 test, 0 failed, 0 skipped. Total: 15 passed, 0 failed, 0 skipped.
- The repository integration test proves duplicate stable-ID rejection, owner membership-based access, two-user isolation, expected metadata persistence, and absence of a perception execution row. Its metadata query selects only `storage_key`, `source_sha256`, `byte_size`, and `media_type`; it does not assert that raw PDF bytes cannot be persisted in Atlas rows.
- Commands run for validation: `docker compose up -d postgres`; `docker compose ps`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migrate` (twice); `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core --filter @atlas/db typecheck`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core test`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:permissions`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository`; `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:perception-authority`; `git diff --check df594cb^ df594cb` (no errors).

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-001 requires a consistent document-to-project/workspace relation; `SEAM-PCC-001-03` requires metadata suitable for the later BSS-009 handoff. | `packages/atlas-db/migrations/0007_pcc001_atlas_project_domain.sql:29-32` | `project_id` references `atlas.project(id)` while `workspace_id` independently references `atlas.workspace(id)`. PostgreSQL accepts a document for project A attached to a workspace for project B; the listing query can then count that row under B through the workspace join. | Enforce the pair at the database boundary, such as a composite foreign key from `(project_id, workspace_id)` to a unique `(project_id, id)` key on `atlas.workspace`, and add a PostgreSQL assertion that cross-project attachment is rejected. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-001 validation requires a PostgreSQL-backed assertion proving raw PDF bytes are absent from Atlas rows; `REV-READY-PCC-001-03` requires negative metadata evidence. | `packages/atlas-db/tests/project-repository.integration.test.ts:27-29` | The integration test selects and compares four metadata columns, then checks no perception execution exists. It never asserts that source bytes cannot be persisted in Atlas rows. The schema has no byte column, but the required negative test evidence is missing. | Add a PostgreSQL-backed assertion that verifies raw source bytes cannot be stored in Atlas document rows (for example, assert the schema exposes no raw-byte column and verify only metadata is persisted). |

## Advisory observations

None.

## Decision

The required Compose validation is now available and passed; no planning or knowledge blocker remains. Two implementation-repairable findings remain open, so the result is `CHANGES_REQUIRED`. This is Round 1 of the fresh user-authorized session; the prior blocked and legacy artifacts remain preserved.
