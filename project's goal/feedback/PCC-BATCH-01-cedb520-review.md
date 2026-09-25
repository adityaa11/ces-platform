# Review: PCC-BATCH-01

- Ticket / batch: `PCC-001` / `PCC-BATCH-01`
- Reviewed commit: `cedb52092c9a66713dac9ffee14365feeafa440f` (`fix(atlas): remediate PCC-001 CK-001 and CK-002`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-001-atlas-project-domain-and-persistence.md` at `df594cb`; baseline anchors `SRC-PCC-01` through `SRC-PCC-04`
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-01-df594cb-review-session-3-round-1.md`
- Remediation commit: `cedb52092c9a66713dac9ffee14365feeafa440f`
- Result: `PASS`
- Convergence: `IMPROVING`

## Evidence

- PCC-001 remains `awaiting_review` and the checkout `HEAD` is the recorded remediation commit. The working tree contains only untracked review/context documents; no tracked or in-scope implementation changes are present.
- The remediation delta is bounded to `0008_pcc001_document_workspace_integrity.sql`, the migration runner's ordered migration list, and the project-repository integration test. It does not alter Atlas Core authority, BSS migrations, fixture authority, routes, DocumentStore behavior, or perception execution.
- `0008` adds a unique `(project_id, id)` key on `atlas.workspace` and a composite foreign key from `atlas.document(project_id, workspace_id)`. The integration test inserts a workspace for a different project and verifies the cross-project document insert is rejected.
- The integration test also verifies that `atlas.document` exposes no `bytea` column and that persisted source data remains metadata (`storage_key`, digest, byte size, and media type), resolving `REV-READY-PCC-001-03`'s negative metadata evidence requirement.
- Security readiness bindings remain satisfied: Atlas Core stays persistence-neutral; project listing remains membership-scoped in PostgreSQL; Better Auth remains the identity authority; storage keys and source digests remain server-side metadata; raw bytes, filesystem paths, fixture state, client transport, and Bridge writes are not introduced.
- Compose PostgreSQL reported `Up (healthy)`.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migrate`: passed. The migration was run again on the same Compose database and passed again; expected existing-object notices were emitted.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check`: passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core --filter @atlas/db typecheck`: both package typechecks passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core test`: 12 passed, 0 failed, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository`: 1 passed, 0 failed, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:permissions`: 1 passed, 0 failed, 0 skipped.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:perception-authority`: 1 passed, 0 failed, 0 skipped.
- `git diff --check HEAD^ HEAD`: passed.
- Environment limitation: this round revalidated migration idempotence against the existing healthy Compose database; no fresh empty-database bootstrap was run.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-001 document metadata must preserve a consistent project/workspace relation; `SEAM-PCC-001-03` requires a stable handoff identity. | `packages/atlas-db/migrations/0008_pcc001_document_workspace_integrity.sql:10-17`; `packages/atlas-db/tests/project-repository.integration.test.ts:33-35` | The composite foreign key now binds `document(project_id, workspace_id)` to `workspace(project_id, id)`. The Compose repository test passed while rejecting a cross-project attachment. | Enforce the project/workspace pair at the database boundary and prove rejection of cross-project attachment. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-001 validation and `REV-READY-PCC-001-03` require negative evidence that raw PDF bytes are absent from Atlas persistence. | `packages/atlas-db/tests/project-repository.integration.test.ts:29-32` | The Compose repository test passed while verifying the persisted metadata projection and an empty `bytea` column result for `atlas.document`. | Add a PostgreSQL-backed assertion proving raw source bytes cannot be stored in Atlas document rows. |

## Advisory observations

None.

## Decision

The remediation resolves CK-001 and CK-002, preserves the frozen PCC-001 scope and authority boundaries, and satisfies the mandatory security-readiness bindings and authoritative Compose validation obligations for this checkpoint. No blocking findings remain. `PCC-BATCH-01` receives `PASS` at Round 2.
