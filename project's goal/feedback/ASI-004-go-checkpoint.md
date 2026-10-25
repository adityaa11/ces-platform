# GO checkpoint: ASI-004

- **Ticket / batch:** `ASI-004` / `Admin Sign-In Phase`
- **Implementation-review target:** `fa5807ec1235f983e7c8a6295cae899dd5e3f5b4` (`HEAD` at review start)
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Sign_In_Phase/ASI-004-admin-sign-in-visual-accessibility-review.md`
- **State transition:** `proposed` → `awaiting_review`
- **Accepted predecessors:** ASI-001 `PASS` (`ASI-001-69d0642c-verification.md`); ASI-002 `PASS` (`ASI-002-a24a619a-review.md`); ASI-003 `PASS` (`ASI-003-381b277e-review.md`)

## Scope and boundary

ASI-004 is a rendered-quality and accessibility evidence ticket. No product
source was changed. The review used the production build at
`http://127.0.0.1:3001/admin/sign-in`, the supplied light-desktop and
dark-mobile previews, the frozen ticket, and the approved predecessor
boundaries. It does not reopen ASI-001's visual-frame implementation, ASI-002
local behavior, or ASI-003 route/theme/public-boundary evidence.

The primary worktree contains unrelated dirty and untracked material. It does
not overlap the Admin sign-in implementation or the ASI ticket/checkpoint
paths used here; it was preserved.

## Rendered review record

### Viewport/theme matrix and screenshot observations

| Viewport | Theme | Rendered observation | Result |
| --- | --- | --- | --- |
| `1440 x 900` | Light | In-app-browser screenshot matched the supplied light desktop composition: centered `456px` card, full header context and footer metadata, subdued grid/rings, and one dominant action. Measurement: card `456 x 558.6px`, `y=177`, footer within the viewport. | Meets reference calibration. |
| `1440 x 900` | Dark | Reciprocal desktop screenshot preserved the same card proportions, copy, control structure, and visual priority with the approved dark semantic surface treatment. | Theme parity observed. |
| `390 x 844` | Dark | In-app-browser screenshot matched the supplied compact dark composition. Card measured `356.4 x 559.4px` at `x=17`, heading stayed one line (`304.8px` wide), footer remained fully rendered, and root `scrollWidth === clientWidth === 390`. | Meets reference calibration and no horizontal overflow. |
| `390 x 844` | Light | Reciprocal mobile screenshot preserved the one-column task flow, card hierarchy, focusable controls, and readable source copy. | Theme parity observed. |
| `360 x 800` | Dark | Additional constrained-width/200%-zoom-equivalent check retained the one-line heading (`32.5px` height), usable `288.4px` heading width, fully rendered footer, and root `scrollWidth === clientWidth === 360`. | No clipping or horizontal overflow. |

At compact widths, `Private access` and only the footer's right metadata were
hidden (`display: none`); the appearance controls, Admin identity, task form,
access notice, and left footer metadata remained present. The supplied previews
and production render differ only in browser rasterization/anti-aliasing; no
source-grounded visual deviation was found.

### Interaction, accessibility, and motion observations

- Keyboard-only traversal reached Light theme → Dark theme → Email address →
  Password → Show password → Sign in in visual/DOM order. Email focus showed
  the required obvious purple focus-visible ring in the compact screenshot.
- Space on `Show password` changed the accessible control to `Hide password`,
  set its pressed state true, revealed the password field, and restored focus
  to that field. The focused ASI-002 browser regression separately covers both
  Enter and Space plus return focus.
- Empty submit focused Email address and exposed both readable errors as alert
  nodes. Each invalid input had `aria-invalid="true"` and the correct
  `aria-describedby` association (`admin-email-error` or
  `admin-password-error`). Errors use text and the error border, not color
  alone.
- A valid local submission kept `/admin/sign-in`, retained the local password
  visibility state, and exposed the polite status: `This is a UI-only
  prototype. Your credentials were not sent or stored.` No success or
  authenticated state was rendered.
- A long plausible address (`operator.with.a.very.long.but.plausible.admin.identifier@atlas-platform.example`)
  remained a native editable input value. It had an internal scroll width of
  `544px` in a `288px` input without changing document width; the caret and
  standard input horizontal scrolling keep the entire value reachable, with no
  ellipsis or page overflow.
- A Playwright `prefers-reduced-motion: reduce` probe at `390 x 844` reported
  the media query active, the Admin motion rule present, submit transition
  duration `1e-05s`, animation duration `0s`, and no horizontal overflow.

## Validation

- `corepack pnpm --filter @atlas/app build`: **PASS**. Production route
  inventory includes `/admin/sign-in`.
- `corepack pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx app/admin/sign-in/page.tsx`: **PASS**.
- `corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-boundary.spec.mjs`: **PASS** — 4 passed. This carries forward direct-route/refresh, shared-theme authority, local-only submission, no prohibited request or credential persistence, public-route isolation, validation, and password-toggle proof.
- `corepack pnpm --filter @atlas/app lint`: **FAIL, unrelated existing errors** only in `components/RuntimeFixtureRoute.tsx`, `scripts/perception-capacity-qualification.mjs`, `scripts/perception-three-pdf-qualification.mjs`, and `vite.config.ts`; none are Admin sign-in review paths.
- `corepack pnpm --filter @atlas/app exec tsc --noEmit`: **FAIL, unrelated existing errors** in demo/source-workspace/fixture/worker/type-environment paths, including `app/demo/page.tsx`, `components/SourcesWorkspace.tsx`, `components/WorkspaceSwitcherPreview.tsx`, `derived-asset-resolver.ts`, `lib/*`, `vite.config.ts`, `worker/index.ts`, and `packages/atlas-fixtures/src/*`. No error names `AdminSignIn.tsx` or `app/admin/sign-in/page.tsx`.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-ASI-004-01` | Outcome, scope, acceptance: approved visual hierarchy and supplied light-desktop/dark-mobile references. | Both reference compositions, plus reciprocal themes, preserve Atlas/Admin identity, one-action hierarchy, subordinate notices/footer, token-led visual language, and disciplined surfaces. | Production rendered screenshot matrix at `1440 x 900` and `390 x 844`; measurements above; source-preview comparison. | `PROVEN` |
| `RC-ASI-004-02` | Scope and review criteria: responsive composition, source-copy readability, reduced secondary content, no clipping/horizontal scroll, constrained-width reflow. | Centered/bounded desktop card; compact one-column flow hides only specified secondary content; all source copy and controls remain reachable; root has no horizontal overflow. | Rendered `390 x 844` and `360 x 800` checks: `scrollWidth === clientWidth`; compact screenshots and measurements above. | `PROVEN` |
| `RC-ASI-004-03` | Scope, criteria, acceptance: keyboard access, visible focus, labels/names, error association/announcement, non-color errors, password visibility, local result. | Ordered keyboard traversal and activation for each control; obvious focus ring; associated invalid states and alerts; synchronized password state; polite UI-only status. | Browser AX observations and keyboard probes above; focused ASI-002 Playwright regression in the recorded 4-test command. | `PROVEN` |
| `RC-ASI-004-04` | Review criteria: light/dark parity and restrained reduced-motion treatment. | Same hierarchy/meaning/contrast-oriented semantic treatment in both themes; reduced-motion preference materially suppresses motion. | Four-theme viewport matrix; `prefers-reduced-motion: reduce` Playwright probe (`1e-05s` transition, `0s` animation). | `PROVEN` |
| `RC-ASI-004-05` | Boundary and validation record: no public registration/navigation change or authenticated/success state; record build, focused predecessor tests, lint/typecheck outcomes. | Rendered route has no prohibited public/authenticated state and focused regression/build proof passes; unrelated validation failures are identified without repair. | Rendered state observations; production build PASS; focused Playwright 4/4 PASS; scoped lint PASS; full lint/typecheck failures recorded as unrelated. | `PROVEN` |

Rendered review evidence has no non-blocking findings. Final workflow `PASS`,
`PASS WITH FINDINGS`, or `FAIL` remains a CK decision; this GO checkpoint does
not self-issue one.

Internal readiness: READY_FOR_CK
