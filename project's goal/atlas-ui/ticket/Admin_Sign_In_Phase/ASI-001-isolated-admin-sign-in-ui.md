# ASI-001: Implement the isolated Atlas Admin Sign-In UI

- **State:** proposed
- **Depends on:** [Admin Sign-In Phase contract](README.md)
- **Application:** `apps/atlas`
- **Primary source:** [implementation brief](../../atlas-admin-sign-in-ui.md), [standalone prototype](../../atlas-admin-login-standalone.html), [light preview](../../atlas-admin-login-light-preview.png), [mobile preview](../../atlas-admin-login-mobile-preview.png)

## Outcome

Implement a complete, presentation-only Admin Console login screen at
`/admin/sign-in`. Direct navigation and refresh render the isolated interface;
the screen has no authentication or Admin-route behavior beyond local UI
interactions.

## Scope

- Add `apps/atlas/app/admin/sign-in/page.tsx` using the application's App
  Router conventions. Keep the route lightweight and place client-only state
  in a dedicated Admin-specific component when required.
- Reproduce the prototype's layout and content:
  - Header with Atlas mark, `Atlas`, `Admin Console`, `Private access`, and a
    compact light/dark control group.
  - Centered `Atlas / Administration` context line and a bounded form surface.
  - `Authorized operators only`, `Welcome back.`, the supplied explanatory
    copy, email field, password field, password visibility button, one `Sign
    in to Admin Console` action, the restricted-access notice, quiet
    under-card statement, and the two-part footer.
  - The subdued grid/ring background treatment, semantic borders, elevation,
    focus treatment, and reduced-motion handling shown in the prototype.
- Reuse Atlas semantic tokens and the existing ThemeProvider. Build an
  Admin-specific visual presentation of the light/dark controls if the shared
  text selector cannot faithfully reproduce the supplied icon control, but
  make it call the existing provider rather than introducing another authority.
- Bind form data to component-local state only. Support typing, email-format
  and required-field validation, field-error clearing while editing, password
  show/hide, keyboard navigation, and a local informational result after valid
  submit. Submission always prevents default.
- Preserve the prototype’s intent for the informational result: state plainly
  that this is a UI-only screen and that credentials were not sent or stored.
- Use scoped styles or an Admin-specific namespace. The implementation must
  not depend on or modify the ordinary auth page's generic `.auth-card`,
  `.sign-in-form`, `.topbar`, or `.brand` rules.

## Explicitly out of scope

- Any authentication transport, Better Auth call, session resolution, role
  check, session cookie, middleware, login-success simulation, or redirect.
- Any request to `POST /api/auth/sign-in/email` or `GET /api/admin/identity`.
- Admin dashboard/shell/provider pages, protected routes, backend endpoint,
  schema, migration, or authority change.
- Links to this route from `/`, `/home`, `/sign-in`, `/sign-up`, or existing
  public/workspace navigation.
- Changes to existing public auth components or global auth selectors.

## Implementation contract

### Theme ownership

- Use the existing Atlas `ThemeProvider`, its current `atlas-theme`
  persistence, and the root `data-theme` attribute.
- Never copy the prototype's `atlas-admin-login-theme` localStorage behavior.
- Both theme buttons have accessible names and correctly reflect the current
  explicit Atlas light/dark selection with `aria-pressed`.
- Do not alter global system-theme fallback behavior solely for this route.

### Form and interaction states

- Email and password each have a visible text label, required indication, and
  semantic input type/autocomplete value.
- Invalid email and missing fields receive readable text errors, `aria-invalid`,
  and focus moves to the first invalid field on submit.
- Password visibility control updates its accessible name, pressed state, icon,
  and input type, then returns focus to the password input.
- Editing either field clears its own error and removes the informational
  result; no value is logged, persisted, transmitted, or exposed outside the
  browser form control.
- The only post-submit success-like state is the prototype's neutral
  informational message. It must never imply that sign-in succeeded.
- Define visible default, hover, focus-visible, active, selected, error, and
  informational states. Loading/disabled states are not required because the
  form performs no asynchronous work.

### Responsive and visual fit

- Keep the form surface at the prototype's comfortable desktop maximum of
  456 px; leave surplus canvas space outside the form instead of stretching
  its interior.
- At the prototype's compact breakpoint, retain a one-column composition,
  keep controls usable, hide only the documented secondary header/footer
  metadata, and reduce surrounding/card padding before reducing legible type.
- At very narrow widths, allow all identity and notice copy to wrap by words;
  do not clip, ellipsize, or horizontally scroll valid content.
- Preserve the screenshot hierarchy in both themes: header context, centered
  form, one dominant action, subdued access explanation, then quiet footer.

## Acceptance criteria

- `GET /admin/sign-in` renders directly and remains rendered after refresh;
  no existing session affects the route.
- The resulting desktop/light and compact/dark screen closely match the
  supplied preview composition, copy, proportions, surfaces, icon placement,
  spacing, and responsive omissions.
- Theme controls use the existing Atlas theme behavior; changing theme updates
  the page and remains consistent with the rest of Atlas.
- Empty email/password, malformed email, valid local submission, password
  show/hide, tab order, and visible focus all behave as specified without any
  network request or navigation.
- Existing `/sign-in`, `/sign-up`, `/`, and `/home` presentation and navigation
  are not changed, and none display an Admin sign-in link.
- No Admin route other than `/admin/sign-in` is introduced.

## Validation handoff

Provide the implementation needed by [ASI-002](ASI-002-admin-sign-in-ui-boundary-tests.md)
and [ASI-003](ASI-003-admin-sign-in-visual-accessibility-review.md). Record
files changed, route rendered, reused tokens/provider, and any unavoidable
visual deviation from the supplied sources.
