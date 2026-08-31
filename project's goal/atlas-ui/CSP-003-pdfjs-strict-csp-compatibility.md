# CSP-003: PDF.js strict-CSP compatibility

- **State:** planned
- **Review batch:** BATCH-15
- **Depends on:** CSP-001
- **Baseline:** [CSP refactor ticket set](CSP-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [AUI-009](AUI-009-responsive-and-clarity-pass.md)

## Outcome

Keep the source-document viewer functional under the strictest practical CSP,
with an explicit same-origin worker and no broad evaluation allowance.

## Scope

- Verify the worker remains served from the same origin and is covered by
  `worker-src 'self'`.
- Verify PDF fetches remain covered by `connect-src 'self'` for the current
  fixture URLs.
- Configure PDF.js to disable optional WebAssembly paths where rendering still
  works without them.
- If WebAssembly is required, document and approve the narrowest
  `wasm-unsafe-eval` exception; do not add the broader `unsafe-eval` token.
- Validate the vendored worker bundle’s `Function(...)` fallback and confirm
  whether it is reachable in supported browsers.
- Preserve source selection, page navigation, zoom, fit-width, fullscreen, and
  original-document navigation.

## Explicit exclusions

- Do not move fixture PDFs out of `public/` in this ticket; private document
  authorization is a separate production-security concern.
- Do not add third-party PDF viewers, embeds, frames, or external worker hosts.
- Do not broaden `connect-src` beyond current same-origin fixture behavior.

## Acceptance criteria

- All three current Safara PDFs render successfully with the CSP policy active.
- Worker startup and PDF loading produce no CSP console violations.
- Page changes, zoom controls, fit-width, fullscreen, and error handling remain
  functional.
- The final policy does not require `'unsafe-eval'`.
- Any `wasm-unsafe-eval` requirement is explicit, minimal, and backed by runtime
  evidence rather than static bundle presence alone.
- No external frame, embed, or worker origin is introduced.

## Validation

- Run the source-viewer route under CSP Report-Only and enforced CSP.
- Exercise each PDF, multiple pages, zoom states, fit-width, fullscreen, and a
  failed-load state.
- Inspect worker and network requests for origin, CSP, and MIME behavior.
- Check browser console output for CSP violations and PDF.js warnings.
- Run application tests and record the rendered source-viewer states before
  review.

## Review batch: BATCH-15

- **Tickets:** CSP-003 only
- **Review question:** Does the PDF source viewer work without broad eval permissions or new external origins?
- **Combined acceptance criteria:** All criteria in this ticket, with special attention to worker startup, WebAssembly decision evidence, and complete viewer interaction.
- **Commit range:** The single implementation checkpoint for CSP-003.
