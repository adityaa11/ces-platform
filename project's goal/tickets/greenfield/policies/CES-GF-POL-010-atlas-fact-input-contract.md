# CES-GF-POL-010 - Atlas Fact Input Contract

**Status:** Deferred - trusted Atlas authority unavailable
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-009 (satisfied) and an accepted, revision-pinned
ATLAS-V2-007 knowledge authority (not yet satisfied)

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

## Dependency decision `CES-GF-POL-010-D01`

Project-owner direction recorded on 2026-08-13 keeps POL-010 deferred while
Atlas extraction and its authoritative publication boundary remain untrusted.
POL-009 publication authorizes POL-010 to begin when its Atlas dependency is
satisfied; that authorization does not make the currently implemented
ATLAS-V2-007 surface accepted authority.

Until then, CES Policies may reuse the accepted human-reconciled Safara fixture
and manual `PolicyDemandFact` adapter only for the qualification cycle defined
by POL-016-V01-I01 and POL-016-V01-I02. That path:

- retains `manual_golden_fixture` provenance and exact PDF locators;
- must not fabricate Atlas project, revision, fact, evidence, or approval IDs;
- must remain unavailable to production Context Binding entry points;
- cannot satisfy POL-010, unlock POL-011, or become final POL-016-V01 evidence;
  and
- must later be reconciled to an accepted, revision-pinned Atlas fact set.

Resuming POL-010 requires a new dependency check identifying the exact accepted
Atlas contract, revision authority, and review/publication evidence. This
deferral changes scheduling only; it does not alter the POL-010 acceptance
contract or approve provisional Atlas semantics.
