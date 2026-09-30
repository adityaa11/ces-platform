# CFC remediation progress: IDSER-009-03-01 / IDSER-BATCH-09-03-01

- **Active ticket:** `IDSER-009-03-01-semantic-uncertainty-project-card-contract.md` (`awaiting_review`)
- **Batch:** `IDSER-BATCH-09-03-01`
- **Source CK artifact:** `IDSER-BATCH-09-03-01-3bf22cd-review.md`, result `CHANGES_REQUIRED`
- **Reviewed implementation commit:** `3bf22cd470fc7f9411a68669b5614caf72a004b1`
- **Remediation base:** `3bf22cd470fc7f9411a68669b5614caf72a004b1` (`HEAD` at CFC start)
- **Authorized target:** `CK-001.a` only, from the source CK artifact's frozen finding closure matrix.

## Working progress view

| CK clause | Current status | Evidence location |
|---|---|---|
| `CK-001.a` | PROVEN; the integration test creates and identifies a flagged candidate in a different project's bundle from the target card, and asserts the target signal is false. | `packages/atlas-db/tests/project-repository.integration.test.ts`, assertions `foreignBundleFlag.length === 1` and target `hasSemanticUncertainty === false`. Frozen closure oracle: source CK artifact `CK-001.a`. |

The source CK artifact remains authoritative for ticket trace, required behavior and proof, harness, scenario, observation, and binary closure oracle. No proven row is reopened.

## Validation and direct regressions

- Required command: `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` — **passed**, 3/3 PostgreSQL integration tests, 0 failed, 0 skipped.
- The same integration test retained and passed the same-bundle candidate `true` and relationship `true` controls, while the foreign-project/bundle control returned `false` for the target. This checks the frozen direct-regression boundary: semantic-uncertainty `EXISTS` query and boolean conversion in `packages/atlas-db/src/project-repository.ts`, including project/workspace/bundle scoping.
- `git diff --check` — passed.

## Internal readiness

`READY_FOR_CK` — the only authorized clause `CK-001.a` is `PROVEN`, and its ticket-required PostgreSQL harness and binary closure oracle passed.

## Remediation status

`awaiting_review` — one bounded CFC checkpoint is ready for CK verification. No further CFC or CK cycle is started here.
