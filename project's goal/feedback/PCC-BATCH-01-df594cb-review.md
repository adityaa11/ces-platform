# Review: PCC-BATCH-01 - Atlas project domain and persistence

- Reviewed commit: `df594cb` (`feat(atlas): add project persistence boundary`)
- Baseline: [PCC-001 ticket](../Backend_Phase/tickets/Project_Cards_Phase/PCC-001-atlas-project-domain-and-persistence.md); [Project Cards ticket set](../Backend_Phase/tickets/Project_Cards_Phase/README.md); [Backend Phase README](../Backend_Phase/README.md); approved BSS-003, BSS-004, and BSS-007 checkpoints; `REV-READY-PCC-001-01` through `REV-READY-PCC-001-03`
- Ticket / batch: `PCC-001` / `PCC-BATCH-01`
- Result: `INCONCLUSIVE`
- Review round: 1

## Evidence

- The checkpoint adds persistence-neutral project contracts in `packages/atlas-core` and keeps SQL in `packages/atlas-db`. The project repository creates the project, owner membership, Master, Initial Draft, and document rows inside one PostgreSQL transaction.
- `listAccessibleTo` filters in PostgreSQL through `project_member`; its result omits storage keys and source digests. The additive migration preserves the existing BSS tables, stores metadata rather than source bytes, restricts membership to `owner`, and revokes Atlas table access from `agents_bridge`.
- The code does not add an upload route, DocumentStore call, perception job, or fixture-backed production behavior, consistent with PCC-001's scope.
- `git diff --check HEAD^ HEAD` passed. Compose PostgreSQL reported `healthy`.
- The prescribed `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migrate` did not reach the migration command. The image build remained in `pnpm install` while downloads for optional platform packages (including `@cloudflare/workerd-linux-64`) failed and retried; the `workerd` postinstall fallback then stalled. The attempt was stopped. No migration, typecheck, or test result is claimed.
- The mandatory `references/security-refactor-readiness.md` referenced by the applicable review instructions could not be found in the project skill directory or the installed skill cache. The project skill directory contains only `SKILL.md`, so the mandatory extension could not be applied.

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | P2 | `packages/atlas-db/migrations/0007_pcc001_atlas_project_domain.sql:31-32` | Persist a consistent document-to-project/workspace relation. | `IMPLEMENTATION_DEFECT` | The document's `project_id` and `workspace_id` have independent foreign keys. PostgreSQL therefore accepts a document whose project is A while its workspace belongs to project B. Add a composite relationship constraint (or equivalent database enforcement) and a repository/database assertion proving cross-project attachment is rejected. |

## Review blockers

- The required security-refactor-readiness extension is unavailable, so the mandatory review bindings cannot be fully discharged.
- The checkpoint has no recorded implementation validation results, and the authoritative Compose migration, typecheck, and test commands did not run because the image dependency installation stalled. The ticket set requires service health, exact commands, counts/skips, and environment limitations to be recorded for each implementation checkpoint.

## Decision

The review found one in-scope persistence-integrity defect. The checkpoint cannot receive `PASS`; the overall review remains `INCONCLUSIVE` until the mandatory extension and prescribed Compose validation can be completed. Keep `PCC-001` at `awaiting_review` and do not start dependent PCC tickets from this checkpoint.
