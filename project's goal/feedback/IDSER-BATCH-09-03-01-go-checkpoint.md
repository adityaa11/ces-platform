# GO checkpoint: IDSER-009-03-01 / IDSER-BATCH-09-03-01

- **Ticket:** `IDSER-009-03-01-semantic-uncertainty-project-card-contract.md`
- **Ticket state:** `awaiting_review`
- **Consumed predecessor:** IDSER-009-03 `PASS` at `2a6a8f0`, recorded approved at `0ecf063`.
- **Implementation commit:** this GO handoff commit.

## Changes

- Extended the membership-first PostgreSQL project read with a same-project,
  same-workspace, current-bundle `EXISTS` signal for accepted candidate or
  relationship uncertainty flags. It returns only `hasSemanticUncertainty`.
- Added that required boolean to the deterministic card model and exact-key
  internal home-read parser; malformed types and semantic-detail fields fail
  closed.
- Rendered the exact visible text `Semantic uncertainty` only when the bounded
  boolean is true, alongside the unchanged primary state and unavailable action.
- Did not add persistence, migrations, client semantic access, routes, lifecycle
  decisions, progress changes, or browser-review authority.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / command | Status |
|---|---|---|---|
| RC-009-03-01-01 | Same-current-bundle candidate and relationship flags independently yield only a scoped boolean; false/legacy controls stay false. | `packages/atlas-db/src/project-repository.ts`; `packages/atlas-db/tests/project-repository.integration.test.ts` seeds separate candidate and relationship flags, unflagged controls, membership isolation, and private values. `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` — passed, 3/3. | PROVEN |
| RC-009-03-01-02 | Required boolean preserves every primary state and exact progress, including ready plus true and technical failure plus true. | Table-driven `apps/atlas/tests/home-projects.test.mjs`, test `IDSER-009-03-01 carries semantic uncertainty without changing lifecycle or progress`. `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs tests/production-project-card-presentation.test.mjs'` — passed, 10/10. | PROVEN |
| RC-009-03-01-03 | Exact-key transport accepts the boolean only and rejects malformed or extra semantic detail; raw semantic values never cross the model. | `apps/atlas/lib/home-project-read-service.ts` exact-key/type validation; focused parser negatives plus PostgreSQL serialized-read redaction assertion. Same focused Compose command — passed, 10/10; repository integration — passed, 3/3. | PROVEN |
| RC-009-03-01-04 | The exact non-color-only text renders iff true, including ready plus true and technical failure plus true, with primary status/action unchanged. | `ProductionProjectCard.tsx` and `ProjectCardPresentation.tsx`; focused rendered assertions for true/false and both primary states in `production-project-card-presentation.test.mjs`. Same focused Compose command — passed, 10/10. | PROVEN |

## Validation

- `docker compose ps` — PostgreSQL, Atlas, Agents Bridge, and worker healthy.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository'` — passed, 3/3 Compose PostgreSQL integration tests.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs tests/production-project-card-presentation.test.mjs'` — passed, 10/10 focused mapper, transport, and rendered-component tests.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && corepack pnpm build && corepack pnpm exec eslint components/ProductionProjectCard.tsx components/ProjectCardPresentation.tsx components/project-card-view-model.ts lib/home-projects.ts lib/home-project-read-service.ts tests/home-projects.test.mjs tests/production-project-card-presentation.test.mjs'` — passed.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck'` — passed.
- `git diff --check` — passed.

## Scope boundary and visual note

The Entity Library card stays the established visual ancestor. The indication is
plain visible text rather than a new color-only state or separate card surface.
Responsive/theme/shell and authenticated browser proof remain owned by
IDSER-009-04; lifecycle activation remains IDSER-009-03-02.

Internal readiness: READY_FOR_CK
