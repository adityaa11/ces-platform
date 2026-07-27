# CES-GF-DAPE-007 — Approved Project Model and Legacy Projections

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Publish one immutable, versioned `ApprovedProjectModel` as business truth while
preserving existing deterministic Requirement Collection and Package paths.

## Work

- Add approved-project-model schema, publisher, revision hash, and lock data.
- Include confirmed concepts, semantic records, source mappings, review
  evidence, coverage state, and clarification resolutions.
- Make graph, Requirement Collection, and Requirement Packages derived views.
- Define lossless versus lossy compatibility projections and explicit gaps.
- Prevent downstream mutation or independent PDF reinterpretation.

## Acceptance criteria

- [ ] Publication is impossible with incomplete normative coverage.
- [ ] Equivalent approved inputs publish byte-identical models and hashes.
- [ ] Every projection references the same model revision.
- [ ] Unsupported legacy projection semantics become explicit projection gaps.
- [ ] Existing single-package compilation remains backward compatible.

## Depends on

- `CES-GF-DAPE-006`

