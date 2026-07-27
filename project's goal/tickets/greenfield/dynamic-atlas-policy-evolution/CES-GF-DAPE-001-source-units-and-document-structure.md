# CES-GF-DAPE-001 — Deterministic Source Units and Document Structure

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Convert ingested documents into immutable, deterministically identified source
units and a versioned document-structure artifact without semantic rewriting.

## Work

- Add `source-unit-schema` with document, section, page/line, text, hash,
  source-kind, and extraction-confidence fields.
- Generate stable source-unit and section IDs from document identity and
  normalized location.
- Segment headings, paragraphs, bullets, numbered items, formulas, table rows,
  scenarios, and role statements.
- Preserve PDF-native, OCR, and Markdown provenance.
- Publish `document-structure.json`, `section-index.json`, and
  `source-units.json`.
- Reject overlapping, dangling, reordered, or hash-inconsistent units.

## Acceptance criteria

- [ ] Repeated ingestion produces byte-identical units and IDs.
- [ ] Every unit maps to immutable source content and location.
- [ ] No agent creates or mutates source-unit identity.
- [ ] Safara headings, bullets, formulas, scenarios, and seven pages are
      represented without missing text.

## Out of scope

- Domain concepts, semantic extraction, or coverage classification.

## Depends on

- `CES-GF-AGB-005`

