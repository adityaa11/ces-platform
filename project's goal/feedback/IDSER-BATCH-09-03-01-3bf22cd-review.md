# CK review: IDSER-009-03-01 / IDSER-BATCH-09-03-01

- **Ticket:** `IDSER-009-03-01-semantic-uncertainty-project-card-contract.md`
- **Ticket state:** `awaiting_review`
- **GO checkpoint:** `IDSER-BATCH-09-03-01-go-checkpoint.md`
- **Reviewed commit:** `3bf22cd470fc7f9411a68669b5614caf72a004b1` (`feat(atlas): expose scoped semantic uncertainty on project cards`)
- **Review target:** GO handoff commit at `HEAD`; the active ticket, checkpoint, and implementation agree on the reviewed commit. No reviewed implementation file has a post-commit worktree edit.
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Status | Evidence and review |
|---|---|---|---|
| RC-009-03-01-01 | IDSER-009-03-01, “Accepted authority and exact signal” and Review Contract row `RC-009-03-01-01`: derive uncertainty only from same-current-bundle persisted candidate/relationship flags under the membership-authorized read; false, legacy, and unrelated-scope controls remain false. | IMPLEMENTED_UNPROVEN | `project-repository.ts` constrains both `EXISTS` branches by project, workspace, and bundle, and the row conversion exposes only a boolean. The recorded Compose PostgreSQL test proves candidate and relationship flags independently, an unflagged bundle, legacy handling, private-value redaction, and membership isolation. It does not include the ticket-named foreign-bundle control. See `CK-001.a`. |
| RC-009-03-01-02 | IDSER-009-03-01, lifecycle contract and row `RC-009-03-01-02`: required boolean does not alter any of the four states or persisted X/N progress, including ready plus true. | PROVEN | `apps/atlas/tests/home-projects.test.mjs`, test `IDSER-009-03-01 carries semantic uncertainty without changing lifecycle or progress`, covers all four states with true and asserts unchanged state and progress. The GO checkpoint records its Compose command passed, 10/10. |
| RC-009-03-01-03 | IDSER-009-03-01, row `RC-009-03-01-03`: exact-key transport accepts the boolean, rejects malformed/extra detail, and does not serialize private semantic data. | PROVEN | `apps/atlas/lib/home-project-read-service.ts` validates exact keys and boolean type. The focused parser assertions reject malformed and extra fields; the repository integration assertion excludes seeded semantic values and identifiers from the returned model. The GO checkpoint records the focused Compose command passed, 10/10, and the PostgreSQL integration passed, 3/3. |
| RC-009-03-01-04 | IDSER-009-03-01, row `RC-009-03-01-04`: show exact visible text `Semantic uncertainty` iff true, alongside unchanged primary state/action. | PROVEN | `apps/atlas/components/ProjectCardPresentation.tsx` renders the exact text when true. `apps/atlas/tests/production-project-card-presentation.test.mjs` asserts true for ready and technical-failure models and omission for false. The GO checkpoint records the focused Compose command passed, 10/10. |

## Validation and evidence inspected

- `git status --short` and `git diff --name-only`: the working tree has unrelated generated fixture/build metadata edits, an uncommitted umbrella-ticket edit, and additional untracked work. None modifies the active ticket, GO checkpoint, or implementation files in the reviewed commit; these changes do not make the review target ambiguous.
- Inspected the frozen ticket and GO checkpoint, reviewed commit diff, PostgreSQL repository query and integration evidence, mapper, exact-key parser, browser-safe model, production card rendering, and focused assertions.
- The GO checkpoint records `docker compose ps` with PostgreSQL, Atlas, Agents Bridge, and worker healthy.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` — recorded passed, 3/3 PostgreSQL integration tests.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs tests/production-project-card-presentation.test.mjs'` — recorded passed, 10/10 focused tests.
- The GO checkpoint also records the Atlas build and focused ESLint, DB typecheck, and `git diff --check` as passed. CK did not rerun those commands.

## Frozen Finding Closure Matrix

### CK-001 — Required unrelated-bundle scope proof is missing

The implementation query is visibly constrained to the authorized project, bundle workspace, and bundle ID. However, the ticket explicitly requires a foreign-bundle control in its smallest authoritative PostgreSQL integration proof, and the committed evidence does not show that a semantic flag outside the target current bundle contributes no signal. This is one evidence finding against `RC-009-03-01-01`.

#### CK-001.a — Prove a flag outside the current bundle contributes no signal

- **Ticket authority:** IDSER-009-03-01, “Accepted authority and exact signal,” requires same-project/workspace/bundle scope and prohibits deriving uncertainty from unrelated scope. Its Review Contract row `RC-009-03-01-01` expressly names a foreign-bundle control and requires unrelated scope to contribute no signal.
- **Unsatisfied evidence:** `packages/atlas-db/tests/project-repository.integration.test.ts` seeds a flagged candidate in the waiting project's current bundle and a flagged relationship in the processing project's current bundle. It checks an unflagged bundle, legacy behavior, and an unauthorized owner, but no flagged semantic row outside the target project's current bundle. The recorded `test:project-repository` pass therefore does not prove the named control.
- **Observable correction:** add the ticket-named PostgreSQL integration control with a flagged semantic record outside the target project's current bundle, then assert the target card's `hasSemanticUncertainty` remains false while the accepted same-bundle controls still return true.
- **Binary closure oracle:** **PASS** only if the committed PostgreSQL integration test creates a flagged semantic record outside a target project's current bundle and its assertion shows that the target project's returned `hasSemanticUncertainty` is `false`; the exact evidence location is `packages/atlas-db/tests/project-repository.integration.test.ts` plus passing output from `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'`. Otherwise **FAIL**. Direct-regression boundary: the semantic-uncertainty `EXISTS` query and boolean conversion in `packages/atlas-db/src/project-repository.ts`, including their existing membership/project/workspace/bundle scope.

## Scope-change observations

None. No ticket, product, provider, runtime, deployment, persistence, or architecture decision is needed to prove the frozen row.

## Decision

`CHANGES_REQUIRED`. Three Review Contract rows are proven. `RC-009-03-01-01` remains implemented but unproven because its explicitly named foreign-bundle control is absent from the committed PostgreSQL evidence. `CK-001.a` is the complete closure target for this first review; no broader review or additional condition is authorized.
