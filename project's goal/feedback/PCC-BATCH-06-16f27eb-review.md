# Review: PCC-006 / PCC-BATCH-06

- Ticket / batch: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-006-project-card-creation-e2e-and-regression-checkpoint.md` / `PCC-BATCH-06`
- Reviewed commit: `16f27eb034092ced23fdbed554f50ef30e8dd82a`
- Frozen ticket baseline: PCC-006 at the reviewed commit; acceptance and scope unchanged in this checkpoint. Sources: `SRC-PCC-01` through `SRC-PCC-06`, plus the PCC-006 security-readiness bindings.
- Review round: 1
- Maximum review rounds: 3
- Prior review: None
- Remediation commit: None
- Result: `CHANGES_REQUIRED`

## Evidence

- Target resolution: `git rev-parse HEAD` returned `16f27eb034092ced23fdbed554f50ef30e8dd82a`; PCC-006 is `awaiting_review`. No tracked or untracked application/ticket implementation changes were present. Untracked sample PDFs and prior review/context artifacts were outside this implementation delta.
- PCC-001 through PCC-005 are accepted by the ticket set. PCC-005's final review artifact is `project's goal/feedback/PCC-BATCH-05-6623b4b-review.md` (`PASS`). PCC-006 changes no UI component; the current browser suite and accepted PCC-005 visual review cover the shared production/fixture surfaces.
- `docker compose ps --format 'table {{.Service}}\t{{.Status}}'`: Atlas, PostgreSQL, Agents Bridge, and Agents Bridge Worker were healthy.
- `docker compose build --quiet atlas`: failed before build because Docker Hub metadata lookup for `node:24-bookworm-slim` timed out. The already-running Compose Atlas container was available; its application build below passed.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test`: application build passed; 37 tests, 36 passed, 0 failed, 1 intentional Worker-runtime skip. This included auth, project creation/home, CSP/render, and PCC-005 helper coverage.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs tests/project-home.integration.test.mjs`: 2 passed, 0 failed, 0 skipped. Covered authenticated multipart creation, source bytes/hash/metadata, downstream absence, and User B's inability to see User A's project.
- Storage failure: `docker compose run --rm --no-deps -e ATLAS_PROJECT_CREATION_TEST_FAILURE=storage atlas sh -lc 'corepack pnpm --filter @atlas/app dev >/tmp/pcc006-storage-dev.log 2>&1 & pid=$!; trap "kill $pid 2>/dev/null || true" EXIT; sleep 10; corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs'`: 1 passed, 0 failed.
- Database failure: same command with `ATLAS_PROJECT_CREATION_TEST_FAILURE=database` and `/tmp/pcc006-database-dev.log`: 1 passed, 0 failed. Both cases asserted the project was not visible after failure.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/auth test`: 3 passed, 0 failed. `docker compose exec -T atlas corepack pnpm --filter @atlas/db migration:check`: passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/document-store test`: 3 passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/core test`: 17 passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/core typecheck` and `docker compose exec -T atlas corepack pnpm --filter @atlas/db typecheck`: passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:permissions`: 1 passed.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:project-repository`: failed at its existing global document-count assertion (`packages/atlas-db/tests/project-repository.integration.test.ts:78`), actual 3 versus expected 2. The test uses a persistent Compose database; this checkpoint does not change that test. This is recorded as an environment/regression limitation, not attributed to PCC-006.
- The first `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` run could not launch because Chromium was absent. After installing the pinned Playwright Chromium runtime in the Compose container, the same command passed all 9 cases, 0 failed, 0 skipped: light/dark desktop, tablet, mobile, reflow, and the fixture creation/sharing regression.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint project-creation-boundary.ts tests/project-create.integration.test.mjs`: passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` failed on three existing errors outside the PCC-006 diff: `components/RuntimeFixtureRoute.tsx:18` and `vite.config.ts:54,99`.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false`: failed. It reported new type errors at `project-creation-boundary.ts:72`: the injected repository object lacks `listAccessibleTo`, and the injected document store lacks `read`. Other diagnostics are in unchanged application/fixture files. The directly affected core and database package typechecks passed.
- `git diff --check HEAD`: passed.
- Security readiness bindings reviewed: the integrated route exercises real Better Auth, multipart upload, PostgreSQL/DocumentStore persistence, and authorized home read; both injected failure paths preserve non-visibility; no UI code changed, and the cross-theme/responsive browser suite plus the accepted PCC-005 visual review cover the shared UI boundary.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-006 `SEAM-PCC-006-01` (EXPLICIT): the application integration seam must exercise the production service boundary while preserving the declared package contracts. | `apps/atlas/project-creation-boundary.ts:62-72` | The new failure adapters are passed as `DocumentStore` and `AtlasProjectRepository`, but omit required `read` and `listAccessibleTo` methods. The app TypeScript check reports both incompatibilities at line 72. | Make the opt-in fault adapters satisfy the declared dependency contracts (delegating unaffected methods or narrowing the accepted capability types), and leave the app check free of errors introduced by this change. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | PCC-006 Scope and failure matrix (EXPLICIT): exercise the zero-byte PRD path and prove failed input remains bounded. | `apps/atlas/tests/project-create.integration.test.mjs:47-63` | The HTTP integration matrix covers missing PRDs, invalid/spoofed content, unsupported media, per-file/request size limits, and origin rejection, but contains no zero-byte PRD request. The core validator rejects empty bytes, but the required real HTTP case is not exercised. | Add a zero-byte multipart HTTP case and assert its bounded response and that no project/document becomes visible. |

## Advisory observations

- The `@atlas/db` project-repository integration test did not pass against the persistent Compose database: its global count assertion saw one extra document row. Rerun it against an appropriately isolated test database or make its fixture count scoped before treating that dependency regression gate as green.
- Full app lint has three diagnostics in unchanged files; targeted lint for both PCC-006 implementation files passed.

## Decision

Two implementation-repairable findings remain, so this checkpoint is `CHANGES_REQUIRED`. The real two-user flow, source storage and metadata checks, downstream-effect assertions, injected storage/database failures, app suite, and browser regression suite passed. Keep PCC-006 at `awaiting_review`; after a committed remediation, CK can perform the bounded next round.
