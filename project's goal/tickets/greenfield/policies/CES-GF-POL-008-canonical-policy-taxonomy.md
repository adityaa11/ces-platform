# CES-GF-POL-008 - Canonical Policy Taxonomy

**Status:** Proposed
**Review class:** REVIEW_GATE
**Depends on:** POL-007

## Outcome

Derive and approve a small set of broad, enduring CES Policy obligations from
the canonical vocabulary.

## Scope

- Candidate generation, comparison, consolidation, and human approval.
- Technology-independence and WHAT-not-HOW tests for every candidate.
- Clear separation of policies from concerns, capability needs, tests, and
  business rules.
- Versioned rationale and supporting canonical-concept mappings.

## Acceptance contract

- Every policy passes the technology-independence test.
- Every policy is supported by approved canonical concepts.
- Concerns such as replay or lost update are not promoted automatically.
- No policy names a vendor, framework, data store, protocol, or implementation
  technique.
- Cross-source overlap is consolidated unless meanings materially differ.

## Explicit non-goals

- Project-specific applicability or Atlas context binding.
- Freezing the full runtime schema, reasoning prompt, or implementation advice.
- Optimizing for a large number of policies.
