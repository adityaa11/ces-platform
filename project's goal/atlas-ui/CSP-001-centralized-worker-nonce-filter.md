# CSP-001: Centralized Worker nonce filter

- **State:** approved
- **Review batch:** BATCH-13
- **Depends on:** AUI-012, AUI-013
- **Baseline:** [CSP refactor ticket set](CSP-README.md); [Atlas Full Product Context](../Atlas_Full_Product_Context.md) strict CSP requirement; [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) section 8; [AUI-001](AUI-001-foundation-and-fixture-boundary.md); [AUI-009](AUI-009-responsive-and-clarity-pass.md)

## Outcome

Establish one centralized CSP filter at the Cloudflare Worker boundary. The
filter must generate a fresh nonce for each rendered request, make that nonce
available to Vinext before rendering, and return the matching policy with the
response.

## Scope

- Add a Worker-local CSP helper for nonce generation and policy construction.
- Generate a cryptographically random, request-scoped nonce; never reuse a
  module-global or build-time nonce.
- Clone the incoming request and add the CSP policy before invoking Vinext so
  Vinext can propagate the nonce to framework-generated scripts.
- Apply the identical policy to the outgoing response while preserving status,
  body, and unrelated headers.
- Make nonce-bearing HTML non-cacheable and verify the behavior for document,
  RSC, redirect, and error responses where applicable.
- Support report-only delivery during rollout without duplicating policy logic.
- Keep policy construction out of UI components and route modules.

## Initial policy contract

The implementation must use a narrow policy shape and make any additional
source explicit:

```text
default-src 'self';
script-src 'self' 'nonce-<request-nonce>' 'strict-dynamic';
style-src 'self';
style-src-attr 'none';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
worker-src 'self';
object-src 'none';
base-uri 'none';
form-action 'self';
frame-ancestors 'none';
```

The final directive set may be narrowed after runtime validation, but it must
not add `'unsafe-inline'` or `'unsafe-eval'` as a compatibility shortcut.

## Explicit exclusions

- Do not refactor the theme script, canvas sizing, or PDF.js in this ticket;
  those are covered by CSP-002 and CSP-003.
- Do not implement production authentication or private source-document
  delivery.
- Do not allow broad external origins without a ticket-level explanation and
  test evidence.

## Acceptance criteria

- Every rendered HTML response contains one CSP policy with a fresh nonce.
- The request passed to Vinext contains the same policy before rendering.
- All Vinext/React inline hydration scripts receive the matching nonce.
- The response nonce is not reused across two independent document requests.
- Nonce-bearing HTML cannot be served from a cache with a stale nonce.
- The policy contains no `'unsafe-inline'` or `'unsafe-eval'` tokens.
- Existing route status, body content, and fixture-driven navigation remain
  unchanged when the filter is enabled.

## Validation

- Unit-test nonce format, uniqueness, policy construction, and request/response
  matching.
- Render `/`, authentication routes, `/demo`, every workspace destination, and
  representative error/RSC responses with the filter enabled.
- Assert that every inline script has the expected nonce and that no response
  has a mismatched or missing policy.
- Verify HTML cache headers and run the existing application test suite.

## Review batch: BATCH-13

- **Tickets:** CSP-001 only
- **Review question:** Does the Worker provide one centralized, request-scoped nonce contract to Vinext and the browser without stale cached HTML?
- **Combined acceptance criteria:** All criteria in this ticket, with special attention to nonce propagation before rendering, response-header equality, and cache behavior.
- **Commit range:** The single implementation checkpoint for CSP-001.
