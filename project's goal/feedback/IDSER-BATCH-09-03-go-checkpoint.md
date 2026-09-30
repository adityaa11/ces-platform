# GO checkpoint: IDSER-009-03 / IDSER-BATCH-09-03

- **Ticket:** `IDSER-009-03-production-project-card-presentation.md`
- **Ticket state:** `awaiting_review`
- **Consumed predecessor:** IDSER-009-02 `PASS` at `64f7072`, recorded approved at `6ebefca`.
- **Implementation commit:** this GO handoff commit.

## Changes

- Added a presentation-only adapter that renders each of the four approved
  browser-safe lifecycle states from `ProjectCardViewModel`; it does not read
  persistence, queues, timers, local storage, or calculate lifecycle truth.
- Preserved the shared Entity Library card composition: semantic article,
  heading, native progress control, Master/metrics frame, disabled actions and
  focus treatment.
- Added a bounded visible technical-failure notice and semantic theme tokens
  for `needs-attention`; state labels remain visible text rather than
  color-only information.
- Kept review/workspace and sharing unavailable; no route, fixture, or client
  authority was added.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / command | Status |
|---|---|---|---|
| RC-009-03-01 | Every supplied approved state renders exact state/progress/Master/metric content without local reinterpretation. | `production-project-card-presentation.ts`; table-driven tests cover waiting, extracting, needs-attention and ready-for-review with fixed approved models. `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/production-project-card-presentation.test.mjs'` — passed, 2/2. | PROVEN |
| RC-009-03-02 | Status is not color-only; progress/status/action have accessible names and semantics; disabled action has a truthful reason. | `ProjectCardPresentation.tsx` preserves article/heading, visible status, labelled native progress and action description; focused test asserts the semantic contract. Same command — passed, 2/2. | PROVEN |
| RC-009-03-03 | Failure display is bounded and safe; unavailable action does not imply a review/workspace route or `/demo` authority. | Fixed model-owned `Processing needs attention.` notice is rendered only for `needs-attention`; production adapter test rejects local URL/fetch/timer/local-storage behavior. Same command — passed, 2/2. | PROVEN |
| RC-009-03-04 | Existing shared card composition and keyboard/focus behavior remain consumable for the approved model. | Shared `ProjectCardPresentation` and existing Button focus class are retained; adapter consumes the unchanged card contract. Focused test plus healthy Compose app suite passed. | PROVEN |

## Validation

- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/production-project-card-presentation.test.mjs && corepack pnpm build'` — passed: 2/2 focused tests and production build.
- `docker compose up -d --build` — PostgreSQL, Atlas and Agents Bridge healthy before the authoritative regression run.
- `docker compose exec -T atlas sh -lc 'cd /workspace/apps/atlas && corepack pnpm test'` — passed with no failures; the existing worker-runtime test remains intentionally skipped.
- `docker compose exec -T atlas sh -lc 'cd /workspace/apps/atlas && corepack pnpm exec eslint components/ProductionProjectCard.tsx components/ProjectCardPresentation.tsx components/production-project-card-presentation.ts tests/production-project-card-presentation.test.mjs'` — passed.
- `git diff --check` — passed.

## Scope boundary and visual note

The existing protected `/home` surface redirects to sign-in without a test
session. Full authenticated browser, responsive/reflow, theme, shell and
cross-user inspection belong to IDSER-009-04 and are not claimed here. This
checkpoint proves only the component presentation contract required by
IDSER-009-03.

Internal readiness: READY_FOR_CK
