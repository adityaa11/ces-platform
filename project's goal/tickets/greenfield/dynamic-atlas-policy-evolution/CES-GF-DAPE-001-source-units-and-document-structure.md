# CES-GF-DAPE-001 — Deterministic Source Units and Mechanical Structure

**Stage:** P0 Atlas completeness
**Status:** Ready after DAPE-000 acceptance

## Objective

Create immutable document revisions, deterministic source units, and mechanical
document structure without agent interpretation.

## Business and architectural reason

Coverage and provenance are trustworthy only when source identity and text are
stable, complete, and independent from model output.

## Dependencies

- DAPE-000 Safara oracle.
- `CES-GF-ATLAS-005` PDF/Markdown normalization baseline.

## Inputs

Normalized PDF/Markdown documents with page/line provenance.

## Outputs

`document-revision.json`, `document-structure.json`, `section-index.json`, and
`source-units.json`.

## Contract changes

Add versioned document-revision and source-unit schemas with kind, text,
location, section path, parent, order, content hash, and deterministic IDs.

## Package ownership

New `source-unit-schema`; deterministic segmentation belongs with document/PDF
ingestion, not an agent package.

## Deterministic responsibilities

Own bytes/revision, headings, paragraphs, bullets, numbered items, table rows,
captions, page/line ranges, hierarchy, ordering, text, hashes, and IDs.

## Agent responsibilities

None. Later agents may classify but never create, rewrite, reorder, merge, or
replace source units.

## Failure statuses

`input_error`, `source_revision_invalid`, `segmentation_error`,
`provenance_error`.

## Exit codes

Use input/schema error `2`; execution/publication error uses a distinct nonzero
code defined with the CLI integration.

## Backward-compatibility requirements

Preserve current PDF/Markdown outputs and page provenance; add artifacts
without changing existing approved hashes.

## Required fixtures

Safara normalized source plus headings, bullets, numbered items, formulas,
tables, mixed newline, OCR-confidence, and malformed-location fixtures.

## Unit tests

Stable IDs, normalized newlines, order, hierarchy, hash, and atomic publication.

## Integration tests

Safara seven-page source inventory matches the DAPE-000 oracle byte-for-byte.

## Negative tests

Overlap, missing text, unrelated bullet merge, reorder, dangling parent, stale
hash, and agent-supplied identity fail closed.

## Completion evidence

Exact packages/files, schema versions, fixture paths, commands, generated and
failure artifacts, rerun equality, and legacy-ingestion results.

## Explicit non-goals

Normative classification, domain concepts, semantic extraction, or agents.

