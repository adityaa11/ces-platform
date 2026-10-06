# Review: PCC-BATCH-01

- Ticket / batch: `PCC-001` / `PCC-BATCH-01`
- Reviewed commit: `df594cb2883890ff8216175e82329e985f23aa71`
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-001-atlas-project-domain-and-persistence.md` at `df594cb`; baseline anchors `SRC-PCC-01` through `SRC-PCC-04`
- Review round: 1 (new session explicitly authorized by the user)
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-01-df594cb-review.md` (legacy `INCONCLUSIVE`); preflight: `project's goal/feedback/PCC-BATCH-01-df594cb-preflight-review.md`
- Remediation commit: None
- Result: `BLOCKED`

## Evidence

- Reviewed the committed PCC-001 ticket, changed package sources, migration, and tests at `df594cb`. `git diff --stat df594cb HEAD -- packages/atlas-core packages/atlas-db pnpm-lock.yaml` was empty; the current `HEAD` is a later documentation-only commit. The worktree contains untracked review/context documents but no changed implementation files.
- The core contract keeps SQL/database details outside `@atlas/core`. `PostgresAtlasProjectRepository.create` creates the project, owner membership, Master, Initial Draft, and documents in one PostgreSQL transaction. Project ID uniqueness and format are enforced in the migration; the source context defines the same 3–48 lowercase letter/number/hyphen rule.
- `listAccessibleTo` joins `atlas.project_member` for the supplied user ID in PostgreSQL and returns no storage key, filename, or source digest. The additive migration is numbered `0007`, creates metadata-only tables, and revokes `agents_bridge` table access. No route, DocumentStore call, fixture authority, pg-boss job, or perception operation is introduced in this commit.
- Security readiness bindings applied:
  - `REV-READY-PCC-001-01`: the core repository contract accepts server-side source metadata without importing Drizzle or DocumentStore internals; the DB adapter owns the atomic Atlas transaction.
  - `REV-READY-PCC-001-02`: the authorization query is membership-scoped in SQL; the committed integration test covers listing by two different user IDs, but was not executed.
  - `REV-READY-PCC-001-03`: the migration has no source-byte or filesystem-path column, and the listing projection omits storage keys and hashes. The repository input is an internal server-side contract; this commit adds no client route or client-controlled storage flow.
- The migration has separate foreign keys for `atlas.document.project_id` and `atlas.document.workspace_id`, without a constraint that both refer to the same project. A row can therefore name project A while attaching to a workspace owned by project B. The repository's normal create path uses its new Initial Draft workspace, but the database boundary itself permits inconsistent document metadata.
- Validation evidence is unavailable. The committed test files exist, but no test counts or results are recorded in the checkpoint. In this review, `docker compose ps` failed because the Docker engine pipe `//./pipe/docker_engine` is unavailable (the Docker config file was also inaccessible). The prior legacy artifact records PostgreSQL as healthy, but its prescribed Compose migration invocation stalled during `pnpm install` while optional package downloads retried; it reports no migration, typecheck, or test result. No authoritative Compose validation was run in this review.
- Commands run in this review: `git show --format=fuller --stat df594cb`; `git show df594cb:<affected source path>` for the ticketed package sources, migration, and tests; `git diff --stat df594cb HEAD -- packages/atlas-core packages/atlas-db pnpm-lock.yaml`; `git diff --check df594cb^ df594cb` (no errors); `docker compose ps` (Docker engine unavailable). No tests, migration, or typecheck were run.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-001 requires each document to have a consistent project/workspace relation; `SEAM-PCC-001-03` requires source metadata suitable for the later BSS-009 handoff. | `packages/atlas-db/migrations/0007_pcc001_atlas_project_domain.sql:29-32` | `project_id` references `atlas.project(id)` and `workspace_id` independently references `atlas.workspace(id)`. PostgreSQL accepts a document with project A and a workspace belonging to project B; `listAccessibleTo` joins documents through the workspace and can count that inconsistent row under B. | Enforce the project/workspace pair at the database boundary (for example, a composite foreign key from `(project_id, workspace_id)` to a unique `(project_id, id)` workspace key), and add a PostgreSQL assertion that cross-project attachment is rejected. |

## Advisory observations

None.

## Decision

The mandatory Compose migration, typecheck, and test evidence cannot be established in this environment, so the overall result is `BLOCKED` even though CK-001 is an implementation-repairable defect. This review is Round 1 of the explicitly authorized new session; it does not treat the legacy `INCONCLUSIVE` artifact as a prior CK round or erase it. Keep PCC-001 at `awaiting_review`; this checkpoint has not received PASS.
