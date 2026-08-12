# CES-GF-AGB-013 - Canonicalization Agent

**Status:** Proposed; implementation unauthorized
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
