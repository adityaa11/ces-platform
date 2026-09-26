# PCC-005 browser regressions

These tests execute the real hydrated `/home` and `/demo` components in Chromium.
Run from the repository root against the Compose-managed app and PostgreSQL:

```powershell
docker compose build --quiet atlas
docker compose up -d --no-build --wait
docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright install --with-deps chromium
docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser
```

Chromium and its system libraries are test prerequisites installed in the running
container; repeat the install after recreating it. They do not change the app's
runtime image or production entrypoint. `@playwright/test` is a pinned development
dependency. The suite requires `ATLAS_DOCKER=true` and `DATABASE_URL`; missing
prerequisites fail instead of silently skipping authenticated integration.

Each production case signs up a unique local test user, drives the dialog through
validation, loading, field errors, form errors and malformed success, then retries
the same mounted component against the real production API. Only the failure
responses are mocked. Assertions cover disabled controls, one pending request,
input/file retention, safe alerts, no premature refresh, success close/reset,
server refresh, a persisted waiting card after reload, and no fixture requests.
Created project/user rows are removed in `finally`. PDF bytes use the same local
DocumentStore as the existing creation integration tests.

The fixture case executes `createFixtureProject`, simulated processing, invite,
role change and removal through the actual UI. Only `/api/local-fixtures`
persistence is mocked, using the existing owner scenario for hydration. It
asserts the scenario-specific hydration behavior and absence of production
requests. Existing `rendered-html.test.mjs` scenarios remain complementary route
and CSP coverage.

Both themes are exercised at 1440×1000, 900×1000, 390×844 and 640×720 CSS pixels.
The last is a reflow equivalent for a 1280px viewport at 200% zoom, not a claim
that the browser zoom setting was changed. Screenshots in `test-results/` cover
empty/hover, dialog keyboard focus, validation error, loading, field error,
request error, malformed success, success/waiting card and fixture library/dialog.
The suite checks horizontal overflow; screenshots require human/agent inspection
for visual quality and do not constitute automatic visual approval. Generated
screenshots and failure traces are ignored by Git and Docker build context.

The helper suite remains independently runnable:

```powershell
docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/production-project-create.test.mjs
```

It checks exact FormData entries/file bytes, validation, response mapping,
concurrent promise coalescing and failure-then-success on the same submitter for
network, 400/409/413/415/500, invalid JSON and invalid schema failures.
