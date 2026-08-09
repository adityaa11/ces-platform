# CES-GF-ATLAS-V2-011A - Semantic Decomposition Contract

**Status:** Planned
**Depends on:** ATLAS-V2-011

## Outcome

Define one renderer-neutral contract for recursively decomposed, source-grounded
semantic knowledge before changing extraction or UI behavior.

## Scope

- Represent semantic concepts including business capability, module, concept,
  actor, entity, input, action, precondition, state, rule, decision, condition,
  outcome/result, validation, permission, event, and dependency.
- Give every concept a stable identity, semantic kind, exact source label,
  evidence IDs, confidence, review status, parent, and ordered children.
- Represent evidenced semantic relationships independently from graph edges.
- Represent source-derived overview/context separately from semantic children so
  introductory wording can inform the detail view without becoming an action.
- Distinguish semantic children from available graph representations.
- Support zero-to-unbounded evidence-justified depth without hierarchy cycles.
- Preserve canonical identity without translated or same-meaning duplicates.

## Acceptance

- A module can own semantic concepts even when no graph is supported.
- The same semantic concept can appear in multiple graph projections without
  duplicating its canonical identity.
- Every concept and relationship is reachable, evidence-linked, and validated.
- The contract validates `graph node -> semantic concept -> source unit -> PDF
  page -> exact original text`, including confidence and review status.
- Existing shallow module-to-visualization bundles fail the semantic-depth fixture.
