# CK verification: IDSER-009-04 / IDSER-BATCH-09-04

- **Ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Original CK artifact:** `IDSER-BATCH-09-04-e357928-review.md`
- **Prior post-CFC verification:** `IDSER-BATCH-09-04-621c319-verification.md`
- **CFC checkpoint:** `IDSER-BATCH-09-04-cfc-remediation-2.md`
- **Consumed HMN authorization:** `HMN-IDSER-009-04-003`
- **Reviewed remediation commit:** `286eaee59ab4b104c2e26443f3eb488b5a053654`
- **Remediation base:** `621c319a2cbc11c324b11da5796f7af07d8346dc`
- **Review type:** bounded verification of unresolved `CK-001.b`, the direct queue-hold regression from `621c319`, this remediation diff, its frozen evidence, and direct regressions only.
- **Result:** `PASS`

## Frozen clause and regression outcomes

| Authorized item | Outcome | Verification |
|---|---|---|
| `CK-001.b` | `RESOLVED` | The focused Compose test passes with the added expanded-shell assertions: `sidebar-collapsed` is absent, the collapse control is visible, computed grid columns settle to `256px`, and overflow is checked before capture. I inspected the newly generated light/dark expanded and collapsed desktop captures and the light tablet capture. The expanded captures show the full navigation without overlap; the collapsed captures show the narrow shell; the maximum valid ID, name, and description remain within cards without horizontal overflow. The test also retains both themes, all named widths, sparse/multiple cards, and keyboard/focus observations. |
| Direct queue-hold regression from `621c319` | `RESOLVED` | The test trigger now delays only a perception job whose persisted artifact document joins to the current generated project ID. Cleanup deletes only delayed perception jobs whose artifact belongs to that same project. The production-create and `/home` assertions pass; production lifecycle code and the waiting-card expectation are unchanged. |
| `CK-001.a` and original `CK-001.c` lifecycle outcome | `RESOLVED` (preserved) | Carried forward unchanged from the prior verification as protected outcomes; this cycle did not reopen them. |

## Validation performed

- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — first attempt hit a Chromium process crash while creating a browser context; retry **passed**, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs --output /workspace/.codex-tools/idser-009-04-cfc-003-verify` — **passed**, 2/2; produced the inspected lifecycle matrix captures in `.codex-tools/idser-009-04-cfc-003-verify/`.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/production-project-create.spec.mjs` — **passed**, 9/9.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test --test-concurrency=1 tests/project-home.integration.test.mjs` — **passed**, 1/1.
- `git diff --check 621c319a2cbc11c324b11da5796f7af07d8346dc..286eaee59ab4b104c2e26443f3eb488b5a053654` — **passed**.

## Direct-regression boundary

The direct remediation changes remain confined to browser/integration test harnesses and visual assertions. The queue hold and cleanup target the test-created project's document job; no unrelated delayed perception job is selected by the cleanup predicate. No production lifecycle, worker, mapper, route, fixture, or authentication changes were introduced in this remediation diff.

## Decision

`PASS`. `CK-001.b` and the bounded direct-regression correction satisfy their frozen oracles. The historical resolved outcomes remain unchanged. No direct remediation regression remains, and no broader review was performed.
