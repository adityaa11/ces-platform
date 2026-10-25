# AAD-008: Review compact Dashboard navigation fidelity and accessibility

- **State:** awaiting_review
- **Depends on:** [AAD-004](AAD-004-compact-admin-navigation.md), [AAD-005](AAD-005-dashboard-route-authorization-tests.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 4–5 and 8](../../Atlas-admin-dashboard.md); [dashboard standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)

## Outcome

Render and review the compact Admin Dashboard navigation against the supplied
prototype and Atlas frontend baseline. This ticket closes the compact
responsive, drawer-interaction, and accessibility evidence without reopening
desktop composition.

## Scope

- Inspect authenticated compact renders in light and dark themes at the drawer
  closed and open states, narrow widths, and 200% zoom or equivalent reflow.
- Exercise menu open, current-page close, backdrop close, Escape close, focus
  movement/restoration, body-scroll cleanup, disabled/coming-soon items,
  visible focus, labels, non-color state cues, and reduced motion.
- Apply the compact portions of VIS-001–015, especially VIS-008–011, and
  record PASS, PASS WITH FINDINGS, or FAIL with rendered evidence and exact
  commands. Correct only compact-shell defects found within this ticket before
  its implementation checkpoint.

## Explicitly out of scope

- Desktop rail/topbar/welcome composition, sign-in behavior, route authority,
  theme persistence implementation, other Admin pages, and broader application
  accessibility work.
- New navigation destinations, data, metrics, or visual redesign.

## Acceptance criteria

- Compact layout is a usable one-column composition: no squeezed persistent
  rail, clipping, or horizontal scroll, and valid identity/content remain
  reachable in both themes.
- The drawer is fully keyboard operable, communicates state beyond color,
  respects reduced motion, restores focus/body state after every dismissal,
  and does not leave an inaccessible overlay.
- The recorded review disposition is grounded in narrow-width, theme, and
  interaction evidence. Desktop-only differences are routed to AAD-007.

## Validation handoff

Record viewports, theme/drawer states, keyboard and reduced-motion evidence,
and any remaining non-blocking finding for independent review.
