# ASI-003: Review Admin Sign-In fidelity, responsive fit, and accessibility

- **State:** proposed
- **Depends on:** [ASI-001](ASI-001-isolated-admin-sign-in-ui.md), [ASI-002](ASI-002-admin-sign-in-ui-boundary-tests.md)
- **Application:** `apps/atlas`
- **Primary source:** [light desktop preview](../../atlas-admin-login-light-preview.png), [dark mobile preview](../../atlas-admin-login-mobile-preview.png), [standalone prototype](../../atlas-admin-login-standalone.html)

## Outcome

Perform and record rendered review of the implemented `/admin/sign-in` route.
The result is accepted only when it preserves the approved prototype's visual
hierarchy and responsive composition while meeting the Atlas frontend quality
and accessibility baseline.

## Scope

- Render and inspect the direct route at the supplied desktop/light and
  mobile/dark reference compositions, plus the reciprocal dark desktop and
  light mobile states.
- Inspect the initial, hover, focus-visible, active, selected-theme, invalid,
  password-visible, and local-result states in both supported themes.
- Check keyboard-only traversal and activation for all inputs, theme buttons,
  password control, and the submit action.
- Check narrow reflow, long plausible email values, long operator-facing copy,
  error messages, 200% zoom or equivalent constrained-width reflow, and
  reduced-motion preference.
- Compare source and implementation for intended form/card width, header and
  footer secondary-content reduction, visual alignment, spacing, readable
  typography, contrast, and lack of horizontal overflow.

## Review criteria

| Gate | Pass condition |
| --- | --- |
| Hierarchy | Atlas/Admin context is immediately identifiable; heading and one Sign in action dominate; access notices/footer stay visibly subordinate. |
| Visual language | Existing Atlas tokens, typography, geometry, and calm operational character are used; no separate Admin color system, generic template, or decorative dashboard treatment appears. |
| Surface discipline | The form card, lines, subtle grid/rings, and shadow communicate containment or hierarchy. No nested-card or purely ornamental surface noise is introduced. |
| Theme parity | Light and dark modes preserve the same hierarchy, copy, control states, focus visibility, contrast, and error/result meaning. |
| Responsive composition | The card remains centered and bounded on large screens; the compact screen preserves a one-column task flow, hides only `Private access` and the footer's right metadata, and has no clipping or horizontal scroll. |
| Interaction/accessibility | Labels, accessible names, focus order, visible focus, error association, status announcement, non-color errors, and password visibility state are correct. |
| Motion | Transition behavior is restrained and honors reduced-motion preference. |
| Boundary | Screenshots and interaction checks show no public registration prompt, no public navigation modification, and no authenticated or success state. |

## Acceptance criteria

- Light desktop render closely calibrates to the supplied light preview and
  dark mobile render closely calibrates to the supplied mobile preview; any
  visible deviation is recorded with a source-grounded reason.
- All source copy is readable at supported widths. No valid content is
  ellipsized, clipped, or inaccessible behind overflow.
- Keyboard users can reach and operate each interactive control with an
  obvious focus-visible indicator. Labels and status/error messages are
  programmatically associated with their controls.
- Review result is recorded as PASS, PASS WITH FINDINGS, or FAIL against the
  phase contract's frontend review gate. A build-only result is insufficient.

## Validation record

Record:

- viewport/theme matrix and screenshot evidence;
- keyboard, focus, error, password-toggle, and reduced-motion observations;
- visual differences from each supplied preview, if any;
- lint/typecheck/build and focused test results supplied by ASI-002;
- final review disposition and any remaining non-blocking finding.
