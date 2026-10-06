# Review: PCC-BATCH-02

- Ticket / batch: `PCC-002` / `PCC-BATCH-02`
- Reviewed commit: `389494a999fecb1905de3aaa9cefa99f2fb27774` (`fix(atlas): remediate PCC-002 CK-002 CK-003`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-002-document-store-backed-project-creation.md`; source anchors `SRC-PCC-02` through `SRC-PCC-04`
- Review round: 3
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-02-78f27c1-review.md`
- Remediation commit: `389494a999fecb1905de3aaa9cefa99f2fb27774`
- Result: `PASS`
- Convergence: `IMPROVING`

## Evidence

- The ticket remains `awaiting_review`. The reviewed `HEAD` is the committed Round 3 remediation. The working tree contains no tracked or in-scope implementation changes; only untracked review/context documents are present.
- The Round 3 delta is bounded to the oversized-request fixture and the pg-boss negative integration assertion. It does not change the accepted authority, identity, DocumentStore, transaction, or downstream execution boundaries.
- `git diff --check 78f27c15700ffa9b77ff760551b3c1e7b5621c7e..HEAD` passed.
- `docker compose up -d postgres` reported the service running, and `docker compose ps` reported PostgreSQL `healthy`.
- The first `docker compose build --quiet atlas` attempt hit a Docker Hub metadata timeout before validation. The immediate retry completed successfully. The bounded command `node .agents/skills/ck/scripts/run-compose-checks.mjs --service atlas --no-build --checks-json '[{"name":"migration check","args":["corepack","pnpm","--filter","@atlas/db","migration:check"]},{"name":"permissions tests","args":["corepack","pnpm","--filter","@atlas/db","test:permissions"]},{"name":"core typecheck","args":["corepack","pnpm","--filter","@atlas/core","typecheck"]},{"name":"core tests","args":["corepack","pnpm","--filter","@atlas/core","test"]},{"name":"document-store typecheck","args":["corepack","pnpm","--filter","@atlas/document-store","typecheck"]},{"name":"document-store tests","args":["corepack","pnpm","--filter","@atlas/document-store","test"]},{"name":"db typecheck","args":["corepack","pnpm","--filter","@atlas/db","typecheck"]},{"name":"project repository integration","args":["corepack","pnpm","--filter","@atlas/db","test:project-repository"]}]' --tail-bytes 16000` reported `Summary: 8 passed, 0 failed` against the rebuilt image.
- Exact Compose test counts: `@atlas/core` 17 passed, 0 skipped; `@atlas/document-store` 3 passed, 0 skipped; `@atlas/db` permissions 1 passed, 0 skipped; `@atlas/db` project repository integration 1 passed, 0 skipped. All exited 0.
- The repository integration test emitted only harmless PostgreSQL `NOTICE` messages from repeated conditional cleanup of the controlled failure trigger/function; the test passed.
- The Round 3 security-readiness verification remained bounded to the unresolved transaction visibility and downstream-side-effect bindings. No new authority, identity, storage-path, or security-policy coupling was introduced.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-002 acceptance requires a failed PostgreSQL transaction to leave no visible partial project; `REV-READY-PCC-002-01` requires storage/database failure evidence. | `packages/atlas-db/tests/project-repository.integration.test.ts:72-78` | The committed controlled workspace-insert failure runs after source storage and partial graph insert work, then asserts zero project, membership, workspace, and document rows. The Compose integration test passed. | Keep the rollback assertion in the regression suite. |
| CK-002 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | RESOLVED | PCC-002 Validation requires bounded total-request rejection evidence. | `packages/atlas-core/tests/project-creation.test.ts:10,42`; `packages/atlas-core/src/project-creation.ts:56-58` | The oversized-request case now uses a five-byte `%PDF-` payload after two 20 MiB valid-signature sources, so the total is 40 MiB plus 5 bytes and reaches the `maxProjectRequestBytes` rejection branch. The core suite passed 17/17. | Keep the valid-signature oversized-request regression test. |
| CK-003 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | RESOLVED | PCC-002 requires no queue/downstream side effects; Validation and `REV-READY-PCC-002-03` require queue/table inspection. | `packages/atlas-db/tests/project-repository.integration.test.ts:68-75` | The integration test preserves zero-change Atlas/Bridge effect counts and now resolves `pgboss.job` when present, asserting zero `atlas-document-perception-v1` jobs whose data contains the test project ID; absent pg-boss initialization is handled explicitly. The repository integration passed. | Keep the queue-negative assertion alongside the Atlas/Bridge checks. |

## Advisory observations

- The Round 3 test cleanup produces harmless PostgreSQL notices because the trigger/function are explicitly dropped before the `finally` block repeats conditional cleanup. This does not affect correctness or the review result.
- The ticket’s orphan-object cleanup policy remains explicitly unresolved and is not part of this PASS decision.

## Decision

All Round 1 blocking findings are resolved with concrete committed evidence. The PCC-002 service preserves the accepted Atlas/DocumentStore authority split, validates bounded PDF input, stores every source before one atomic Atlas transaction, maps duplicate IDs safely, proves rollback non-visibility, persists the complete owner/Master/Initial Draft/document graph, and creates no downstream perception or queue state. Mandatory Compose validation and security-readiness bindings pass for the reviewed commit. `PCC-BATCH-02` receives `PASS` at the final allowed review round. No further CK/CFC round may be started for this session; the ticket may proceed through the project’s GO/approval workflow.
