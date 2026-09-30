# GO checkpoint: IDSER-009-04 / IDSER-BATCH-09-04

- **Ticket:** `IDSER-009-04-integrated-project-card-regression-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Consumed predecessors:** IDSER-009-01 and IDSER-009-02 `PASS`; IDSER-009-03 `PASS` at `2a6a8f0`, recorded approved at `0ecf063`.
- **Implementation commit:** this GO handoff commit.

## Review Contract Closure

| Row | Required proof | Evidence / outcome | Status |
|---|---|---|---|
| RC-009-04-01 | Real persisted owner/unrelated-user route assertions. | New `idser-009-04-project-card-lifecycle.spec.mjs` creates PostgreSQL-backed legacy, waiting, processing, technical-failure and ready records, then proves six owner cards and an empty unrelated session. | PROVEN |
| RC-009-04-02 | Persisted-state browser cases. | The same test asserts exact safe cards, zero facts/empty Master/unavailable action, malformed-safe model boundary inherited from 009-01/02, and changes a waiting bundle in PostgreSQL through processing and ready before real page reloads. | PROVEN |
| RC-009-04-03 | Production/fixture and private-detail negatives. | Browser request observation finds no fixture endpoint; rendered cards expose no `/demo` link and do not expose the seeded provider failure detail. | PROVEN |
| RC-009-04-04 | Screenshot and focused browser inspection across the named matrix. | 2/2 focused Playwright tests produced and inspected light/dark desktop, tablet, mobile, and 200%-reflow-equivalent captures, with sparse/multiple cards, expanded/collapsed shell, menu keyboard focus, unbroken/mixed-case stress content, and overflow assertions. | PROVEN |
| RC-009-04-05 | Direct app/browser regression commands. | Focused Playwright command passed 2/2; `corepack pnpm build` and ESLint of the new browser test passed in Compose. | PROVEN |

## Validation

- `docker compose build --quiet atlas && docker compose up -d --no-build --wait` — healthy PostgreSQL, Atlas, Agents Bridge and worker.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright test tests/browser/idser-009-04-project-card-lifecycle.spec.mjs` — passed, 2/2.
- `docker compose exec -T atlas sh -lc 'cd /workspace/apps/atlas && corepack pnpm build && corepack pnpm exec eslint tests/browser/idser-009-04-project-card-lifecycle.spec.mjs'` — passed.

Frontend review gate: PASS. The established Entity Library remains intact: semantic status text and tokenized light/dark states are readable, disabled controls remain truthful, and the responsive grid preserves card bounds without horizontal overflow.

Internal readiness: READY_FOR_CK
