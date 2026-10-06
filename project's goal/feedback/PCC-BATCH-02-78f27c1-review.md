# Review: PCC-BATCH-02

- Ticket / batch: `PCC-002` / `PCC-BATCH-02`
- Reviewed commit: `78f27c15700ffa9b77ff760551b3c1e7b5621c7e` (`fix(atlas): remediate PCC-002 CK-001 CK-002 CK-003`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-002-document-store-backed-project-creation.md`; source anchors `SRC-PCC-02` through `SRC-PCC-04`
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-02-01db200-review.md`
- Remediation commit: `78f27c15700ffa9b77ff760551b3c1e7b5621c7e`
- Result: `CHANGES_REQUIRED`
- Convergence: `IMPROVING`

## Evidence

- The ticket remains `awaiting_review`. The reviewed `HEAD` is the committed remediation after the prior Round 1 `CHANGES_REQUIRED` result. The working tree contains no tracked or in-scope implementation changes; only untracked review/context documents are present.
- The remediation delta is bounded to `packages/atlas-core/src/project-creation.ts`, the core project-creation tests, and the project-repository integration test. It does not change the accepted DocumentStore contract, Atlas authority boundary, or downstream execution code.
- `git diff --check 01db200d862f965dc0b68e3b7d5796d973bb0154..HEAD` passed.
- `docker compose up -d postgres` reported the service running, and `docker compose ps` reported PostgreSQL `healthy`.
- `docker compose build --quiet atlas` passed once. The bounded command `node .agents/skills/ck/scripts/run-compose-checks.mjs --service atlas --no-build --checks-json '[{"name":"migration check","args":["corepack","pnpm","--filter","@atlas/db","migration:check"]},{"name":"permissions tests","args":["corepack","pnpm","--filter","@atlas/db","test:permissions"]},{"name":"core typecheck","args":["corepack","pnpm","--filter","@atlas/core","typecheck"]},{"name":"core tests","args":["corepack","pnpm","--filter","@atlas/core","test"]},{"name":"document-store typecheck","args":["corepack","pnpm","--filter","@atlas/document-store","typecheck"]},{"name":"document-store tests","args":["corepack","pnpm","--filter","@atlas/document-store","test"]},{"name":"db typecheck","args":["corepack","pnpm","--filter","@atlas/db","typecheck"]},{"name":"project repository integration","args":["corepack","pnpm","--filter","@atlas/db","test:project-repository"]}]' --tail-bytes 16000` reported `Summary: 8 passed, 0 failed`.
- Exact Compose test counts captured after remediation: `@atlas/core` 17 passed, 0 skipped; `@atlas/document-store` 3 passed, 0 skipped; `@atlas/db` permissions 1 passed, 0 skipped; `@atlas/db` project repository integration 1 passed, 0 skipped. All exited 0.
- The repository integration test emitted PostgreSQL `NOTICE` messages when its `finally` cleanup repeated `DROP ... IF EXISTS` after the controlled trigger had already been removed; the test still passed and no review blocker was attributed to those notices.
- The Round 2 security-readiness review remained bounded to the unresolved source-write/transaction binding and downstream-side-effect prohibition. No new authority, identity, storage-path, or security-policy coupling was introduced by the remediation.

## Findings

| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-002 acceptance requires a failed PostgreSQL transaction to leave no visible partial project; `REV-READY-PCC-002-01` requires storage/database failure evidence. | `packages/atlas-db/tests/project-repository.integration.test.ts:72-78` | The remediation installs a controlled `BEFORE INSERT` failure on `atlas.workspace`, invokes the service after source storage, and asserts zero project, membership, workspace, and document rows for the failed stable ID. Compose integration passed. | Keep the rollback assertion in the committed regression suite. |
| CK-002 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | OPEN | PCC-002 Validation requires evidence for the bounded total request limit in addition to the other service-boundary rejection cases. | `packages/atlas-core/tests/project-creation.test.ts:10,40-48`; `packages/atlas-core/src/project-creation.ts:57-58` | The remediation adds the declared boundary cases, but `requestTooLarge` uses `pdfOfSize(1)`. That helper produces only `%`, so the third source fails the PDF-signature check at `project-creation.ts:56` before `totalBytes` reaches the `maxProjectRequestBytes` branch at line 58. The test therefore passes without proving the total-request limit. | Make the oversized-request fixture itself a valid PDF-signature payload (for example, at least five bytes beginning `%PDF-`) and assert the total-limit rejection path, while retaining the no-storage assertion. |
| CK-003 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | OPEN | PCC-002 requires no queue/downstream side effects; Validation and `REV-READY-PCC-002-03` require queue/table inspection. | `packages/atlas-db/tests/project-repository.integration.test.ts:48,67` | The remediation now verifies the owner, two workspaces, two document rows, source fidelity, and Atlas/Bridge effect-count stability. Its `pgboss` assertion counts rows in `pg_catalog.pg_tables`—table definitions—not rows in `pgboss.job`, so it cannot detect a newly enqueued `atlas-document-perception-v1` job. | Query the relevant `pgboss.job` rows by queue name and a test-specific project/idempotency identity, and assert no job was created; retain the existing Atlas and Bridge negative assertions. |

## Advisory observations

- The remediation lowers `maxProjectRequestBytes` from 100 MiB to 40 MiB. The frozen ticket requires a bounded total limit but does not prescribe a numeric value; the later transport boundary should reuse this exported limit consistently.
- The integration cleanup can avoid the harmless PostgreSQL `NOTICE` output by making the explicit trigger/function drop conditional in one place rather than repeating it in `finally`.
- Orphaned source cleanup remains the ticket’s explicit unresolved policy and is not reopened.

## Decision

The remediation materially improves the checkpoint: CK-001 is resolved, the validation matrix is substantially covered, and the successful service path now proves the complete project graph and stable Atlas/Bridge effect counts. CK-002 remains open because its oversized-request test does not reach the total-limit branch, and CK-003 remains open because the queue check measures table definitions rather than queue rows. The review session is improving but does not yet satisfy all mandatory evidence. Keep PCC-002 at `awaiting_review`; the two open findings are eligible for one further bounded remediation/review round, while PCC-003 must not advance.
