# CK verification: IDSER-009-04 / IDSER-BATCH-09-04

- **Ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Original CK artifact:** `IDSER-BATCH-09-04-e357928-review.md`
- **CFC checkpoint:** `IDSER-BATCH-09-04-cfc-remediation.md`
- **Consumed HMN authorization:** `HMN-IDSER-009-04-002`
- **Reviewed remediation commit:** `621c319a2cbc11c324b11da5796f7af07d8346dc`
- **Reviewed base:** `beab5d28a5c2ed983527fd42e60dd9a6138800cc`
- **Review type:** bounded post-CFC verification of `CK-001.a`, `CK-001.b`, `CK-001.c`, the remediation diff, required evidence, and direct regressions only.
- **Result:** `CHANGES_REQUIRED`

## Frozen clause outcomes

| Original clause | Outcome | Verification |
|---|---|---|
| `CK-001.a` | `RESOLVED` | The committed Compose browser test persisted and reloaded `1 of 2` progress; showed semantic uncertainty with the approved ready state, distinct from technical failure; and omitted the contradictory invalid lifecycle card without exposing private details. The exact focused command passed 2/2. |
| `CK-001.b` | `UNRESOLVED` | The committed test covers the 48-character ID, 80-character mixed-case name, and 280-character unbroken/mixed-case description; it checks overflow and captures each width/theme plus collapsed desktop in both themes. Its create flow also records loading, errors, and successful `/home` refresh. However, the captured files named `project-cards-light-desktop.png` and `project-cards-light-tablet.png` show the expanded/navigation shell mid-transition, with the side navigation overlapping or clipped against page content. At `apps/atlas/tests/browser/idser-009-04-project-card-lifecycle.spec.mjs:204-212`, the test clicks `Expand sidebar` and captures immediately without asserting the expanded shell state or waiting for the transition. The expected observable state is a stable expanded-shell capture without overlapping navigation; the actual evidence is a transition frame. Therefore the frozen requirement to capture and inspect the expanded shell is not proven, although collapsed desktop captures and the other named widths/themes/content checks pass. |
| `CK-001.c` | `RESOLVED` | The frozen production-create browser command passed all 9 cases, and the persisted `/home` integration command passed 1/1. Both retain the persisted `Waiting for extraction` assertion and the existing isolation, unavailable-action, safe-render, and route-refresh assertions. |

## Validation performed

- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — **passed**, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs --output /workspace/.codex-tools/idser-009-04-cfc-screenshots` — **passed**, 2/2; generated the visual matrix. The captures were copied from the Compose container to `.codex-tools/idser-009-04-cfc-screenshots/` and inspected.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/production-project-create.spec.mjs` — **passed**, 9/9.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test --test-concurrency=1 tests/project-home.integration.test.mjs` — **passed**, 1/1.

## Direct regression introduced by remediation

The test-only delivery hold is global to the shared Compose database. In `apps/atlas/tests/browser/production-project-create.spec.mjs:15-16` and `apps/atlas/tests/project-home.integration.test.mjs:15-16`, the trigger delays every newly inserted `atlas-document-perception-v1` job while installed. Its cleanup deletes every job with that name whose `start_after > now()`, without restricting deletion to the project or job created by the current test. The same global trigger is installed around each production-create browser case and the `/home` integration case.

This does not satisfy the CFC checkpoint's evidence statement that the harness holds only the newly durable perception job. A pre-existing delayed job can be deleted, and another project's perception job created while the trigger is installed can be delayed. The tests passed, but this shared queue mutation can change unrelated persisted project lifecycle/worker behavior during the retained regression run.

**Required observable correction:** scope the temporary hold and cleanup to the exact job/project created by the test, so unrelated perception jobs are neither delayed nor deleted; then rerun the two frozen `CK-001.c` commands and preserve their waiting-card assertions.

This is a direct regression from the remediation harness, not a new CK finding or an added ticket acceptance condition. The original clause outcomes above remain frozen. No unrelated review was performed.

## Decision

`CHANGES_REQUIRED` because `CK-001.b` remains unproven against its frozen screenshot oracle and the remediation introduced the direct shared-queue regression described above. Return control to human/planning authority under the bounded CK workflow; this verification does not authorize another CFC cycle.

