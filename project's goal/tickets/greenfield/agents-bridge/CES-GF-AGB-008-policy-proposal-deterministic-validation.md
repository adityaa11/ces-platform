# CES-GF-AGB-008 - Policy Proposal Deterministic Validation Boundary

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-006
**Blocks:** AGB-007, AGB-009, and AGB-014

## Outcome

Validate Policy Taxonomy Agent proposals with deterministic Policies-owned
rules before any proposal may enter review.

## Scope

- Validate schemas, revisions, predecessor identity, canonical/raw lineage,
  decision enumeration, lifecycle, comparison completeness, and hashes.
- Reuse existing POL-008 successor builders and invariants where applicable.
- Produce a deterministic validation result bound into AGB-006 evidence.
- Normalize failures without accepting or publishing the proposal.

## Acceptance contract

- Provider output never bypasses deterministic validation.
- Accepted historical fixtures pass; mutated meaning, missing comparisons,
  stale revisions, project leakage, broken lineage, and authority claims fail.
- Repeated validation is deterministic for identical governed inputs.
- A valid result means reviewable proposal, not accepted knowledge.

## Explicit non-goals

- Human semantic approval, REVIEW_GATE state, provider scoring, or coverage
  reruns.

## Review focus

Fail-closed behavior, reuse of accepted invariants, deterministic evidence, and
absence of semantic authority in provider output.

## Candidate implementation evidence

- Package: `@company/ces-policy-knowledge-validation`.
- Validates AGB-006 Policy proposals against exact source/raw/canonical/taxonomy
  revisions and content-addressed predecessor identity.
- Requires approved obligation support, complete raw lineage, coherent decisions,
  complete pairwise comparisons, and project/technology independence.
- Produces deterministic `reviewable_proposal` or `rejected_before_review`
  evidence while always granting no Policy authority.

AGB-007 remains blocked until this candidate receives an accepting terminal
review outcome.
