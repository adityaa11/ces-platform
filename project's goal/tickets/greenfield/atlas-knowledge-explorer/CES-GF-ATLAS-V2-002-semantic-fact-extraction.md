# CES-GF-ATLAS-V2-002 - Semantic Fact Extraction

**Status:** Planned  
**Depends on:** ATLAS-V2-001

## Outcome

Replace requirement/business-rule-only provider output with evidence-grounded
semantic facts sufficient for all supported graph kinds.

## Scope

- Extract actors, activities, ordering, decisions, rules, states, transitions,
  entities, dependencies, events, permissions, validations, and audit actions.
- Preserve exact original document text, location, and language.
- Resolve multilingual equivalence into one canonical concept with multiple
  source representations.
- Report uncertainty and absence instead of inventing topology.
- Keep provider normalization deterministic and source-bound.

## Acceptance

- No document is forced into a workflow model.
- Atomic facts retain exact evidence and stable identity.
- Same-meaning multilingual text does not create duplicate concepts.
- Safara and at least two structurally different PRDs pass extraction coverage.
- Legacy candidate arrays are removed from the active v2 provider contract,
  not retained as the canonical input through an adapter.

