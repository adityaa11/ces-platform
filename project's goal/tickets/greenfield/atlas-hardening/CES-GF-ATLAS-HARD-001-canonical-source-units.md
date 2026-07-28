# CES-GF-ATLAS-HARD-001 — Canonical Source Units

**Stage:** Atlas hardening foundation
**Status:** Implemented

## Objective

Qualify the completed DAPE-001 source-unit implementation as the single
immutable source identity layer required by Atlas hardening.

## Foundation and dependencies

- Completed DAPE-000 oracle and DAPE-001 source-unit contracts.
- Existing PDF and Markdown ingestion from Atlas.

## Work

- Gap-audit current source units for document/version identity, page, section
  path, exact text, source kind, normalized bounding box, and OCR confidence.
- Define deterministic source-unit boundaries and IDs for every supported
  parser path.
- Keep segmentation generic across document structures; production parsing
  must not recognize Safara headings, entities, terminology, or layout as
  special cases.
- Prevent semantic agents and later pipeline stages from changing source text,
  anchors, ordering, or identity.
- Add explicit document revision and source-unit revision/hash metadata.

## Outputs

Canonical source revision and ordered source-unit artifacts compatible with the
existing DAPE schemas.

## Acceptance criteria

- [x] Every parsed page or Markdown section produces traceable source units.
- [x] Identical accepted input and parser configuration produce identical IDs.
- [x] Exact source text and section/page provenance survive the full pipeline.
- [x] OCR-derived units retain confidence and source-kind metadata.
- [x] Unfamiliar headings, layouts, and unrelated-domain documents use the same
      source-unit contract without domain-specific parser code.
- [x] Production packages do not import Safara oracle data or fixture rules.
- [x] Changed document bytes invalidate stale source revisions.
- [x] No duplicate source-unit schema or identity algorithm is introduced.

## Tests and evidence

Native PDF, OCR PDF, Markdown, unrelated-domain and unfamiliar-layout documents,
repeated-run, changed-input, reordered-section, and attempted-agent-mutation
fixtures; schema validation and artifact hashes.

## Completion evidence

- `packages/source-unit-schema` schema version 1.1.0.
- Focused source-unit, architecture, and PDF integration tests: 14 passed.
- Package TypeScript build passed.
- Full repository run: 303 passed, 1 skipped; two unrelated bootstrap-runner
  process-timeout tests exceeded their existing five-second test limit.

## Out of scope

Semantic classification, requirement identity, approval, and graph projection.
