# CSP-004: CSP rollout and enforcement validation

- **State:** awaiting_review
- **Review batch:** BATCH-16
- **Depends on:** CSP-001, CSP-002, CSP-003
- **Baseline:** [CSP refactor ticket set](CSP-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [Atlas UI/UX Prototype Review Protocol](../Atlas_UI_UX_Review_Protocol.md)

## Outcome

Move from CSP Report-Only to enforced strict CSP after the connected Atlas
surface has zero unexplained violations.

## Scope

- Exercise Report-Only mode across all application routes and representative
  RSC/client-navigation requests.
- Resolve all in-scope violations introduced by Atlas, Vinext integration, or
  PDF.js configuration.
- Promote the canonical policy to `Content-Security-Policy` enforcement.
- Verify the policy is present on normal, error, redirect, and source-viewer
  responses.
- Add regression checks that reject accidental reintroduction of
  `'unsafe-inline'`, `'unsafe-eval'`, nonce-less inline scripts, and prohibited
  inline-style patterns.
- Document any deliberate narrow exception and the observable behavior that
  requires it.

## Explicit exclusions

- Do not treat a CSP exception as a substitute for production authentication or
  source-document authorization.
- Do not add analytics, embeds, remote fonts, or other external dependencies.
- Do not broaden the ticket to redesign the UI or alter fixture behavior.

## Acceptance criteria

- Enforced CSP is present on every rendered application response.
- The policy contains neither `'unsafe-inline'` nor `'unsafe-eval'`.
- All application routes and connected interactions complete without CSP
  violations in supported browser checks.
- Client navigation and RSC updates continue to work after initial load.
- Theme switching, navigation drawers, dialogs, source viewing, fullscreen,
  and route/lens state remain functional.
- Security-header and cache behavior are covered by automated regression tests.
- The final ticket records any accepted exception, its reason, and its scope.

## Validation

- Run the full application test and lint suites.
- Run browser checks over public, authentication, project-library, workspace,
  modal, and source-viewer routes in both themes and representative widths.
- Capture browser console and network evidence for zero CSP violations.
- Verify two independent document requests receive distinct nonces and that
  cached HTML cannot reuse a previous nonce.
- Complete the required rendered validation record before requesting review.

## Validation record

- 2026-08-31: Automated coverage exercises every defined HTML route, the
  source-viewer route, a not-found error response, and an RSC navigation
  response under enforced CSP. Each response must contain the enforced header
  and a fresh nonce, omit the report-only header and both prohibited unsafe
  tokens, and preserve `no-store` on rendered HTML.
- 2026-08-31: Cloudflare Worker development validation rendered the source
  viewer, changed PDF page and zoom state, rendered a non-zero canvas, and
  navigated client-side to Main Workflow with no browser errors or warnings.
  The 531px compact view preserved a readable rendered PDF canvas and had no
  horizontal overflow. The standalone `vinext start` adapter produced an RSC
  prefetch error, but the Worker-bound surface used by this ticket did not;
  no Atlas or CSP violation was observed.
- 2026-08-31: Direct enforced-policy checks covered public, authentication,
  project-library, every workspace view, the source viewer, and the rendered
  not-found response. Each returned `Content-Security-Policy`, no report-only
  policy or prohibited unsafe token, and `Cache-Control: no-store`.

## Review batch: BATCH-16

- **Tickets:** CSP-004 only
- **Review question:** Can Atlas enforce strict CSP across the complete connected prototype surface without functional or visual regression?
- **Combined acceptance criteria:** All criteria in this ticket, with special attention to route coverage, client navigation, PDF viewing, caching, and zero browser violations.
- **Commit range:** The single implementation checkpoint for CSP-004.
