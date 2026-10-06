# CK verification: IDSER-001 / IDSER-BATCH-01

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-001-domain-and-persistence-foundation.md` / `IDSER-BATCH-01`
- Reviewed commit: `5cab5e77ef3df213e4a673b81ecf50a6b873bd96`
- Prior bounded verification: `63fb27f` (`CHANGES_REQUIRED`); this review follows the human-authorized bounded remediation cycle recorded in `project's goal/feedback/IDSER-001-ck.md`.
- Review scope: original CK-002 scope-integrity finding and direct remediation effects only.
- Result: `CHANGES_REQUIRED`

## Evidence

- The reviewed delta from `63fb27f` adds migration `0014_idser001_cross_scope_reference_integrity.sql`, registers it after `0013`, adds one same-scope knowledge-index insertion and one negative index update to the existing integration test, and records a follow-up remediation checkpoint.
- Static inspection confirms the migration now adds the full-scope composite foreign key from `knowledge_index` to `semantic_candidate` and a project/workspace/bundle composite foreign key for non-null relationship targets to `knowledge_index`. The migration is additive and does not modify earlier migration files.
- The negative test changes `knowledge_index.document_id` to `wrong-document-${suffix}` without creating a document or bundle member for that ID. This violates the preexisting `(bundle_id, document_id)` membership foreign key as well as the new candidate-scope foreign key, so the assertion does not show that a valid document from another scope is rejected by the new constraint. The test has no valid second project/workspace/bundle/document/candidate/index graph and does not exercise relationship targets.
- Docker access succeeded after retrying with permission to connect to the local daemon. PostgreSQL reported healthy. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migrate` reported all migrations already up to date; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` passed; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:semantic-foundation` passed 1/1; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:permissions` passed 1/1. The semantic-foundation pass does not resolve the test coverage gap described above. After these checks, `docker compose down` succeeded and removed the temporary PostgreSQL container and `ces-platform_default` network.
- `git diff --check 63fb27f..5cab5e7` passed.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-002 | UNRESOLVED | The SQL now declares the two requested scope-bound foreign keys, but the required real PostgreSQL negative cases are not implemented for valid foreign-scope references and relationship targets, and could not be run. The current negative assertion can pass because of the older bundle/document membership FK. |

## Direct remediation regressions

No direct regression in the behavior needed to assess CK-002 was identified in the committed delta.

## Decision

The migration addresses the two missing relational edges at the DDL level, but the frozen IDSER-001 database-evidence obligation remains unmet: the committed negative test can fail on an older constraint and does not test valid cross-scope records or relationship targets. Keep IDSER-001 at `awaiting_review` with result `CHANGES_REQUIRED`. Return the remaining test gap to human/planning authority; this CK does not authorize another remediation cycle.
