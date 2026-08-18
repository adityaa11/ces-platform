# CES-GF-ATLAS-REDESIGN-003 - Journey Stages and Semantic Workflow Pages

**Status:** Blocked on REDESIGN-001 and REDESIGN-002
**Review class:** REVIEW_GATE
**Depends on:** Accepted ATLAS-REDESIGN-001 and REDESIGN-002
**Owner:** Atlas semantic model and Atlas API projection

## Outcome

Replace the giant/permanent workflow graph assumption with a readable
accumulated overview and backend-owned semantic pages, each answering one
bounded business question.

## Required contract

- Journey-stage identity, name, purpose, business result, ordering, and page
  membership.
- Semantic workflow-page identity, focused question, owning stage, order,
  actors, intended result, nodes, relationships, source history, and evidence.
- Explicit cross-workflow support-layer membership where source semantics
  justify it.
- Page boundaries, graph topology, ordering, and labels owned by the backend.
- Partial or unresolved topology represented honestly rather than invented.

## Production slice

Provide overview, page picker, page detail, previous/next page, and evidence
projections. Graph adapters render supplied semantics and remain replaceable.

## Acceptance

- Main Workflow stays readable as project detail grows.
- Every page has one focused business question and belongs to one governed
  stage or support layer.
- Every node and relationship resolves to exact evidence.
- Arbitrary item-count pagination and browser-inferred page grouping are absent.
- Safara and an unrelated workflow prove different stage/page structures.
- Non-workflow sources do not fabricate process pages.

## Manual verification

The owner navigates overview, grouped picker, previous/next pages, and evidence
without returning to a permanent giant graph.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md`, including
automated test and production-build evidence.
Use one primary commit and bounded two-round review. Stop after accepted
workflow semantics and production-shaped page navigation.
