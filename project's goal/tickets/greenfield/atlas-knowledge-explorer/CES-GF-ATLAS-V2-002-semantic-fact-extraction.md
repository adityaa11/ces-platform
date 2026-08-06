# CES-GF-ATLAS-V2-002 - Semantic Fact Extraction

**Status:** Implemented
**Depends on:** ATLAS-V2-001

## Outcome

Replace requirement/business-rule-only provider output with evidence-grounded
semantic facts sufficient for all supported graph kinds.

## Scope

- Extract actors, activities, ordering, decisions, rules, states, transitions,
  entities, dependencies, events, permissions, validations, and audit actions.
- Preserve exact original document text, location, and language.
- Ingest text-based and scanned PDFs before provider execution into immutable
  source units with page numbers, text spans, and normalized bounding boxes
  where extraction/OCR can establish them.
- Send validated source units to the registered Atlas agent through the generic
  Agents Bridge endpoint; provider adapters do not parse PDFs.
- Resolve multilingual equivalence into one canonical concept with multiple
  source representations.
- Report uncertainty and absence instead of inventing topology.
- Keep provider normalization deterministic and source-bound.
- Use the same semantic-fact contract for PDF and future supported document
  formats so graph extraction is not tied to one file type.

## Acceptance

- No document is forced into a workflow model.
- Atomic facts retain exact evidence and stable identity.
- Same-meaning multilingual text does not create duplicate concepts.
- Safara and at least two structurally different PRDs pass extraction coverage.
- Legacy candidate arrays are removed from the active v2 provider contract,
  not retained as the canonical input through an adapter.
- Live qualification covers a text PDF and a scanned/OCR PDF from ingestion
  through the Agents Bridge, with exact page provenance.
- OCR uncertainty is visible; Atlas never changes original displayed PDF bytes
  or invents coordinates to force a highlight.

## Implementation evidence

- `@company/ces-atlas-semantic-facts` defines the v2 input, intermediate, fact,
  term, evidence, and deterministic finalization contracts.
- `atlas.semantic-fact-extractor@2.0.0` is registered through the generic Agents
  Bridge execution path and neither parses PDFs nor selects graphs.
- Focused tests cover text-PDF coordinates, scanned/OCR no-coordinate behavior,
  exact-quote enforcement, source-free term rejection, and human-review policy.
- Real document/provider/browser qualification remains an end-to-end release
  gate in ATLAS-V2-009; it is not replaced by fixture-only evidence here.
