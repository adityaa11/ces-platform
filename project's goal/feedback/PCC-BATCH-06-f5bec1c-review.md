# Review: PCC-006 / PCC-BATCH-06

- Ticket / batch: project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-006-project-card-creation-e2e-and-regression-checkpoint.md / PCC-BATCH-06
- Reviewed commit: f5bec1c65023f6747b45ed8e37abdf8ae508cddd
- Frozen ticket baseline: PCC-006 scope and acceptance as established at 16f27eb034092ced23fdbed554f50ef30e8dd82a; this remediation adds evidence only and does not change requirements.
- Review round: 2
- Maximum review rounds: 3
- Prior review: project's goal/feedback/PCC-BATCH-06-16f27eb-review.md (CHANGES_REQUIRED)
- Remediation commit: f5bec1c65023f6747b45ed8e37abdf8ae508cddd
- Result: PASS
- Convergence: IMPROVING

## Evidence

- Target resolution: HEAD is f5bec1c65023f6747b45ed8e37abdf8ae508cddd; PCC-006 remains awaiting_review. No in-scope working-tree edits were present.
- The remediation delta is limited to the two prior findings: complete interface implementations for the injected fault adapters, a zero-byte HTTP case, and a ticket evidence note. git diff --check 16f27eb034092ced23fdbed554f50ef30e8dd82a..HEAD passed.
- docker compose ps --format 'table {{.Service}}\t{{.Status}}': Atlas, PostgreSQL, Agents Bridge, and Agents Bridge Worker were healthy.
- docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs tests/project-home.integration.test.mjs: 2 passed, 0 failed, 0 skipped. The updated creation test exercised the zero-byte multipart request; it returned 400 and left no project row.
- docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint project-creation-boundary.ts tests/project-create.integration.test.mjs: passed.
- docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false: the adapter errors from Round 1 are gone. The check still fails on the previously documented project-creation-boundary.ts:83 ProcessEnv / AtlasAuthEnvironment mismatch and diagnostics in unchanged app/fixture files.
- Storage fault recheck: docker compose run --rm --no-deps -e ATLAS_PROJECT_CREATION_TEST_FAILURE=storage atlas sh -lc 'corepack pnpm --filter @atlas/app dev >/tmp/pcc006-r2-storage.log 2>&1 & pid=$!; trap "kill $pid 2>/dev/null || true" EXIT; sleep 10; corepack pnpm --filter @atlas/app exec node --test tests/project-create.integration.test.mjs': 1 passed, 0 failed.
- Database fault recheck: same command with ATLAS_PROJECT_CREATION_TEST_FAILURE=database and /tmp/pcc006-r2-database.log: 1 passed, 0 failed. Both still assert that the failed request leaves no visible project.
- Round 1 evidence remains applicable to unchanged scope: the app suite passed 36/36 with one intentional Worker skip; the nine-case browser suite passed across theme and viewport variants; auth, migration, DocumentStore, core tests/typecheck, database typecheck, and database permissions checks passed. PCC-005's accepted visual review remains the baseline for unchanged UI.
- The Round 1 environment limitation remains recorded: @atlas/db test:project-repository saw 3 document rows where its global persistent-database assertion expected 2. This test and its assertion are unchanged by this remediation. Full app lint also retains three unchanged-file diagnostics. Neither issue was introduced by this delta or is a remaining PCC-006 finding.
- Security-readiness review rechecked both remediation paths: unaffected DocumentStore/repository operations delegate to their real implementations; failures remain opt-in; the zero-byte request is rejected before project persistence; no authority, cleanup, or UI boundary changed.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-006 SEAM-PCC-006-01 (EXPLICIT): the application integration seam must exercise the production service boundary while preserving declared package contracts. | apps/atlas/project-creation-boundary.ts:62-75 | The storage adapter now delegates read; the database adapter delegates listAccessibleTo. Targeted lint passes and the app typecheck no longer reports either adapter incompatibility. | Satisfied by the committed fault-adapter change. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | PCC-006 Scope and failure matrix (EXPLICIT): exercise the zero-byte PRD path and prove failed input remains bounded. | apps/atlas/tests/project-create.integration.test.mjs:51-54 | The real multipart request with an empty PDF returns 400, and a database query confirms no project row is created. The focused creation/home suite passes 2/2. | Satisfied by the committed HTTP regression case and non-visibility assertion. |

## Advisory observations

- The persistent-database count mismatch in the unrelated @atlas/db test:project-repository check remains an environment/regression limitation from Round 1; rerun it against isolated state before relying on that specific suite.

## Decision

Both Round 1 findings are resolved, and the remediation is improving. No remediation regression or in-scope late discovery remains. Result: PASS for PCC-006 at f5bec1c65023f6747b45ed8e37abdf8ae508cddd.
