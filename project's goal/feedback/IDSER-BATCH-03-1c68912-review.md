# CK review: IDSER-003 / IDSER-BATCH-03

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-003-transactional-project-bundle-kickoff.md` / `IDSER-BATCH-03`
- Reviewed commit: `1c689126cdb1ab2fa44a3cd7f6c9c220846dd28c` (`feat(idser): atomically kick off first perception`)
- Frozen ticket reference: IDSER-003 at `awaiting_review`, recorded at HEAD `4f3fff007f10eee39944f04457a0d2c20cc76a16`; its implementation checkpoint names the reviewed commit.
- Dependencies: IDSER-001 approved at `a64c62b` and IDSER-002 approved at `5bf1bbb`; PCC-006 and frozen BSS dependencies remain the ticket's declared predecessors.
- Review type: first consolidated CK review.
- Result: `CHANGES_REQUIRED`

## Review preconditions and evidence

- `HEAD` is `4f3fff007f10eee39944f04457a0d2c20cc76a16`; the recorded implementation commit `1c689126cdb1ab2fa44a3cd7f6c9c220846dd28c` is an ancestor. The intervening commits record IDSER-002 approval and the IDSER-003 checkpoint. No tracked worktree changes are present; existing untracked review/context artifacts do not alter the target. No prior IDSER-BATCH-03 CK artifact was present.
- Reviewed the frozen IDSER-003 scope, acceptance criteria, validation obligations, and mandatory `REV-READY-IDSER-003-01/02/03` bindings. Inspected only the committed project creation, transaction/queue composition, perception-authority seam, related integration tests, and direct inherited seams they consume.
- `docker compose up -d --build` completed and all four services (PostgreSQL, Atlas, Agents Bridge, and worker) became healthy.
- Compose checks passed: `@atlas/db test:project-repository` (2/2), `@atlas/db test:perception-authority` (1/1), `@atlas/db typecheck`, `@atlas/core test`, `@atlas/agents-bridge test`, `@atlas/agents-bridge typecheck`, and `@atlas/app build`. `git diff --check 1c68912^..1c68912` passed.
- The affected authenticated app integration test was run against the rebuilt stack with the worker paused for isolation. `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs` failed at `apps/atlas/tests/project-create.integration.test.mjs:93`: it expected zero perception executions, but IDSER-003 correctly created one. The test's cleanup ran and the worker was restarted; Compose services returned healthy.

## Findings

| ID | Ticket authority | Evidence and affected location | Required correction |
|---|---|---|---|
| CK-001 | IDSER-003 scope: “New flow tests explicitly extend PCC's former no-perception assertion”; acceptance criteria 1 and 5; `REV-READY-IDSER-003-02` | `apps/atlas/tests/project-create.integration.test.mjs:90–96` retains PCC assertions that the new production create path has zero perception executions and zero grants. The required authenticated integration test fails at line 93 with actual execution count `1`; consequently it cannot complete the remaining duplicate, fixture-isolation, and safe response regressions. Its queue assertion searches job JSON for the project ID, which is not part of the bounded perception job, so it would not verify D1 job presence. This test file is unchanged by the reviewed commit. | Update the production creation integration to assert the new bundle, ordered document manifest, D1 execution/grant, and one correctly scoped perception job using its document or bundle identity while later documents remain pending. Preserve and run the existing authentication, upload validation, exact-byte/hash, duplicate, fixture-isolation, bounded-response, and no-cache/derived-asset checks; clean up the queued test job as well as Atlas rows. |
| CK-002 | Atomic creation contract; acceptance criterion 2; validation requirement to inspect rollback and job visibility across commit; `REV-READY-IDSER-003-01` | `packages/atlas-db/tests/project-repository.integration.test.ts:117–127`. The success case checks rows from a separate connection only after `repository.create` returns. The injected failure case supplies a queue stub that throws before any pg-boss write and asserts only that the project row is absent. It does not prove that a real pg-boss job written through the adapter is invisible before commit and rolled back with the full Atlas graph when a later transactional step fails. | Add the bounded Compose integration proof required by the ticket: observe job visibility from a second connection across commit, and make a real transactional enqueue succeed before injecting a later transaction failure; assert that the project graph, bundle/manifest, perception execution/grant, and pg-boss job are all absent after rollback. |

## Scope-change observations

None. Both findings are implementation-test repairs within the frozen IDSER-003 scope; the transaction and queue architecture remains as authorized.

## Decision

IDSER-003 / `IDSER-BATCH-03` receives `CHANGES_REQUIRED` at `1c689126cdb1ab2fa44a3cd7f6c9c220846dd28c`. Keep IDSER-003 at `awaiting_review`. CFC may address only CK-001 and CK-002; IDSER-004 remains gated on a later IDSER-003 `PASS`.
