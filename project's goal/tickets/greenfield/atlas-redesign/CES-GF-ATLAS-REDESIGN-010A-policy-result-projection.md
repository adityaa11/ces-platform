# CES-GF-ATLAS-REDESIGN-010A - Policy Result Projection

**Status:** Definition accepted; implementation blocked on REDESIGN-010,
POL-011, and POL-012
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-010, accepted POL-011 Context Binding, and
accepted POL-012 Deterministic Validator
**Owner:** CES Policies and cross-product integration

## Outcome

Display actual governed CES policy bindings and result states in Atlas and let
the project owner trace each result through its approved Atlas trigger to exact
original PRD evidence.

This ticket supplies the actual-result capability intentionally excluded from
the independently closable POL-010 consumed-authority slice in REDESIGN-010.

## Required contract

- Stable policy-result and binding identity from accepted POL contracts.
- Exact consumed Atlas project, approved revision, authority/publication,
  fact/concept, contribution, and evidence identities.
- Policy applicability/binding supplied by POL-011 and governed result state
  supplied by POL-012; the UI infers neither.
- Current, blocked, stale, missing, conflicting, and cross-project behavior as
  supplied by accepted policy contracts.
- Result-to-binding, binding-to-Atlas-trigger, trigger-to-workflow/fact, and
  trigger-to-source-evidence navigation.
- Honest capability availability for rationale, Agents Bridge provenance,
  developer baseline, coverage, and frozen publication until POL-013 through
  POL-017 are individually accepted.
- Needs Answer remains Atlas-owned and may only be referenced as a policy
  blocker.

## Production slice

Extend CES Result beyond the REDESIGN-010 consumed-authority view with result
cards/detail, governed status and applicability, triggering Atlas knowledge,
contributing PRDs, exact evidence, and preserved global PRD lens state.

## Acceptance

- At least one actual accepted policy result renders without placeholder data.
- The result identifies its accepted policy binding and exact approved Atlas
  revision and trigger.
- The owner can trace the result to Main Workflow or Project Facts, then to all
  contributing PRDs and exact evidence.
- Unapproved, stale, missing, or cross-project Atlas references fail closed.
- A newer Atlas revision marks affected prior results stale until reevaluation.
- Capabilities beyond POL-012 remain explicitly unavailable unless their own
  accepted contracts are present.
- Safara and structurally different non-Safara evidence, automated tests,
  typecheck, and production build pass.

## Manual verification

The owner follows the complete chain:

```text
actual CES result -> accepted policy binding -> approved Atlas trigger
                  -> contributing PRD -> exact source evidence
```

The UI identifies whether the result is current for the displayed approved
Atlas revision and never substitutes a fresh interpretation of the PRD.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md` and
implements accepted REDESIGN-010, POL-011, and POL-012 contracts. Use the
bounded two-round protocol and one terminal outcome. Stop after actual binding
and result projection is accepted; later POL capabilities require bounded
successor work and do not reopen this ticket.
