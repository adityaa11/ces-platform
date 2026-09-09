# Review: BATCH-16 - CSP rollout and enforcement validation

- Reviewed commit: `036a5a416a27500ffb1bba42ca91578d7cd7b4aa`
- Ticket: `CSP-004`
- Baseline: [CSP refactor ticket set](../atlas-ui/CSP-README.md); [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [Atlas UI/UX Prototype Review Protocol](../Atlas_UI_UX_Review_Protocol.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1 (initial checkpoint review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | Worker-bound rendered `GET /does-not-exist` response; framework-generated not-found markup | CSP-004 acceptance criteria require all rendered application responses and connected interactions to complete without CSP violations; the final policy includes `style-src 'self'` and `style-src-attr 'none'` | Accepted | Replace or override the framework default not-found output with a CSP-safe error surface that emits no inline `<style>` block and no inline `style` attributes, while retaining the 404 status, accessible error message, and `Cache-Control: no-store`. Add a regression assertion against inline style markup in the rendered not-found response. The current enforced 404 response has one inline `<style>` block and four inline `style` attributes, which the active policy cannot authorize. |

## Validation

- `pnpm test` passed: fixture tests, the production build, and all eight application tests passed.
- `pnpm --filter @atlas/app lint` passed.
- `git diff HEAD^ HEAD --check` passed.
- The Worker-bound local surface returned an enforced `Content-Security-Policy` on public, authentication, project-library, every workspace view, source viewer, and not-found responses. Each response had a nonce, `connect-src 'self'`, `worker-src 'self'`, no report-only header, neither `'unsafe-inline'` nor `'unsafe-eval'`, and rendered HTML had `Cache-Control: no-store`.
- Two independent Worker-bound HTML requests received distinct nonces.
- Worker-bound client navigation from landing to demo, project opening, Main Workflow to Project Facts, and source-viewer interactions completed without browser errors or warnings.
- Light/Dark switching, compact navigation locking and closing, mobile account-sheet semantics and outside dismissal, all three PDF documents, page navigation, zoom, Fit width, fullscreen entry/exit, and the 531px compact source viewer were exercised. PDFs rendered with non-zero canvases and no horizontal overflow.
- Same-origin worker and PDF assets remained available; no external frame, embed, or worker origin was introduced. The `useWasm: false` PDF.js path remained functional.
- The not-found response body inspection found one `<style>` block and four `style` attributes despite the enforced `style-src 'self'; style-src-attr 'none'` policy. Browser console logs were otherwise empty, but the markup is still a direct contradiction of the strict policy and must be removed or replaced before approval.
- Existing uncommitted feedback files were not evaluated or modified.

## Decision

BATCH-16 / CSP-004 remains `CHANGES_REQUESTED`. The strict policy, route headers, nonce/cache behavior, client navigation, PDF viewer, themes, responsive shell, and interaction checks pass, but the rendered not-found route still emits framework inline CSS that is disallowed by the final CSP. Resolve F-001 and submit the single remediation checkpoint for finite re-review.
