# CES-GF-ATLAS-V2-010B - PDF Structural Reconstruction

**Status:** Planned
**Depends on:** ATLAS-V2-010A

## Outcome

Convert complete PDF text into trustworthy headings, paragraphs, lists, tables,
and section paths before semantic extraction.

## Scope

- Preserve every extracted character and original page provenance.
- Reconstruct wrapped lines into paragraphs using PDF layout signals such as
  coordinates, line spacing, font properties, punctuation, indentation, and
  page continuity.
- Detect heading candidates using generic structural evidence: numbering,
  typography, isolation, hierarchy, and repeated document patterns.
- Distinguish page markers from document headings.
- Build nested section paths from reconstructed headings.
- Preserve exact source spans when multiple PDF lines form one paragraph.
- Retain multiple/non-contiguous coordinate regions when a source unit spans
  lines or pages.
- Work for native-text and OCR PDFs; expose uncertainty when layout evidence is
  insufficient.

## Acceptance

- All 7 Safara pages and their text remain covered without loss or duplication.
- The nine numbered Safara headings become section headings without hardcoded
  labels or a fixed expectation of nine sections.
- Wrapped business statements become coherent source units rather than
  unrelated line fragments.
- `Konteks`, goals, roles, rules, and delivery sections remain distinguishable
  from business-module sections.
- Generic numbered and unnumbered fixtures reconstruct correctly.
- Every reconstructed unit maps exactly back to original page text and regions.

