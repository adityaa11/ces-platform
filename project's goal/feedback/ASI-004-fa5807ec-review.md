# CK review: ASI-004

- **Ticket / batch:** `ASI-004` / `Admin Sign-In Phase`
- **Reviewed implementation commit:** `fa5807ecd8b5dc58e846807cbea6660127070c84`
- **Review-recording commit:** `711808d1adccbe29ead8dd5cabce2e03fad2c9df` (current `HEAD`)
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Sign_In_Phase/ASI-004-admin-sign-in-visual-accessibility-review.md`
- **Ticket state at review:** `awaiting_review`
- **Review type:** first CK review
- **GO checkpoint:** `project's goal/feedback/ASI-004-go-checkpoint.md`
- **Accepted predecessors:** ASI-001 `PASS` (`ASI-001-69d0642c-verification.md`); ASI-002 `PASS` (`ASI-002-a24a619a-review.md`); ASI-003 `PASS` (`ASI-003-381b277e-review.md`)
- **Result:** `PASS`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely and records `awaiting_review`.
The GO checkpoint names `fa5807ecd8b5dc58e846807cbea6660127070c84` as the
implementation-review target. The current `HEAD`, `711808d1`, adds only the
ASI-004 ticket state transition and the committed GO checkpoint; it has no
Admin implementation-path difference from the named target. The reviewed
implementation is therefore unambiguous. The primary worktree contains
unrelated dirty and untracked material, but no dirty path overlaps the Admin
sign-in implementation, tests, ticket, or ASI-004 checkpoint paths.

This is the first CK review. It covers ASI-004, its explicit visual prototype
and supplied light/dark preview references, the approved ASI-001/ASI-002/ASI-003
boundaries it consumes, and direct regressions necessary to evaluate those
obligations. It does not reopen predecessor implementation or evidence gates,
and it does not broaden the presentation-only Admin scope.

## Review Contract assessment

| Row | Ticket authority | Required proof | Status | CK result |
| --- | --- | --- | --- | --- |
| `RC-ASI-004-01` | Outcome, scope, and acceptance: approved visual hierarchy and supplied light-desktop/dark-mobile references. | Light desktop and dark mobile calibrate to the supplied compositions; reciprocal themes preserve Atlas/Admin identity, one-action hierarchy, subordinate notices/footer, token-led visual language, and disciplined surfaces. | `PROVEN` | — |
| `RC-ASI-004-02` | Scope and criteria: responsive composition, readable source copy, reduced secondary content, no clipping or horizontal scroll, and constrained-width reflow. | Desktop card remains centered and bounded; compact layout is one-column, hides only specified secondary content, keeps copy and controls reachable, and has no root horizontal overflow at `390 x 844` or `360 x 800`. | `PROVEN` | — |
| `RC-ASI-004-03` | Scope, criteria, and acceptance: keyboard access, visible focus, labels/names, error association/announcement, non-color errors, password visibility, and local result. | Controls are keyboard reachable and operable with an obvious focus ring; invalid fields expose associated alerts and `aria-invalid`; password state is synchronized; valid submission stays local and exposes only the UI-only status. | `PROVEN` | — |
| `RC-ASI-004-04` | Review criteria: light/dark parity and restrained reduced-motion treatment. | Both themes preserve hierarchy, meaning, and control/error/result treatment; reduced motion materially suppresses transition and animation. | `PROVEN` | — |
| `RC-ASI-004-05` | Boundary and validation record: no public registration/navigation change or authenticated/success state; build, focused predecessor tests, lint/typecheck outcomes. | No prohibited public or authenticated state is rendered; production build and focused browser regressions pass; unrelated full lint/typecheck failures are identified without repair. | `PROVEN` | — |

## Evidence and validation

- Ticket and predecessor inspection confirmed the frozen ASI-004 scope, source
  references, and approved ASI-001/ASI-002/ASI-003 boundaries. The bounded
  implementation uses scoped Admin selectors, the existing `ThemeProvider`,
  native labels/inputs, visible focus styling, associated error nodes, and a
  local-only result; no reviewed implementation path is dirty.
- The committed GO record provides the viewport/theme screenshot matrix and
  source-preview comparison at `1440 x 900`, `390 x 844`, and the additional
  `360 x 800` constrained-width check, including the required state and
  boundary observations.
- `git diff --check fa5807ec^ fa5807ec`: PASS.
- `corepack pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx app/admin/sign-in/page.tsx`: PASS.
- `corepack pnpm --filter @atlas/app build`: PASS; the route inventory includes
  `/admin/sign-in`.
- `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-boundary.spec.mjs`: PASS — 4 passed against the locally started production server at `http://localhost:3001`. The first attempt correctly exposed only an unavailable-server environment condition; after starting the built server, the exact command passed.
- A bounded Playwright rendered probe against the production server passed for
  light/dark at `1440 x 900`, light/dark at `390 x 844`, dark at `360 x 800`,
  and reduced motion at `390 x 844`. It observed `scrollWidth === clientWidth`
  in every viewport, a `456px` desktop card, compact hiding of `Private access`
  and right footer metadata only, and reduced-motion transition/animation
  durations of `1e-05s`/`0s`.
- The GO record reports the full app lint and typecheck failures as unrelated
  existing errors outside the ASI-004 implementation and test paths. They do
  not block this ticket's scoped validation contract.

## Findings

None. All five ticket-derived Review Contract rows are proven. No
implementation-repairable violation remains.

## Frozen Finding Closure Matrix

This first review produced no findings. There are therefore no `CK-###`
findings or closure clauses to freeze; the complete closure target is the
five-row Review Contract assessment above, with all rows `PROVEN`.

## Scope-change observations

None. The initial unavailable-server result was an execution setup condition
and was resolved by starting the already-built local production server. The
review requires no ticket amendment, new provider/runtime or deployment
target, architecture or product decision, policy decision, or predecessor
reopening.

## Decision

`PASS`. The committed ASI-004 checkpoint proves the required rendered visual
hierarchy, responsive/theme parity, accessibility and local-result states,
reduced-motion treatment, prohibited-boundary preservation, and focused
validation contract. This first CK result does not authorize another workflow
cycle or broaden the Admin Sign-In phase.
