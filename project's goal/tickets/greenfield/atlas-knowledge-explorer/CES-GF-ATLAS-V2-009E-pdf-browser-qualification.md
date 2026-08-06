# CES-GF-ATLAS-V2-009E - PDF Browser Qualification

**Status:** Planned
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

