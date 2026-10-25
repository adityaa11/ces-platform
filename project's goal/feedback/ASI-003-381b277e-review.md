# CK review: ASI-003

- **Ticket / batch:** `ASI-003` / `Admin Sign-In Phase`
- **Reviewed commit:** `381b277e09fa7d246cda14cb25a68e0c7e2bc836`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Sign_In_Phase/ASI-003-admin-sign-in-ui-boundary-tests.md`
- **Ticket state at review:** `awaiting_review`
- **Review type:** first CK review
- **GO checkpoint:** `project's goal/feedback/ASI-003-go-checkpoint.md`
- **Accepted predecessors:** ASI-001 `PASS` (`ASI-001-69d0642c-verification.md`); ASI-002 `PASS` (`ASI-002-a24a619a-review.md`)
- **Result:** `PASS`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely and records `awaiting_review`.
The GO checkpoint records `HEAD`; the current `HEAD` is the reviewed commit
`381b277e09fa7d246cda14cb25a68e0c7e2bc836`. The committed ASI-003 ticket,
boundary test, and GO checkpoint are present at that revision, and none of
those target paths has a worktree difference. The primary worktree contains
unrelated dirty and untracked material, but no such path overlaps this review
target, so the committed checkpoint is unambiguous.

This is the first CK review. It covers only ASI-003, its explicit source
references (implementation brief sections 3 and 6–9 and the standalone
interaction reference), the approved ASI-001/ASI-002 boundaries it consumes,
the committed boundary test and checkpoint evidence, and direct regressions
necessary to evaluate those obligations. ASI-004 visual and accessibility
review remains separately scoped.

## Review Contract assessment

| Row | Ticket authority | Required proof | Status | CK result |
| --- | --- | --- | --- | --- |
| `RC-ASI-003-01` | Outcome and acceptance: direct `/admin/sign-in` rendering and refresh remain on the Admin page without redirect. | Production response is `200`, Admin identity is rendered, and refresh preserves the same route and page. | `PROVEN` | — |
| `RC-ASI-003-02` | Scope and acceptance: existing `atlas-theme` authority controls persisted light/dark presentation; the standalone `atlas-admin-login-theme` key is not used. | Light and dark selection update root presentation, `atlas-theme` storage and its permitted cookie; refresh restores the selected preference; the standalone key remains absent. | `PROVEN` | — |
| `RC-ASI-003-03` | Scope and acceptance: local form/theme behavior avoids both prohibited endpoints, navigation, session/auth-cookie creation, and credential persistence or logging. | Valid local submission stays on `/admin/sign-in`, observes no prohibited request, creates no cookie before theme interaction, stores/logs no password, and leaves only `atlas-theme` after a theme action. | `PROVEN` | — |
| `RC-ASI-003-04` | Outcome, scope, and acceptance: public landing, sign-in, and sign-up do not acquire Admin Console navigation or altered public entry behavior. | `/`, `/sign-in`, and `/sign-up` retain established copy, contain no Admin entry or Admin Console text, and retain standard public actions and links. | `PROVEN` | — |
| `RC-ASI-003-05` | Acceptance: run directly affected lint/typecheck/build validations and focused tests; report unrelated failures separately. | The new test lints, the production build includes `/admin/sign-in`, and focused browser/public regression tests pass; unrelated existing lint/typecheck failures are identified without repair. | `PROVEN` | — |

## Evidence and validation

- Commit inspection: `381b277e` changes only the ASI-003 boundary spec, the
  ASI-003 ticket state, and the GO checkpoint. No production implementation,
  authentication, theme-provider, public-route, or navigation code changed.
- `corepack pnpm --filter @atlas/app exec eslint tests/browser/admin-sign-in-boundary.spec.mjs`: PASS.
- `git diff 381b277e^ 381b277e --check -- apps/atlas/tests/browser/admin-sign-in-boundary.spec.mjs`: PASS.
- `corepack pnpm --filter @atlas/app build`: PASS; route inventory includes
  `/admin/sign-in`.
- `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-boundary.spec.mjs`: PASS — 4 passed against the production build at `http://127.0.0.1:3001`. The new tests prove direct GET/refresh, Admin identity, shared theme persistence and key exclusion, prohibited-request absence, no auth cookie before theme, password non-persistence/non-logging, unchanged local submission URL, and public-route isolation.
- `node --test --test-concurrency=1 tests/rendered-html.test.mjs tests/auth-boundary.test.mjs`: PASS — 14 passed.
- `corepack pnpm --filter @atlas/app lint`: FAIL only on unrelated existing
  errors in `components/RuntimeFixtureRoute.tsx`,
  `scripts/perception-capacity-qualification.mjs`,
  `scripts/perception-three-pdf-qualification.mjs`, and `vite.config.ts`;
  the reviewed ASI-003 paths are not implicated.
- `corepack pnpm --filter @atlas/app exec tsc --noEmit`: FAIL only on the
  checkpoint's recorded unrelated fixture, runtime, worker, and source-
  workspace errors; no ASI-003 production or test path is implicated. The
  production build remains green.

## Findings

None. All five ticket-derived Review Contract rows are proven. No
implementation-repairable violation remains.

## Frozen Finding Closure Matrix

This first review produced no findings. There are therefore no `CK-###`
findings or closure clauses to freeze; the complete closure target is the
five-row Review Contract assessment above, with all rows `PROVEN`.

## Scope-change observations

None. The unrelated full-lint and typecheck failures are recorded validation
observations already permitted by the ticket; they do not require a ticket
amendment, new provider/runtime or deployment target, architecture or product
decision, policy decision, or predecessor reopening.

## Decision

`PASS`. The committed ASI-003 checkpoint satisfies the frozen route, shared
theme, local-only form, public-navigation isolation, and validation contract.
This first CK result does not authorize ASI-004 or another workflow cycle.
