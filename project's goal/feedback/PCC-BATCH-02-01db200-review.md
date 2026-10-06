# Review: PCC-BATCH-02

- Ticket / batch: `PCC-002` / `PCC-BATCH-02`
- Reviewed commit: `01db200d862f965dc0b68e3b7d5796d973bb0154` (`feat(atlas): add PCC-002 project creation service`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-002-document-store-backed-project-creation.md`; source anchors `SRC-PCC-02` through `SRC-PCC-04`
- Review round: 1
- Maximum review rounds: 3
- Prior review: None
- Remediation commit: None
- Result: `CHANGES_REQUIRED`
- Convergence: Not applicable (Round 1)

## Evidence

- The ticket is `awaiting_review`, and the reviewed `HEAD` is the committed PCC-002 implementation checkpoint. `git status --short --branch` shows no tracked or in-scope implementation changes; the remaining untracked files are unrelated prior review/context documents.
- Dependencies are satisfied: BSS-007 is `approved`, and PCC-001 records a `PASS` review at `cedb520`.
- `git diff --check HEAD` passed.
- `docker compose up -d postgres` completed with the existing PostgreSQL container running. `docker compose ps` reported PostgreSQL `healthy`.
- The authoritative command `node .agents/skills/ck/scripts/run-compose-checks.mjs --service atlas --checks-json '[{"name":"migration check","args":["corepack","pnpm","--filter","@atlas/db","migration:check"]},{"name":"permissions tests","args":["corepack","pnpm","--filter","@atlas/db","test:permissions"]},{"name":"core typecheck","args":["corepack","pnpm","--filter","@atlas/core","typecheck"]},{"name":"core tests","args":["corepack","pnpm","--filter","@atlas/core","test"]},{"name":"document-store typecheck","args":["corepack","pnpm","--filter","@atlas/document-store","typecheck"]},{"name":"document-store tests","args":["corepack","pnpm","--filter","@atlas/document-store","test"]},{"name":"db typecheck","args":["corepack","pnpm","--filter","@atlas/db","typecheck"]},{"name":"project repository integration","args":["corepack","pnpm","--filter","@atlas/db","test:project-repository"]}]' --tail-bytes 16000` built the `atlas` image once and reported `Summary: 9 passed, 0 failed`.
- Exact Compose test counts captured after the build: `@atlas/core` 15 passed, 0 skipped; `@atlas/document-store` 3 passed, 0 skipped; `@atlas/db` permissions 1 passed, 0 skipped; `@atlas/db` project repository integration 1 passed, 0 skipped. All exited 0.
- The initial host-local package attempts were not used as evidence because pnpm attempted to recreate dependencies and registry access was denied. The initial unprivileged Docker call could not access the Docker engine pipe; the authoritative Compose checks succeeded after the managed Docker access retry.
- The ticket declares Security Refactor Readiness applicable. The review applied the mandatory bindings for source-write ordering, injected DocumentStore/repository seams, downstream-side-effect prohibition, identity/authority preservation, and the explicitly unresolved orphan-cleanup policy.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-002 acceptance requires a failed PostgreSQL transaction to leave no visible partial project; Validation and `REV-READY-PCC-002-01` require storage/database failure tests. | `packages/atlas-core/tests/project-creation.test.ts:29-42`; `packages/atlas-db/tests/project-repository.integration.test.ts:45-57` | The unit suite proves a fake `DocumentStore.put` failure and exercises a synthetic duplicate error, but it does not exercise a non-conflict repository/transaction failure after source storage and assert that project, membership, workspace, and document rows are absent. The integration path covers only success and duplicate preflight. | Add a DB-backed transaction-failure test (or controlled SQL failure) that stores source bytes, forces the Atlas transaction to fail after partial insert work, and proves no project graph or document metadata is visible. Keep the service-level ordering assertion. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-002 Validation requires bounded service-boundary rejection coverage for invalid metadata, empty/invalid files, per-file and total limits, and bounded file count. | `packages/atlas-core/tests/project-creation.test.ts:29-42` | The committed unit tests cover one invalid ID/signature case, storage failure, preflight conflict, and a synthetic database conflict. They do not cover missing/overlong name or description, empty sources, wrong media type, zero bytes, a file over 20 MiB, more than 10 files, total input over 100 MiB, or inconsistent DocumentStore metadata. The implementation has branches for these cases, but the required evidence that each rejection occurs before source storage is absent. | Add table-driven boundary tests for every declared rejection, including “no `put` and no repository activity” assertions where validation should stop the operation. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-002 acceptance requires one committed project graph and no perception/extraction/semantic/review/CES/publication state; Validation and `REV-READY-PCC-002-03` require negative integration assertions and queue/table inspection. | `packages/atlas-db/tests/project-repository.integration.test.ts:45-57` | The service integration path verifies one document’s bytes, hash, size, media type, and one `document_perception_execution` count. It does not verify the service-created owner membership, empty Master, Initial Draft, or all source metadata rows, and it does not inspect source grants, normalized/derived perception state, downstream semantic/review/CES/publication state, or `pgboss`/queue tables. | Extend the service integration test to assert the complete committed graph for multiple PRDs and zero rows/jobs across every declared downstream state and queue boundary. |

## Advisory observations

- `isUniqueViolation` maps every PostgreSQL `23505` or duplicate-message error to the stable project-ID conflict. A future refinement could constrain this mapping to the stable-ID uniqueness constraint so unrelated uniqueness failures are not mislabeled.
- Orphaned source cleanup remains deferred as the ticket’s explicit `SEC-GAP-PCC-002-01`; the review does not treat that policy as a defect.

## Decision

The implementation preserves the accepted Atlas/DocumentStore authority split, stores all sources before the repository transaction, uses the database uniqueness constraint for the race-safe conflict boundary, and passed the authoritative Compose checks. It does not yet satisfy the ticket’s mandatory failure, bounded-validation, and downstream-negative evidence obligations. Keep PCC-002 at `awaiting_review`; the three open implementation findings are eligible for a bounded CFC remediation, and PCC-003 must not advance.
