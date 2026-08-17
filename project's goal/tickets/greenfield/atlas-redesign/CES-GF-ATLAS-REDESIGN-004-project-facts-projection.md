# CES-GF-ATLAS-REDESIGN-004 - Project Facts Projection

**Status:** Blocked on REDESIGN-001 and REDESIGN-002
**Review class:** BATCHABLE
**Depends on:** Accepted ATLAS-REDESIGN-001 and REDESIGN-002
**Owner:** Atlas API projection

## Outcome

Project material non-workflow knowledge into buyer-facing fact groups without
forcing it into diagrams or turning the section into a PRD text dump.

## Required projection

- Stable fact and fact-group identities.
- Backend-owned grouping for scope, actors/responsibilities, entities,
  restrictions, permissions, commitments, outputs, completion conditions,
  global rules, and source-supported additional categories.
- Current accumulated values, support/review state, contributing PRDs, semantic
  destinations, and exact evidence.
- No hardcoded Safara groups and no UI classification heuristics.

## Acceptance

- Every displayed fact is material, source-supported, and evidence-linked.
- Workflow knowledge is not duplicated merely to populate the section.
- Facts with multiple PRD contributions retain complete provenance.
- Unsupported categories are absent rather than empty fixed tabs.
- Safara and an unrelated non-workflow source prove adaptable grouping.
- API, UI-component, accessibility, and regression tests pass.

## Manual verification

The owner expands understandable groups, reads current accumulated values, and
opens each fact's sources and permanent semantic destination.

## Review evidence and stopping condition

As `BATCHABLE`, this ticket implements accepted authority only. Stop and split
to a new `REVIEW_GATE` if implementation requires new classification authority.
Record one terminal outcome.
