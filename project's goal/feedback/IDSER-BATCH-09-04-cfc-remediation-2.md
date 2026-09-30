# CFC remediation checkpoint: IDSER-009-04 / IDSER-BATCH-09-04

- **Frozen ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Original CK artifact:** `IDSER-BATCH-09-04-e357928-review.md`
- **Post-CFC verification:** `IDSER-BATCH-09-04-621c319-verification.md`
- **Remediation base:** `621c319a2cbc11c324b11da5796f7af07d8346dc`
- **Remediation commit:** this checkpoint's bounded `test(idser): stabilize 009-04 closure evidence` commit.
- **HMN authorization consumed:** `HMN-IDSER-009-04-003` (`AUTHORIZE_NEXT_CFC`)
- **Authorized closure target:** unresolved `CK-001.b` and only the direct queue-hold regression recorded by the bounded verification. `CK-001.a` and the original lifecycle outcome of `CK-001.c` remain resolved and unchanged.

## Frozen finding closure progress

| Clause / boundary | Status | Frozen-oracle evidence |
|---|---|---|
| `CK-001.b` | `PROVEN` | `apps/atlas/tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` now waits for the expanded `.app-shell` state, the visible `Collapse sidebar` control, its settled 16rem grid column, and no overflow before its expanded desktop capture. The focused Compose run passed 2/2. The run retained the frozen maximum 48-character ID, 80-character mixed-case name, 280-character mixed-case/unbroken description, light/dark, desktop/tablet/mobile/reflow, sparse/multiple-card, collapsed-shell, and keyboard/focus observations. The recorded Playwright image artifacts were inspected at `.codex-tools/idser-009-04-cfc-003-screenshots/`; the stable shell/card capture has no horizontal overflow or navigation/content overlap. |
| Direct regression from `621c319` | `PROVEN` | The retained test-only delivery trigger now delays only a perception job whose persisted document belongs to the current test's generated project ID. Cleanup deletes only that exact project's delayed perception job. The production-create browser command passed 9/9 and `project-home.integration.test.mjs` passed 1/1 while preserving the frozen `Waiting for extraction` assertions. No production lifecycle, worker, mapper, route, or fixture behavior changed. |
| `CK-001.a` | `PROVEN` (preserved) | Resolved in the prior committed CFC checkpoint; not reopened by this authorized cycle. |
| Original `CK-001.c` lifecycle outcome | `PROVEN` (preserved) | Resolved in the prior committed CFC checkpoint; the only work here removes its test-harness direct regression without changing the retained assertion or lifecycle behavior. |

## Required validation

- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — **passed**, 2/2. Re-run for final visual evidence: **passed**, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/production-project-create.spec.mjs` — **passed**, 9/9.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test --test-concurrency=1 tests/project-home.integration.test.mjs` — **passed**, 1/1.
- `git diff --check` — **passed**.

## Direct-regression boundary

The test-only trigger remains scoped to its current generated project and its own persisted document job. It neither delays nor deletes another project's perception job. The expanded-shell wait makes the committed screenshot record the frozen observable settled state rather than a CSS-transition frame.

## Internal readiness

`READY_FOR_CK`.

Every authorized frozen oracle and the bounded direct-regression repair has a passing exact command and evidence locator. This checkpoint consumes `HMN-IDSER-009-04-003`; CK verification must remain limited to `CK-001.b`, the direct-regression repair, this remediation diff, their recorded evidence, and any direct regressions introduced by this remediation.
