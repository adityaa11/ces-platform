# CK review: ASI-002

- **Ticket / batch:** `ASI-002` / `Admin Sign-In Phase`
- **Reviewed commit:** `a24a619a4b7fc97bb391d301dd5ce5d338cd974d`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Sign_In_Phase/ASI-002-admin-sign-in-local-form-behavior.md`
- **Ticket state at review:** `awaiting_review`
- **Review type:** first CK review
- **GO checkpoint:** `project's goal/feedback/ASI-002-go-checkpoint.md`
- **Accepted predecessor:** ASI-001 `PASS` (`ASI-001-69d0642c-verification.md`)
- **Result:** `PASS`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely and records `awaiting_review`.
The GO checkpoint records `HEAD`; the current `HEAD` is the reviewed commit
`a24a619a4b7fc97bb391d301dd5ce5d338cd974d`, and the committed ticket and
checkpoint are present at that revision. The reviewed implementation, focused
test, ticket, and checkpoint paths have no worktree differences from `HEAD`.
The primary worktree contains unrelated dirty and untracked material, but no
such path overlaps this review target, so the target is unambiguous.

This is the first CK review. It covers only ASI-002, its explicit source
references and approved ASI-001 boundary, the committed Admin-local form
behavior, its focused browser test, and direct regressions necessary to assess
those obligations. ASI-003 cross-route/theme boundary evidence and ASI-004
visual/accessibility review remain separately scoped.

## Review Contract assessment

| Row | Ticket authority | Required proof | Status | CK result |
| --- | --- | --- | --- | --- |
| `RC-ASI-002-01` | Scope: submit validation; acceptance: empty/malformed values expose associated non-color errors and retain `/admin/sign-in`. | Empty values and malformed email render readable associated errors, `aria-invalid`, and focus the first invalid control. | `PROVEN` | — |
| `RC-ASI-002-02` | Scope: field-local error clearing and local-result clearing; acceptance: valid values expose only the neutral UI-only result. | Editing clears the edited field's error and either-field result; valid values show the exact not-sent/not-stored UI-only copy. | `PROVEN` | — |
| `RC-ASI-002-03` | Scope/acceptance: password show/hide keeps accessible name, pressed state, icon, and input type synchronized and restores password focus. | Enter and Space activation produce the paired visible/hidden states and return focus to the password input. | `PROVEN` | — |
| `RC-ASI-002-04` | Outcome and explicit exclusions: local UI only; no request, auth helper, session/cookie mutation, credential persistence/logging, or navigation. | Changed-source inspection finds no prohibited seam; the browser test observes no credential request and unchanged `/admin/sign-in`. | `PROVEN` | — |
| `RC-ASI-002-05` | Acceptance: usable focus/visible-focus treatment and materially unchanged ASI-001 frame except specified local states. | Focus transitions pass; initial production render retains the approved frame, one primary action, no errors/result, and zero horizontal overflow; CSS changes are state-scoped. | `PROVEN` | — |
| `RC-ASI-002-06` | Scope: smallest focused behavior tests; validation handoff. | Focused backend-free browser coverage and required lint, build, and diff-hygiene validation pass. | `PROVEN` | — |

## Evidence and validation

- `pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx tests/browser/admin-sign-in-local-form.spec.mjs`: PASS.
- `pnpm --filter @atlas/app build`: PASS; route inventory includes `/admin/sign-in`.
- `pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs`: PASS, 1/1 against the locally started production build at `http://127.0.0.1:3001`. The test proves empty and malformed validation, associated descriptions, first-invalid focus, valid neutral result, result clearing, Enter/Space password toggling, synchronized accessible state/type, password focus restoration, unchanged URL, and no observed credential requests.
- Production render probe at `1440 x 1000`: `/admin/sign-in`; heading `Welcome back.`; card `456 x 559.125`; footer `66px` high and fully in the viewport; one submit button; initial status hidden; zero alert nodes; `scrollWidth === clientWidth === 1440`.
- `git diff --check a24a619a^ a24a619a --` on the reviewed implementation, focused test, ticket, and checkpoint paths: PASS.
- Changed-file and source-boundary inspection: the commit changes only `AdminSignIn`, its scoped Admin state styles, the focused test, the ASI-002 ticket, and the GO checkpoint. `AdminSignIn.tsx` contains no fetch/XHR, auth helper, storage, cookie, logging, or navigation seam.

The initial exploratory dev-server run did not hydrate before a click and was
not used as decision evidence; the checkpoint's specified production-build
harness was then started and passed.

## Findings

None. All six ticket-derived Review Contract rows are proven. No
implementation-repairable violation remains.

## Frozen Finding Closure Matrix

This first review produced no findings. There are therefore no `CK-###`
findings or closure clauses to freeze; the complete closure target is the
six-row Review Contract assessment above, with all rows `PROVEN`.

## Scope-change observations

None. The review requires no ticket amendment, new provider/runtime or
deployment target, architecture or product decision, policy decision, or
reopening of ASI-001.

## Decision

`PASS`. The committed ASI-002 implementation satisfies the frozen local form
behavior contract and its validation handoff without changing authentication,
theme authority, route boundaries, credential handling, or the approved
visual frame. This first CK result does not authorize ASI-003, ASI-004, or
another workflow cycle.
