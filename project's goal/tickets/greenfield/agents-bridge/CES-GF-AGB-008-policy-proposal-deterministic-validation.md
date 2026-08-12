# CES-GF-AGB-008 - Policy Proposal Deterministic Validation Boundary

**Status:** Proposed; implementation unauthorized
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
