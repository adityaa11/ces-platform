# Review: BATCH-13 - Centralized Worker nonce filter

- Reviewed commit: `d6e696bc671b6b3429606d98ca6b5ecbc3a62d10`
- Ticket: `CSP-001`
- Baseline: [CSP refactor ticket set](../atlas-ui/CSP-README.md); [Atlas Full Product Context](../Atlas_Full_Product_Context.md) strict CSP requirement; [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [AUI-001 foundation and fixture boundary](../atlas-ui/AUI-001-foundation-and-fixture-boundary.md); [AUI-009 responsive and clarity pass](../atlas-ui/AUI-009-responsive-and-clarity-pass.md); [Atlas UI/UX Prototype Review Protocol](../Atlas_UI_UX_Review_Protocol.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1 (initial checkpoint review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `apps/atlas/worker/csp.ts:40-49`; rendered `GET /does-not-exist` response | CSP-001 scope and acceptance criterion: nonce-bearing HTML must not be served from a cache with a stale nonce; validation must cover representative error responses | Accepted | Every nonce-bearing HTML response, including the rendered 404/error document, must carry an explicit non-cacheable directive such as `Cache-Control: no-store` (and a regression test must assert it). The current 404 response is `text/html`, has a CSP nonce, and has no `Cache-Control` header, while normal 200 pages do. |
| F-002 | Important | `apps/atlas/tests/rendered-html.test.mjs:64` | CSP-001 acceptance/validation: all Vinext/React hydration scripts must be checked against the matching nonce and the existing application test suite must pass reliably | Accepted | Make the nonce assertion literal-safe (or compare attributes without interpolating raw Base64 into a regular expression). `createNonce()` legitimately emits `+`, and `pnpm test` failed when the generated nonce contained `+` because the assertion interpreted it as regex syntax. The app test must pass repeatedly for all valid nonce values. |
| F-003 | Important | `project's goal/atlas-ui/CSP-README.md:26,44`; `project's goal/atlas-ui/README.md:45,50` | Atlas delivery controls: an implemented checkpoint is `awaiting_review`, and `go` is permitted only after a `PASS` review | Accepted | Update the CSP tracking prose and delivery rows so `CSP-001 / BATCH-13` consistently reads `awaiting_review`, matching the ticket record. The current summaries still say `ready`, which makes the active review state and the next-work gate ambiguous. |

## Validation

- `pnpm --filter @atlas/app test` passed once, but the full `pnpm test` run failed in the new CSP assertion because the random nonce contained `+` (F-002).
- `pnpm --filter @atlas/app lint` passed.
- Rendered route probing confirmed fresh nonce-bearing 200 HTML responses, matching hydration-script nonces, report-only delivery, and preserved 307 redirect location. The rendered 404 response exposed the cache-control gap in F-001.
- This checkpoint changes the Worker and response tests, not a UI component; no separate visual component inspection was required for this review.
- Existing uncommitted working-tree changes were not evaluated.

## Decision

BATCH-13 remains `CHANGES_REQUESTED`. The central nonce contract works for normal rendered routes and report-only delivery, but the error-document cache behavior, nondeterministic validation test, and active-ticket control records must be corrected before the checkpoint can pass.
