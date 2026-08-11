# CES-GF-POL-009 - Policy Contract

**Status:** Proposed
**Depends on:** POL-008

## Outcome

Define versioned, renderer-neutral contracts for approved policies, concerns,
capability needs, and resolution semantics.

## Scope

- Stable identities, definitions, lifecycle, version, and provenance.
- Valid policy-to-concern and concern-to-capability relationships.
- Applicability as a separate dimension from `DEFINED`,
  `AWARENESS_REQUIRED`, and `DECISION_REQUIRED` resolution.
- Explicit meaning and downstream blocking behavior for resolution states.

## Acceptance contract

- Unknown and incompatible relationships fail schema validation.
- A policy remains meaningful without architecture or stack fields.
- Applicability and resolution cannot be accidentally conflated.
- `DECISION_REQUIRED` identifies the missing decision class and affected scope;
  it does not invent an answer.
- Contracts support immutable baseline release references.

## Explicit non-goals

- Selecting policies for a project or binding Atlas facts.
- Defining implementation patterns, severity scores, prompts, or UI.
- Creating a database-specific schema.
