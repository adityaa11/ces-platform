# CES-GF-POL-011 - Context Binding Contract

**Status:** Proposed
**Review class:** REVIEW_GATE
**Depends on:** POL-009 and POL-010

## Outcome

Define how an approved policy is bound to concrete, revision-pinned Atlas facts
with concerns, capability needs, reasoning, and unresolved decisions.

## Scope

- Binding identity, policy baseline, Atlas revision, fact references, outcome,
  concern IDs, capability IDs, applicability, and resolution.
- Evidence-grounded explanation and missing-decision descriptors.
- Candidate, validated, approved, rejected, and superseded lifecycle.

## Acceptance contract

- Every activated binding references at least one valid Atlas fact.
- No binding embeds an invented fact, policy, concern, or capability identifier.
- Required outcomes state WHAT must remain true without prescribing HOW.
- Non-applicability and insufficient context are explicit and distinguishable.
- Superseding an Atlas or policy revision cannot mutate an approved binding.

## Explicit non-goals

- Generating bindings or choosing architecture and implementation.
- Defining severity/scoring or human-facing presentation.
- Allowing free-form identifiers from an agent.
