# CES-GF-POL-008 - Canonical Policy Taxonomy

**Status:** Implemented; pending REVIEW_GATE review
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-007 and approved canonical vocabulary revision 1.1.0

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

## Implementation evidence

- `@company/ces-policy-taxonomy` defines a versioned, renderer-neutral
  candidate taxonomy pinned to approved canonical vocabulary revision `1.1.0`.
- Four broad candidate obligations cover authorization, security-event
  traceability, trustworthy recovery, and transaction integrity.
- Validation permits only approved canonical `obligation` concepts as Policy
  support; concerns and verification contexts cannot be promoted implicitly.
- Every candidate records WHAT-not-HOW evidence and rejects prohibited
  technology matches.
- Candidate approval fails closed without genuine human review evidence.
- Policy lineage exposes every contributing canonical mapping, raw concept,
  source release, and exact locator; consolidation does not discard sources.
