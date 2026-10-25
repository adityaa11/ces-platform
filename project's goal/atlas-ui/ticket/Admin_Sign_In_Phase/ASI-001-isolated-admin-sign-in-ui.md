# ASI-001: Establish the isolated Atlas Admin Sign-In route and visual frame

- **State:** proposed
- **Depends on:** [Admin Sign-In Phase contract](README.md)
- **Application:** `apps/atlas`
- **Primary source:** [implementation brief](../../atlas-admin-sign-in-ui.md), [standalone prototype](../../atlas-admin-login-standalone.html), [light preview](../../atlas-admin-login-light-preview.png), [mobile preview](../../atlas-admin-login-mobile-preview.png)

## Outcome

Implement the directly renderable, presentation-only Admin Console route at
`/admin/sign-in`. This ticket establishes the approved desktop/mobile visual
frame and shared Atlas-theme presentation. Local credential-form behavior is
deliberately completed by ASI-002.

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
- Render semantic, editable email and password controls with their approved
  labels, autocomplete values, icons, password-visibility control, and one
  visually dominant Sign in action. Before ASI-002, the form action must not
  submit, navigate, or perform any request.
- Render the neutral UI-only informational-result region in its hidden state;
  ASI-002 owns revealing it and all validation/error state.
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
  semantic input type/autocomplete value. The password control and primary
  action have accessible names.
- Theme controls are the only active control in this ticket. They must reflect
  the current explicit Atlas selection with `aria-pressed` and call the shared
  provider.
- ASI-002 owns validation, `aria-invalid`, field errors, password show/hide,
  submit behavior, focus restoration, and revealing/clearing the informational
  result. Neither ticket may create a loading, authentication-success, or
  authenticated state.

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
- The pre-interaction form is keyboard reachable and has the correct native
  semantics, but it performs no submission or password-mode change until
  ASI-002.
- Existing `/sign-in`, `/sign-up`, `/`, and `/home` presentation and navigation
  are not changed, and none display an Admin sign-in link.
- No Admin route other than `/admin/sign-in` is introduced.

## Validation handoff

Provide the presentation frame consumed by
[ASI-002](ASI-002-admin-sign-in-local-form-behavior.md),
[ASI-003](ASI-003-admin-sign-in-ui-boundary-tests.md), and
[ASI-004](ASI-004-admin-sign-in-visual-accessibility-review.md). Record files
changed, route rendered, reused tokens/provider, and any unavoidable visual
deviation from the supplied sources.
