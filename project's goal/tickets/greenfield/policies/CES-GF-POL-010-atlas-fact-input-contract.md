# CES-GF-POL-010 - Atlas Fact Input Contract

**Status:** Proposed
**Review class:** REVIEW_GATE
**Depends on:** POL-009 and ATLAS-V2-007

## Outcome

Define the sole revision-pinned input boundary by which CES Policies consumes
approved Atlas knowledge.

## Scope

- Atlas project, revision, fact/concept, evidence, and approval identities.
- A Policies-owned adapter from the canonical Atlas API contract to a minimal,
  normalized policy-reasoning input.
- Stale revision, missing fact, unresolved evidence, and authorization behavior.
- Durable references that survive rendering and wording changes.

## Acceptance contract

- Every input fact resolves to an approved Atlas identity and exact revision.
- Stale, missing, unapproved, or cross-project facts fail closed.
- Policies does not re-read the buyer PRD or infer replacement business facts.
- The adapter preserves relevant Atlas provenance without importing graph/UI
  representation as policy truth.
- Contract fixtures cover at least two structurally different projects.

## Explicit non-goals

- Changing Atlas contracts or extraction behavior.
- Selecting policies, creating bindings, or implementing the reasoning agent.
- Requiring Atlas to contain ISO or CES policy assumptions.
