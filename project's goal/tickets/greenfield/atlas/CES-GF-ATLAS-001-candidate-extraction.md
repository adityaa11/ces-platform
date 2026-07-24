# CES-GF-ATLAS-001 — Atlas: Candidate Extraction

**Phase:** 3A — Atlas Candidate Extraction  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Convert Markdown sources into provenance-preserving candidate requirements,
business rules, uncertainties, conflicts, and clarification questions without
allowing agent output into the deterministic core.

## Work

- Implement Markdown ingestion, normalized source indexing, and content hashing.
- Define a provider-neutral agent interface and versioned prompt/output contract.
- Provide a deterministic fixture provider for tests.
- Integrate one configurable real provider for interactive analysis.
- Validate all provider output against candidate schemas and vocabularies.
- Record provider, model, prompt-contract version, confidence, and source spans.
- Fail explicitly on invalid, unsupported, or incomplete provider output.

## Acceptance criteria

- [ ] Every candidate contains source provenance and review state.
- [ ] Explicit source facts and inferred candidates are distinguishable.
- [ ] Fixture-provider runs are byte-deterministic.
- [ ] Real-provider output is never described as deterministic or approved.
- [ ] Invalid provider output cannot reach review or core contracts.
- [ ] No provider can write stable registries.

## Required evidence

- [ ] Provider contract and schema fixtures.
- [ ] Deterministic fixture-provider tests.
- [ ] Redacted real-provider integration example.
- [ ] Boundary test proving candidates are rejected by core parsers.

## Out of scope

- Automatic approval.
- PDF/OCR ingestion.
- Architecture or policy selection.
