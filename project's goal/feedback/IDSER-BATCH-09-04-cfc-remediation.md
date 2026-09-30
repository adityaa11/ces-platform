# CFC remediation checkpoint: IDSER-009-04 / IDSER-BATCH-09-04

- **Frozen ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Source CK artifact:** `IDSER-BATCH-09-04-e357928-review.md`
- **Reviewed base:** `e357928a0707f7dc70ee996a28dcde673a924353`
- **HMN authorization consumed:** `HMN-IDSER-009-04-002`
- **Authorized clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c` only.

## Frozen finding closure progress

| Clause | Status | Frozen-oracle evidence |
|---|---|---|
| `CK-001.a` | `PROVEN` | `apps/atlas/tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` persists and reloads `1 of 2` progress, a ready card with the bounded semantic-uncertainty indication, and contradictory lifecycle facts that fail closed without private detail. The focused Compose browser command passed 2/2. |
| `CK-001.b` | `PROVEN` | The focused lifecycle spec covers both themes; desktop, tablet, mobile, and 200%-equivalent reflow widths; sparse/multiple cards; keyboard/focus; both shell states; no-overflow checks; and valid maximum 48-character ID, 80-character mixed-case name, and 280-character mixed-case/unbroken description. Its explicit captures cover the named visual states. `production-project-create.spec.mjs` supplies the retained real loading, error, successful refresh, and direct card evidence. The focused command passed 2/2 and the retained browser command passed 9/9. |
| `CK-001.c` | `PROVEN` | The existing production creation and `/home` assertions retain the frozen persisted waiting-card expectation. Their test-only PostgreSQL harness holds only the newly durable perception job before delivery; production code and its authenticated redemption lifecycle are unchanged. This preserves real creation, persistence, route refresh, owner isolation, unavailable action, fixture separation, and safe render assertions without a production timing hook. The exact browser command passed 9/9 and `project-home.integration.test.mjs` passed within the 16/16 regression bundle. |

## Required validation

- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — **passed**, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/production-project-create.spec.mjs` — **passed**, 9/9.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test --test-concurrency=1 tests/auth-home.integration.test.mjs tests/auth-sign-out.integration.test.mjs tests/auth-sign-up.integration.test.mjs tests/project-home.integration.test.mjs tests/production-project-card-presentation.test.mjs tests/rendered-html.test.mjs` — **passed**, 16/16.
- `git diff --check` — **passed**.

## Direct-regression boundary

The remediation changes only integrated browser/integration evidence and the
test-only delivery isolation needed to observe the already-approved persisted
waiting state. It does not modify production lifecycle, read, mapper,
presentation, fixture, authentication, or worker behavior.

## Internal readiness

`READY_FOR_CK`.

Every authorized frozen oracle is proven with its named test/evidence location
and exact command outcome. This checkpoint consumes
`HMN-IDSER-009-04-002`; CK verification must remain limited to the three frozen
clauses, this remediation diff, the recorded evidence, and direct regressions.
