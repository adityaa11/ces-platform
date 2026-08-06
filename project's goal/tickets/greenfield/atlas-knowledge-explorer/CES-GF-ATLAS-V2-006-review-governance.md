# CES-GF-ATLAS-V2-006 - Review Governance

**Status:** Implemented
**Depends on:** ATLAS-V2-004 and ATLAS-V2-005

## Outcome

Apply existing human-governance guarantees to v2 semantic facts, graph
selections, relationships, and hierarchy without retaining v1 entity shapes.

## Scope

- Reuse immutable decisions, revision checks, eligibility, and audit history.
- Define review subjects using v2 canonical identities.
- Block approval for missing evidence, unresolved uncertainty, broken hierarchy,
  or stale revisions.
- Materialize an authoritative v2 bundle without mutating the proposal.

## Acceptance

- Approval never manufactures evidence or topology.
- Proposed and approved bundles share the v2 contract.
- Stale and partial decisions fail closed.
- Reusable ledger mechanics remain graph-neutral; v1 workflow assignment and
  fixed-detail subject types are removed from the active path.

## Implementation evidence

- `@company/ces-atlas-knowledge-review` derives subjects only from V2 knowledge
  and edge identities and records immutable audit decisions.
- Approval requires every subject at the exact proposal hash and revision and
  rejects stale, partial, duplicate, unknown, rejected, or unresolved proposals.
- Approval changes only the authority envelope; evidence, wording, hierarchy,
  and topology are preserved from the proposal.
