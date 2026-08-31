# CSP refactor ticket set

- **State:** ready
- **Purpose:** Align the fixture-driven Atlas prototype with a strict Content
  Security Policy without introducing a new product capability or weakening the
  existing UI/UX direction.
- **Implementation status:** Planning only. No implementation is authorized by
  creating this ticket set.

## Baseline

- [Atlas Full Product Context](../Atlas_Full_Product_Context.md), strict CSP
  requirement.
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md), section 8
  (security-aware visual constraints).
- [AUI-001 Foundation and fixture boundary](AUI-001-foundation-and-fixture-boundary.md),
  strict-CSP-compatible foundation requirement.
- [AUI-009 Responsive and clarity pass](AUI-009-responsive-and-clarity-pass.md),
  CSP-compatible component and asset-pattern requirement.
- [Atlas UI/UX Prototype Review Protocol](../Atlas_UI_UX_Review_Protocol.md).

The UI/UX Prototype PRD and the UI/UX Prototype Review Protocol are currently
marked `Draft`. The Full Product Context has a descriptive status of
`Product context and future-state operating model`, but it does not contain an
explicit `Approved` status. The user has explicitly directed closure of the UI
ticket set and commencement of the strict-CSP refactor. CSP-001 is now `ready`;
the later CSP tickets remain `planned` until their dependencies are implemented
and reviewed.

## Intended outcome

- One centralized, request-scoped CSP filter at the Cloudflare Worker boundary.
- Vinext and React-generated inline hydration scripts receive the request nonce.
- Atlas-owned inline script and runtime inline-style patterns are removed.
- The PDF source viewer remains functional under the narrowest practical policy.
- The final policy contains neither `'unsafe-inline'` nor `'unsafe-eval'`.
- Existing routes, fixture relationships, roles, lens state, and UI behavior are
  preserved.

## Delivery order

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | CSP-001 / BATCH-13 | ready | AUI-012, AUI-013 | Does the Worker centrally generate, propagate, and enforce one nonce per response without stale HTML caching? |
| 2 | CSP-002 / BATCH-14 | planned | CSP-001 | Does the application remain behaviorally and visually equivalent without Atlas-owned inline scripts or runtime inline styles? |
| 3 | CSP-003 / BATCH-15 | planned | CSP-001 | Does the PDF viewer work under the narrowest strict-CSP-compatible worker and WebAssembly configuration? |
| 4 | CSP-004 / BATCH-16 | planned | CSP-001, CSP-002, CSP-003 | Can strict CSP be enforced across every route and interaction with no browser violations? |

## Ticket records

- [CSP-001 Centralized Worker nonce filter](CSP-001-centralized-worker-nonce-filter.md)
- [CSP-002 CSP-safe application patterns](CSP-002-csp-safe-application-patterns.md)
- [CSP-003 PDF.js strict-CSP compatibility](CSP-003-pdfjs-strict-csp-compatibility.md)
- [CSP-004 CSP rollout and enforcement validation](CSP-004-csp-rollout-and-enforcement-validation.md)

## Scope guard

This set does not implement production authentication, authorization, private
PDF delivery, signed object-storage URLs, or a new CSP reporting service. The
current public fixture PDFs are recorded as a production-security follow-up;
CSP does not replace document authorization.

## Batch rationale

Each batch has a distinct decision. The Worker filter establishes the nonce and
header contract, application cleanup removes Atlas-owned violations, PDF.js
compatibility validates a specialized runtime, and the final batch proves the
enforced policy across the connected surface. They must not be combined merely
to reduce review count.

## Review controls

After each ticket is implemented, validated, and committed, set it to
`awaiting_review`. Use `ck` for one consolidated review of the committed
checkpoint, `cfc` for accepted remediation, and `go` only after a `PASS` review
of the preceding batch.
