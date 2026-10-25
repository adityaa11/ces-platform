# GO checkpoint: AA × ASI Admin Sign-In Integration

- **Ticket:** `AA-ASI-Intergration`
- **Frozen ticket:** `project's goal/atlas-ui/AA-ASI-Intergration.md`
- **Ticket state:** `awaiting_review`
- **Target branch:** `codex/new-atlas-backend`
- **Review type:** implementation handoff from GO to CK
- **Credential authorization:** operator-authorized local development bootstrap only; no credential value, password hash, session token, or secret is recorded here.

## Scope and boundary

The existing ASI `/admin/sign-in` form now delegates credential verification
to Better Auth, then requires the existing `/api/admin/identity` response with
`role: "admin"` before displaying success. The implementation keeps the
operator on `/admin/sign-in`, preserves the existing theme and form behavior,
and performs best-effort sign-out after a `403` identity response.

The worker runtime fix keeps the Admin authorization reader on the existing
auth-only database entry point, avoiding unrelated database-barrel
initialization. No AA/ASI contract, historical checkpoint, public auth route,
bootstrap authority, or production configuration was changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AA-ASI-01` | Objective; §4.1 | The existing form submits to `POST /api/auth/sign-in/email` with same-origin credentials and the entered payload. | `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-boundary.spec.mjs tests/browser/admin-sign-in-local-form.spec.mjs` — 4 passed; real browser observed `POST /api/auth/sign-in/email` = 200. | `PROVEN` |
| `RC-AA-ASI-02` | §3; §4.2; §4.4 | Success requires `GET /api/admin/identity` = 200 with the existing `role: "admin"` identity contract; no redirect is introduced. | Same targeted browser command — 4 passed; authorized local smoke observed identity = 200 and UI confirmation `Admin access verified for Atlas Administrator.` | `PROVEN` |
| `RC-AA-ASI-03` | §4.3; §4.6; §5 rows 3, 5, 6 | Invalid, ordinary, unauthorized, or failed identity responses cannot reach Admin success; `403` receives best-effort sign-out. | `corepack pnpm --filter @atlas/app exec node --test tests/auth-boundary.test.mjs tests/admin-guard.test.mjs` — 10 passed; covers 401, 403 cleanup, ordinary role, malformed identity, retry behavior. | `PROVEN` |
| `RC-AA-ASI-04` | §4.5; §5 rows 1, 9, 10 | Existing validation, focus, theme, public routes, responsive behavior, and accessibility boundaries remain intact. | Targeted browser command — 4 passed; includes validation/focus, theme/storage, public route isolation; production build also passed. | `PROVEN` |
| `RC-AA-ASI-05` | §4.6; §5 rows 7, 8 | Repeated clicks are coalesced; credentials and session tokens are not logged or persisted in browser storage. | `corepack pnpm --filter @atlas/app exec node --test tests/auth-boundary.test.mjs tests/admin-guard.test.mjs` — 10 passed; source assertions and duplicate-submit test pass. | `PROVEN` |
| `RC-AA-ASI-06` | Acceptance §6; §5 AA-005 baseline | The authorized local bootstrap uses the existing coordinator and Better Auth authority, seals the marker, and the resulting account survives real login verification. | Temporary in-memory runner (`corepack pnpm --filter @atlas/app exec node --input-type=module -`) read root `.env` at runtime, verified `localhost:5432/atlas_dev`, completed bootstrap, and printed no credentials. Read-only DB check: `SEALED|admin-linked`, `1|1`; real browser round-trip passed. | `PROVEN` |
| `RC-AA-ASI-07` | §7 completion boundary | Focused implementation evidence is clean and no unrelated scope is modified. | Changed-file ESLint passed; `corepack pnpm --filter @atlas/app run build` passed; full app lint reports only five pre-existing errors in `RuntimeFixtureRoute.tsx`, two perception qualification scripts, and two `vite.config.ts` destructuring sites. | `PROVEN_WITH_LIMITATION` |

## Bounded changes

- `apps/atlas/components/AdminSignIn.tsx`
- `apps/atlas/components/admin-sign-in-submission.ts`
- `apps/atlas/lib/admin-guard.ts`
- `apps/atlas/app/globals.css`
- `apps/atlas/tests/auth-boundary.test.mjs`
- `apps/atlas/tests/browser/admin-sign-in-boundary.spec.mjs`
- `apps/atlas/tests/browser/admin-sign-in-local-form.spec.mjs`
- `packages/atlas-db/src/auth.ts`

The local credential runner was temporary and is not part of the production
authentication path or committed implementation.

Internal readiness: READY_FOR_CK
