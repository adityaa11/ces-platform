# CSP-003: PDF.js strict-CSP compatibility

- **State:** awaiting_review
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

## Validation record

- 2026-08-31: `pnpm test` passed (fixture tests, production build, and all
  seven application tests); `pnpm lint` passed.
- 2026-08-31: The local source-viewer route returned the enforced policy with
  `connect-src 'self'` and `worker-src 'self'`, with neither `'unsafe-inline'`
  nor `'unsafe-eval'`.
- 2026-08-31: Browser checks rendered PRD 1 page 1, PRD 2 page 2, and PRD 3
  page 1, then navigated to another page in each document. Each canvas had a
  non-zero rendered size and no loading status remained.
- 2026-08-31: Zoom in, Fit width, 531px compact layout, and fullscreen entry
  and exit were exercised successfully. The compact layout retained the
  source list, back-to-Sources control, toolbar, and readable rendered page.
- 2026-08-31: Observed assets were limited to the same-origin worker at
  `/pdfjs/pdf.worker.mjs` and the three same-origin `/source-pdfs/` fixture
  URLs; no WebAssembly asset was requested. The vendored worker contains the
  PDF.js `Function('return this')` fallback, but supported browsers expose
  `globalThis` before that fallback and the exercised worker startup produced
  no CSP or PDF.js console warnings.

## Review batch: BATCH-15

- **Tickets:** CSP-003 only
- **Review question:** Does the PDF source viewer work without broad eval permissions or new external origins?
- **Combined acceptance criteria:** All criteria in this ticket, with special attention to worker startup, WebAssembly decision evidence, and complete viewer interaction.
- **Commit range:** The single implementation checkpoint for CSP-003.
