# SOUT-002: Production account-menu wiring

- **State:** `awaiting_review`
- **Review batch:** `SOUT-BATCH-02`
- **Depends on:** SOUT-001 `PASS`
- **Baseline:** [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md) §§7–10, 14–15, 19, 21, 23–25; [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md) §§8–9, 18–19; [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md) §§4.1, 7, and 9.4; [Backend Phase README](../../README.md) fixture/production authority rules; AC-03–AC-07, AC-12, AC-15, and AC-16

## Outcome

Wire the production `/home` account menu to the SOUT-001 submission seam and make the shared shell's sign-out behavior explicit. Production uses a real session-sign-out button; `/demo` retains its intentionally separate fixture-link behavior.

## Scope

- Update `ProfileMenu.tsx` to render a real `Sign out` button for production session mode, not an `/sign-in` navigation link.
- Use the SOUT-001 seam and the existing client-router boundary; navigate with `router.replace("/sign-in")` only after successful sign-out.
- Show `Signing out...` and disable the control while the request is in flight.
- Keep a failed menu open, restore retryability, and render a concise accessible alert such as `Atlas couldn't sign you out right now. Try again.` without raw auth details.
- Place the action last, below the Account settings unavailable row, with the existing menu divider/spacing and focus/hover language.
- Preserve the same action set in both desktop popover and mobile account-sheet presentations because both use the shared `ProfileMenu` boundary.
- Replace an ambiguous boolean with an explicit behavior contract such as `signOutMode="session" | "fixture-link" | "hidden"`, or an equivalent discriminated contract.
- Pass production session mode from `/home`/production shell composition and preserve fixture-link mode for `/demo`.
- Keep the decision about fixture versus production authority in the parent route/shell mode; `ProfileMenu` must not infer it from identity or query auth tables.
- Update focused render/component coverage to prove production has the real button and no navigation-only logout link, while `/demo` retains its existing fixture behavior.

Do not add a new `/sign-out` page, auth route, database call, global middleware, account deletion behavior, confirmation dialog, or sign-up navigation change.

## Acceptance criteria

- Expanded production `/home` account menu contains a `Sign out` button beneath Account settings and does not contain an anchor that merely navigates to `/sign-in`.
- The control uses the SOUT-001 seam, disables itself during the request, labels the in-flight state, and does not issue duplicate requests.
- Production navigation uses `router.replace("/sign-in")` only after a successful response.
- Non-2xx and network failures keep the user on the current authenticated surface, keep the menu open, restore the button, and expose bounded `role="alert"` or equivalent feedback.
- The control is available in both desktop and mobile shared account-menu presentations with keyboard-visible focus and existing menu-row styling.
- `/demo` remains on its explicit fixture-link behavior and is not forced through Better Auth session invalidation; production mode cannot fall back to navigation-only logout.
- `ProfileMenu` owns interaction state only; it does not own session queries, auth-table access, manual cookie deletion, account deletion, project authorization, or fixture/production authority decisions.
- The existing `/home` identity, empty project state, route navigation, and sign-up destination remain unchanged.

## Frontend visual and interaction contract

The existing Atlas shell and `ProfileMenu` are the visual ancestors for this change. This ticket refines a shared account-menu interaction; it does not create a new visual language or a route-specific account card.

- Preserve the current account-menu hierarchy: profile identity, Theme, Account settings unavailable state, divider/spacing, then the session action as the last and visually subordinate action. Sign-out is session termination, not data deletion, so it must not become a destructive primary CTA.
- Use the existing semantic theme tokens, typography roles, spacing scale, border/radius language, and focus treatment from the shell. Do not introduce one-off colors, gradients, radii, icon-only meaning, or light-only/dark-only styling.
- Cover the applicable interaction states: default, hover, active, focus-visible, disabled, loading, error, and open. Loading and error must be communicated by text/semantics, not color alone; `role="alert"` or equivalent must remain readable in both themes.
- Preserve the component's responsive transformation: the desktop popover and mobile account sheet use the same action order and meaning, while the composition may change at the existing shell breakpoint. The control must remain reachable, readable, and operable at narrow widths and 200% zoom without clipping or horizontal overflow.
- Render and inspect production `/home` and representative `/demo` states at primary desktop, narrow desktop/tablet, and mobile widths in both light and dark themes, including keyboard focus, in-flight, and failure states. Build/test success alone is not sufficient frontend evidence.

### Frontend review bindings

- `REV-FE-SOUT-002-01`
  Ref: `VIS-001`, `VIS-004`, `VIS-012`, `VIS-015`
  Question: Does the changed menu converge on the established Atlas shell language and preserve token/theme parity rather than inventing local styling?
  Evidence: rendered desktop/mobile light/dark captures or equivalent visual inspection, resolved styles, and changed CSS/component diff.
- `REV-FE-SOUT-002-02`
  Ref: `VIS-008`, `VIS-009`, `VIS-011`
  Question: Are button semantics, accessible naming, visible focus, loading/disabled/error feedback, contrast, and non-color state communication complete?
  Evidence: keyboard interaction, markup/accessibility assertions, focus/error renders, and component tests.
- `REV-FE-SOUT-002-03`
  Ref: `VIS-010`, `VIS-013`
  Question: Does the account menu transform between desktop popover and mobile sheet without becoming a squeezed or clipped layout?
  Evidence: responsive renders at desktop, tablet/narrow desktop, mobile, and 200% zoom or equivalent reflow check.

## Validation

- Prepare the supported environment with `docker compose up -d --build` and confirm the required service health with `docker compose ps`.
- Render production `/home` or the equivalent shared shell and assert the button label, button semantics, placement, absence of the old fake logout link, and bounded failure feedback.
- Render representative `/demo` fixture scenarios and assert the fixture action remains available without a Better Auth sign-out request.
- Exercise success, failure, retry, disabled/in-flight, and responsive desktop/mobile presentation branches through the repository's current test strategy.
- Run strict CSP/rendered HTML checks and directly affected app build/lint/type tests in clean Compose containers, including `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test` and the applicable lint/type commands.
- Record service health, container commands, test counts, explicit skips, and any Docker availability limitation.
- Inspect the final diff for browser storage, manual cookie mutation, route-mode inference from identity, auth-table access, project writes, and accidental sign-up/SIN regressions.

## Implementation validation record

- **Container environment:** `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker` reported `healthy` through `docker compose ps` before validation.
- **Automated validation:** `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test` passed with 18 tests and 1 explicit worker-runtime skip. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test` passed all 3 tests. The focused assertion verifies the browser-facing sign-out request supplies Better Auth’s required JSON content type and empty JSON object; no browser-owned auth state is introduced. The full app lint command remains blocked by pre-existing errors in `RuntimeFixtureRoute.tsx` and `vite.config.ts`, outside this ticket.
- **Visual inspection:** A disposable local Better Auth account was used to inspect authenticated `/home`. The production account menu renders the real `Sign out` button below Account settings with no fixture Logout link, in desktop dark and light presentations and in the 573 px light mobile account sheet. Keyboard Tab reached the mobile Sign out button with a visible focus ring. An initial browser request demonstrated the bounded, retryable alert while the sheet remained open; its HTTP 415 cause was the missing JSON request body/content type, fixed in this remediation. The corrected request visibly changed to disabled `Signing out...`, navigated to `/sign-in` only after success, and a direct `/home` revisit redirected to `/sign-in`. `/demo` retains its fixture Logout presentation.
- **Frontend review gate:** VIS-001–015 pass for the affected menu. The change reuses the established ProfileMenu/Dialog hierarchy, spacing, type roles, theme tokens, focus treatment, and responsive popover-to-sheet transformation; it introduces no separate visual language or hard-coded theme treatment.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SOUT-002-01` Better Auth remains the sole production session authority; SOUT-001 supplies the request seam.
- `BOUNDARY-SOUT-002-02` `/home` is production-shaped authenticated UI, while `/demo` remains `@atlas/fixtures` authority and may retain prototype navigation behavior.

### Trust boundaries

- `TRUST-SOUT-002-01` The parent route/shell selects the production versus fixture behavior; the menu consumes that explicit contract rather than guessing authority.
- `TRUST-SOUT-002-02` The accepted Better Auth response crosses from the request seam into router navigation; client state cannot declare the session invalid.

### Sensitive assets and identity context

- `ASSET-SOUT-002-01` Session cookies, auth headers, and failure details must not enter component state, logs, or rendered output.
- `IDENTITY-SOUT-002-01` The menu presents the session-backed user identity already supplied by `/home` and does not reconstruct it from fixture or browser state.

### Required seams

- `SEAM-SOUT-002-01` Explicit `signOutMode` is the attachment point for future production session policy while preserving fixture scenarios.
- `SEAM-SOUT-002-02` Shared `ProfileMenu` remains the presentation boundary for desktop and mobile without taking persistence or authorization responsibility.

### Prohibited couplings

- `COUPLING-SOUT-002-01` Do not use a single ambiguous `showSignOut` boolean that can make `/demo` use production semantics or `/home` use fake navigation.
- `COUPLING-SOUT-002-02` Do not infer sign-out authority from successful authentication, profile identity, fixture presence, or project membership.

### Intentionally unresolved security policy

- `SEC-GAP-SOUT-002-01` Session management across devices, account recovery, abuse prevention, route-wide authorization, and full security-baseline controls remain separately scoped.

### Mandatory review bindings

- `REV-READY-SOUT-002-01`
  Ref: `SEAM-SOUT-002-01`
  Question: Is production versus fixture sign-out behavior explicit at the shell boundary and preserved across shared presentation?
  Evidence: call-site contract, render assertions, and `/demo` regression evidence.
- `REV-READY-SOUT-002-02`
  Ref: `SEAM-SOUT-002-02`
  Question: Does the shared menu provide equivalent real sign-out behavior on desktop and mobile without owning persistence or authorization?
  Evidence: component diff, responsive renders, and failure-state tests.
- `REV-READY-SOUT-002-03`
  Ref: `COUPLING-SOUT-002-01`
  Question: Is the old navigation-only production logout absent while fixture behavior remains isolated?
  Evidence: rendered production markup, `/demo` assertions, and changed-file review.

## Review checkpoint

- **Review question:** Does the production account menu expose a real responsive `Sign out` button while `/demo` retains its explicit fixture behavior?
- **Combined acceptance:** The real button is placed below Account settings, uses SOUT-001, protects against duplicate clicks, shows bounded retryable errors, navigates only after success, preserves the Atlas shell's visual/token/theme contract across desktop/tablet/mobile, works through both shared menu presentations, and does not change `/demo` or frozen SUS/SIN behavior.
- **Implementation checkpoint:** Current remediation commit (`fix(auth): send valid sign-out request`); `SOUT-BATCH-02` remains `awaiting_review` and requires a `ck` re-review of this one remediation commit.
