# CES-GF-POL-013 - Policy Reasoning Agent

**Status:** Proposed
**Review class:** REVIEW_GATE
**Depends on:** POL-012

## Outcome

Define and qualify an agent that proposes context bindings using only approved
CES knowledge and revision-pinned Atlas facts.

## Scope

- Versioned request, response, prompt, context, and execution contracts.
- Selection from approved policy, concern, and capability identifiers.
- Fact-grounded applicability, resolution, explanation, and outcome proposals.
- Bounded context, failure behavior, provenance, and adversarial fixtures.

## Acceptance contract

- The agent cannot introduce new identifiers or project facts into valid output.
- Runtime context excludes raw standards documents and the original buyer PRD.
- Every candidate passes POL-012 before publication or fails explicitly.
- Tests cover prompt injection, implementation prescriptions, missing decisions,
  irrelevant policies, and conflicting facts.
- Provider/model choice is not semantic authority and can be changed without
  changing the policy contract.

## Explicit non-goals

- Bridge transport integration, UI, automatic approval, architecture advice, or
  independent interpretation of ISO/OWASP sources at project runtime.
