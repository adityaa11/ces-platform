# CFC checkpoint: IDSER-010-06 / IDSER-BATCH-10-06

- **Ticket:** `IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md` (`awaiting_review`).
- **Original CK artifact:** `IDSER-BATCH-10-06-101eb42-review.md`.
- **Original CK result:** `CHANGES_REQUIRED`, for `CK-001.a` and `CK-001.b` only.
- **Reviewed commit:** `101eb423f429fe6d400550b6262cc304b1eb12fc`.
- **Remediation base:** `101eb423f429fe6d400550b6262cc304b1eb12fc`.
- **Remediation commit:** the containing checkpoint commit (`test(idser): close 010-06 CK evidence findings`).
- **Scope:** preserve the CK closure matrix and its binary oracles at the original CK artifact's `## Frozen Finding Closure Matrix`. No other clause was reopened.

## Closure evidence

| Original CK clause | Status | Assertion and evidence locator | Required command and outcome | Frozen oracle |
|---|---|---|---|---|
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/idser-010-compose.mjs`, `compositionScenarioEvidence` and the existing scenario assertions; `.codex-tools/idser-010-06-cfc-compose.out`, records `IDSER-010 Scenario A/B/C-supports/C-duplicates/D/E evidence`. Each record contains scoped IDs, DB counts and state, relationship details, ordered document members, execution IDs/stages, queue jobs/states, and provider events/scopes. Primary child evidence: A/B — `project's goal/feedback/IDSER-BATCH-10-01-cfc-checkpoint.md` and `IDSER-BATCH-10-01-1259109-verification.md`; C/D/E — `project's goal/feedback/IDSER-BATCH-10-02-cfc-checkpoint.md` and `IDSER-BATCH-10-02-613d069-verification.md`. | `node apps/agents-bridge/tests/idser-010-compose.mjs` — exit 0; A, B, C-supports, C-duplicates, D, E evidence records emitted; controlled Compose A/B/C/D/E/F/G/H passed. | **Passed.** A–E observations are durable and secret-safe, the corresponding child evidence is located above, and the deterministic Compose run passed. |
| `CK-001.b` | `PROVEN` | `.codex-tools/idser-010-06-cfc-compose.out`, `IDSER-010 Compose service health` — `postgres`, `atlas`, `agents-bridge`, `agents-bridge-worker`, and `mistral-mock` all `healthy`. `.codex-tools/idser-010-06-cfc-browser.out` — IDSER-009-04 visual matrix and browser suite result. Fresh captures are committed under `.codex-tools/idser-010-06-cfc-screenshots/` (10 PNGs listed below). | `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` — exit 0, 11/11 passed, including IDSER-009-04 lifecycle and visual/keyboard matrix. Health came from the required Compose harness run above. | **Passed.** The durable evidence names all healthy Compose services and links the fresh screenshots from the passing browser run. |

### Fresh IDSER-009-04 screenshots

- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-light-desktop.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-light-desktop-collapsed.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-light-tablet.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-light-mobile.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-light-reflow.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-dark-desktop.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-dark-desktop-collapsed.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-dark-tablet.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-dark-mobile.png`
- `.codex-tools/idser-010-06-cfc-screenshots/project-cards-dark-reflow.png`

## Direct regressions and validation

- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — passed.
- `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed all controlled scenarios A–H and cleanup; service health was captured before teardown.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` — passed 11/11, including the refreshed IDSER-009-04 browser matrix.
- `git diff --check` — passed.
- No direct regression was observed in the authorized Compose/browser scope. No pre-existing unrelated worktree changes were staged.

## Internal readiness and handoff

Every authorized clause maps to its original CK oracle, evidence locator, and passing required command. Both frozen oracles are proven; direct affected regressions passed.

**Internal readiness: READY_FOR_CK**

CFC checkpoint state: `awaiting_review`. CK verification is the next workflow step; this checkpoint makes no `PASS` determination.

