# CES-GF-ATLAS-HARD-001 — Canonical Source Units

**Stage:** Atlas hardening foundation
**Status:** Planned

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
- Prevent semantic agents and later pipeline stages from changing source text,
  anchors, ordering, or identity.
- Add explicit document revision and source-unit revision/hash metadata.

## Outputs

Canonical source revision and ordered source-unit artifacts compatible with the
existing DAPE schemas.

## Acceptance criteria

- [ ] Every parsed page or Markdown section produces traceable source units.
- [ ] Identical accepted input and parser configuration produce identical IDs.
- [ ] Exact source text and section/page provenance survive the full pipeline.
- [ ] OCR-derived units retain confidence and source-kind metadata.
- [ ] Changed document bytes invalidate stale source revisions.
- [ ] No duplicate source-unit schema or identity algorithm is introduced.

## Tests and evidence

Native PDF, OCR PDF, Markdown, repeated-run, changed-input, reordered-section,
and attempted-agent-mutation fixtures; schema validation and artifact hashes.

## Out of scope

Semantic classification, requirement identity, approval, and graph projection.
