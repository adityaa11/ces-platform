# CES-GF-POL-016-V01-I01 - Manual Safara Cycle Input

**Status:** Proposed

**Review class:** REVIEW_GATE

**Depends on:** Accepted POL-008 direction

## Outcome

Establish a human-reconciled, machine-readable inventory of the complete Safara
Buyer Business PRD as the demand-side input for the first CES Policy knowledge-
evolution cycle while Atlas extraction remains untrusted.

## Authority boundary

- The inventory is qualification evidence and project truth transcribed from
  the pinned PRD. It is not an Atlas revision and not security authority.
- It may reveal coverage gaps and support source-backed canonical vocabulary or
  Policy successor proposals.
- It must not create an approved Policy directly, produce a production Context
  Binding, impersonate an Atlas identity, or satisfy final Atlas reconciliation.
- Normal Policies runtime remains restricted to approved, revision-pinned Atlas
  facts under POL-010.

## Pinned input

- PDF: `docs/prd/Safara_Buyer_Business_PRD.pdf`
- SHA-256: `189dc08b084e5ee7edd4b947517ca659e93f22eec78954de6fd1c2df8359baee`
- Pages: 1-7
- Fixture: `fixtures/policies/safara-v1.1-cycle-01/manual-facts.json`

## Consumption contract

The qualification harness validates the fixture and maps each record into a
neutral `PolicyDemandFact`. The manual adapter and future Atlas adapter may feed
that neutral boundary, but provenance remains distinct and the manual adapter
is unavailable to production runtime entry points.

Every cycle result must retain the manual fact ID and exact PDF locator and use
one POL-016-V01 disposition:

- `AWARENESS_EMITTED`
- `NO_SECURITY_AWARENESS_REQUIRED`
- `OUTSIDE_SOFTWARE_SCOPE`
- `DECISION_REQUIRED`
- `SOURCE_OR_POLICY_GAP`

More precise gap routing is diagnostic metadata beneath
`SOURCE_OR_POLICY_GAP`; it does not introduce another terminal disposition.

## Acceptance contract

- The manifest pins the exact PDF hash and all seven pages.
- Every material business, actor, permission, data, workflow, state, rule,
  report, history, scenario, deliverable, and acceptance fact has a stable ID.
- Every fact has exact source text, a one-based page locator, category, and
  `human_reconciled` extraction method.
- The fixture contains no Atlas project, revision, fact, evidence, or approval
  identity.
- Validation rejects duplicate IDs, unknown categories, invalid pages, empty
  source text, a mismatched document hash, and any claim that the fixture is an
  approved Atlas input.
- A human review record pins the exact fixture hash before the inventory is
  treated as accepted cycle input.
- Coverage results cannot be promoted to final POL-016-V01 evidence until they
  are reconciled to an approved Atlas revision.

## Review boundary

Review decides whether this exact manual inventory and its temporary
qualification-only consumption boundary are trustworthy. It does not approve
Atlas, CES Policy gaps discovered later, successor canonical knowledge, or the
final Safara coverage gate.

