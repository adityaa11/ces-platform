# CES-GF-ATLAS-REDESIGN-010 - CES Result Integration

**Status:** Ticket definition remediation pending regression closure;
implementation blocked on REDESIGN-009 and POL-010
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-009 and accepted POL-010 Atlas Fact Input
Contract; subsequent POL tickets only for the capabilities they actually supply
**Owner:** CES Policies and cross-product integration

## Outcome

Deliver the first executable CES Result integration boundary using POL-010:
show the exact approved Atlas authority, revision, consumed facts/concepts, and
provenance while reporting that policy results are unavailable. Preserve the
authority boundary between Atlas project truth and CES engineering policy
results and never fabricate a conclusion.

## Required contract

- Exact Atlas project, approved revision, authority/publication identity, and
  consumed fact/concept/evidence IDs from POL-010.
- A capability-availability projection identifying which accepted POL contract,
  if any, supplies bindings, results, rationale, execution provenance, developer
  baseline, validation, or frozen publication.
- Status for current, blocked, missing, conflicting, cross-project, unavailable,
  and stale results without UI inference.
- For the POL-010-only state, links from each consumed fact/concept to its Atlas
  destination, contributing PRDs, and exact original evidence.
- Actual result-to-trigger and conclusion-to-policy links are excluded until
  the named REDESIGN-010A successor is authorized.
- Needs Answer remains Atlas-owned; CES may reference it as a blocker.

## Acceptance

- CES never rereads the PRD or manufactures substitute Atlas facts.
- Results fail closed for unapproved, stale, missing, or cross-project Atlas
  identities.
- A new Atlas successor marks prior affected results stale until approval and
  reevaluation.
- With only POL-010 accepted, consumed authority, revision, facts, and
  provenance render successfully while applicability, results, and conclusions
  are explicitly unavailable.
- Unimplemented POL capabilities remain honestly unavailable and no actual
  result is required for this ticket's terminal acceptance.
- Cross-domain fixtures and production-shaped UI tests pass.

## Manual verification

The owner opens CES Result and verifies the initial POL-010 chain:

```text
consumed Atlas authority -> approved Atlas knowledge
                         -> contributing PRD -> exact evidence
```

The UI identifies the consumed Atlas revision and clearly states that policy
results remain unavailable pending accepted binding and result contracts.

## Authorized successor slice

`ATLAS-REDESIGN-010A - Policy Result Projection` is authorized by the scoped
REDESIGN-000 amendment and may begin only after REDESIGN-010 is accepted,
POL-011 supplies accepted bindings/applicability, and POL-012 supplies accepted
governed result states. POL-013 and later capabilities may enrich that successor
only after their own accepting outcomes.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md` and
implements the accepted REDESIGN-009 and POL-010 authority contracts. Review
only capabilities backed by accepted POL contracts; later stages use
REDESIGN-010A or bounded successors rather than placeholders. Use the two-round
protocol and one terminal outcome. Acceptance completes the initial consumed-
authority UI integration but does not claim a policy result or reopen accepted
Atlas authority.
