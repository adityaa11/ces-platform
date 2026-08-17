# CES-GF-ATLAS-REDESIGN-010 - CES Result Integration

**Status:** Blocked on REDESIGN-009 and POL-010
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-009 and accepted POL-010 Atlas Fact Input
Contract; subsequent POL tickets only for the capabilities they actually supply
**Owner:** CES Policies and cross-product integration

## Outcome

Populate the Atlas CES Result section progressively with policy conclusions
derived from the exact approved Atlas revision, while preserving the authority
boundary between Atlas project truth and CES engineering policy results.

## Required contract

- Exact Atlas project, approved revision, authority/publication identity, and
  consumed fact/concept/evidence IDs from POL-010.
- Progressive availability by POL stage: binding/applicability, deterministic
  states, rationale, Agents Bridge provenance, developer baseline, validation,
  and frozen publication only when the corresponding accepted contract exists.
- Status for current, blocked, missing, conflicting, cross-project, unavailable,
  and stale results without UI inference.
- Links from every result to triggering Atlas knowledge, workflow page or fact,
  contributing PRDs, and exact original evidence.
- Needs Answer remains Atlas-owned; CES may reference it as a blocker.

## Acceptance

- CES never rereads the PRD or manufactures substitute Atlas facts.
- Results fail closed for unapproved, stale, missing, or cross-project Atlas
  identities.
- A new Atlas successor marks prior affected results stale until approval and
  reevaluation.
- Unimplemented POL capabilities remain honestly unavailable.
- Buyer-readable conclusions remain traceable to governed policy rules and
  approved Atlas triggers.
- Cross-domain fixtures and production-shaped UI tests pass.

## Manual verification

The owner opens a CES result and follows the complete chain:

```text
CES result -> approved Atlas knowledge -> contributing PRD -> exact evidence
```

The UI identifies the consumed Atlas revision and whether the result is current.

## Review evidence and stopping condition

Review only capabilities backed by accepted POL contracts; later stages may be
delivered by bounded successor tickets rather than placeholders. Use the
two-round protocol and one terminal outcome. Acceptance completes the initial
cross-product UI integration but does not reopen accepted Atlas authority.
