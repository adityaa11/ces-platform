# CES-GF-AGB-013 - Canonicalization Agent

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-006, AGB-011, and AGB-012
**Blocks:** AGB-014

## Outcome

Register a canonicalization agent that proposes `ADD`, `MERGE`, `ALIAS`, or
`REJECT` decisions for accepted raw concepts while preserving source lineage.

## Scope

- Accepted raw concept and exact source lineage, approved canonical predecessor,
  bounded gap demand, and explicit semantic comparison.
- Golden replays for sequential business flow, sensitive-data classification,
  and disclosure minimization.
- Policies-owned deterministic transformation and validation.

## Acceptance contract

- Semantically related concepts are not collapsed unless the governed decision
  and comparison justify it.
- Every proposed canonical concept retains all material raw distinctions and
  provenance.
- Project wording and implementation mechanisms do not enter shared knowledge.
- Output remains proposed and cannot grant POL-007 authority.
- Stale predecessors, invented raw support, missing comparisons, and lineage
  loss fail closed.

## Explicit non-goals

- Raw extraction, Policy taxonomy decisions, automatic approval, or mutation of
  accepted canonical vocabularies.

## Review focus

Semantic distinction, decision completeness, lineage, project independence,
predecessor integrity, and POL-007 authority separation.

## Implementation evidence

- Registered `ces.canonicalization-agent@1.0.0` through the existing structured
  bridge with no tools and mandatory human review.
- Server-controlled resolution pins accepted raw v1.2 and the exact approved
  canonical predecessor identity/hash; stale or invented lineage fails closed.
- Proposals preserve exact raw lineage, compare every predecessor exactly once,
  remain proposed, and reject project or implementation wording.
- Golden replay coverage exercises sequential flow, sensitive-data
  classification, and disclosure minimization through the canonical executor.
- `ADD`, `MERGE`, `ALIAS`, and `REJECT` use explicit deterministic target and
  comparison rules, with positive and contradictory registered-execution tests.
- Server-attached canonical evidence preserves each accepted raw concept's
  exact source identity, role, scope, bounded meaning, and extraction provenance;
  differently-role raw pairs require an explicit distinction justification.
- Golden expectations resolve directly from accepted POL-007 v1.3/v1.5
  successors used only as test oracles; runtime resolution remains pinned to
  accepted raw support and the earlier approved canonical predecessor.
