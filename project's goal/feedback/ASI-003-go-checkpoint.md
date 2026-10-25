# ASI-003 GO checkpoint: Admin Sign-In UI boundary tests

- **Ticket:** [ASI-003](../atlas-ui/ticket/Admin_Sign_In_Phase/ASI-003-admin-sign-in-ui-boundary-tests.md)
- **Checkpoint state:** `awaiting_review`
- **Implementation commit:** `HEAD` (ASI-003 implementation checkpoint)
- **Dependencies consumed:** ASI-001 and ASI-002 approved final checkpoints; their implemented Admin route, local form behavior, and shared `ThemeProvider` boundary were used without reopening either ticket.

## Bounded change

Added `apps/atlas/tests/browser/admin-sign-in-boundary.spec.mjs`. The focused
production-browser coverage proves the direct Admin route boundary, existing
theme authority, local-only form behavior, and public-entry isolation. The
ASI-002 component-local test was preserved unchanged.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-ASI-003-01` | Outcome and acceptance: direct `/admin/sign-in` rendering and refresh remain on the Admin page without redirect. | Production response is `200`, Admin identity is rendered, and refresh preserves the same route and page. | `apps/atlas/tests/browser/admin-sign-in-boundary.spec.mjs`, test `ASI-003 directly renders and refreshes the isolated Admin sign-in route`; `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-boundary.spec.mjs` — PASS, 4 passed. | `PROVEN` |
| `RC-ASI-003-02` | Scope and acceptance: existing `atlas-theme` authority controls persisted light/dark presentation; no `atlas-admin-login-theme` use. | Light and dark actions update root presentation, `atlas-theme` storage and its permitted cookie; refresh restores the chosen light preference; the standalone key remains absent. | `admin-sign-in-boundary.spec.mjs`, test `ASI-003 uses the shared Atlas theme authority and leaves local form data local`; Playwright command above — PASS. | `PROVEN` |
| `RC-ASI-003-03` | Scope and acceptance: all local form/theme behavior avoids both prohibited endpoints, navigation, session/auth-cookie creation, and credential persistence or logging. | Valid local submission stays on `/admin/sign-in`, makes no prohibited request, creates no cookie before theme interaction, stores/logs no password, and leaves only `atlas-theme` after a theme action. | `admin-sign-in-boundary.spec.mjs`, same theme/local-boundary test; preserved `admin-sign-in-local-form.spec.mjs`; Playwright command above — PASS. | `PROVEN` |
| `RC-ASI-003-04` | Outcome, scope, and acceptance: public landing, sign-in, and sign-up do not acquire Admin Console navigation or altered public entry presentation. | `/`, `/sign-in`, and `/sign-up` render their established copy with no `/admin/sign-in` link or Admin Console text; standard public sign-in/sign-up actions and links remain present. | `admin-sign-in-boundary.spec.mjs`, test `ASI-003 preserves public entry routes without Admin Console navigation`; browser command above — PASS. `node --test --test-concurrency=1 tests/rendered-html.test.mjs tests/auth-boundary.test.mjs` — PASS, 14 passed. | `PROVEN` |
| `RC-ASI-003-05` | Acceptance: run directly affected lint/typecheck/build and focused tests; report unrelated failures without repair. | New test lints; production build includes `/admin/sign-in`; focused browser and public route/auth regressions pass. | `corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-sign-in-boundary.spec.mjs` — PASS. `corepack pnpm --filter @atlas/app build` — PASS. Focused commands above — PASS. Full app lint and plain `tsc --noEmit` were also run and have pre-existing failures outside this ticket, recorded below. | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-sign-in-boundary.spec.mjs`: PASS.
- `git diff --check -- apps/atlas/tests/browser/admin-sign-in-boundary.spec.mjs`: PASS.
- `corepack pnpm --filter @atlas/app build`: PASS; route inventory includes `/admin/sign-in`.
- `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-boundary.spec.mjs`: PASS — 4 passed against a locally started production build at `http://127.0.0.1:3001`.
- `node --test --test-concurrency=1 tests/rendered-html.test.mjs tests/auth-boundary.test.mjs`: PASS — 14 passed.
- `corepack pnpm --filter @atlas/app lint`: unrelated existing failures in `components/RuntimeFixtureRoute.tsx`, `scripts/perception-capacity-qualification.mjs`, `scripts/perception-three-pdf-qualification.mjs`, and `vite.config.ts`; not repaired under this ticket.
- `corepack pnpm --filter @atlas/app exec tsc --noEmit`: unrelated existing errors across fixture, runtime, worker, and source-workspace modules; not repaired under this ticket. The app's production build above is green.

## Handoff

ASI-003 is ready for CK. The checkpoint adds evidence only and makes no
production behavior, authentication, navigation, public-route, or theme
authority change. ASI-004 retains visual and accessibility review ownership.

Internal readiness: READY_FOR_CK
