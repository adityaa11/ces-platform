# CES-GF-ATLAS-V2-009E - PDF Browser Qualification

**Status:** Implemented
**Depends on:** ATLAS-V2-009D

## Outcome

Prove the right-side evidence workspace against original text and scanned PDFs.

## Scope

- Test authorized, revision-pinned PDF loading and byte ranges.
- Test page navigation, zoom, evidence-card selection, and highlight synchronization.
- Test multiple and non-contiguous regions.
- Test OCR coordinates against original page images and expose OCR confidence.
- Test explicit no-coordinate fallback without guessed highlights.

## Acceptance

- Text and scanned PDF browser tests pass in the production build.
- Highlights align with their original page regions.
- Cards and highlights synchronize in both directions.
- No filesystem path, credential, or unrestricted document response is exposed.

## Implementation Evidence

- Replaced the browser-native PDF iframe with a PDF.js canvas so page-relative
  regions remain aligned through page changes and zoom.
- Evidence cards, previous/next controls, page rendering, and clickable overlay
  regions share one selected evidence identity; multiple boxes are supported.
- OCR method/confidence are displayed, while unavailable coordinates produce an
  explicit fallback and never synthesize a region.
- Existing project/revision authorization and byte-range tests pass, together
  with new browser-state synchronization tests.
- Atlas UI typecheck and optimized Next.js production build pass with a
  self-hosted worker allowed by CSP.
