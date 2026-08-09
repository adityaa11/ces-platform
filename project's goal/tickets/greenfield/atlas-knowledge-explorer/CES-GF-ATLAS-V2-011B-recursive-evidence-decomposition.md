# CES-GF-ATLAS-V2-011B - Recursive Evidence Decomposition

**Status:** Planned
**Depends on:** ATLAS-V2-011A

## Outcome

Exhaustively decompose each module's relevant evidence into sufficiently atomic,
source-supported engineering and business concepts.

## Scope

- Gather all source units owned by or explicitly related to the selected module,
  including relevant cross-page evidence.
- Detect the source-supported business capability before decomposing its
  engineering intent; document structure is evidence-location input, not output.
- Extract concepts, roles, inputs, actions, preconditions, decisions, results,
  states, transitions, validations, permissions, entities, and dependencies.
- Re-run bounded decomposition while a source-supported concept contains
  meaningful lower-level semantics.
- Determine engineering intent for each concept: what the system or business
  does, who or what participates, applicable conditions, and observable result.
- Record an explicit terminal reason: atomic, context-only, unsupported,
  ambiguous/review-required, or extraction failure.
- Retain exact statements and source-unit references at every depth.
- Prevent domain-default concepts, inferred missing steps, and translated duplicates.

## Acceptance

- Introductory prose is context and cannot become a workflow action by position.
- Every relevant source unit receives an auditable disposition.
- A substantive module produces deeper concepts when its evidence supports them.
- Extracted depth is determined by semantic atomicity and evidence, not headings,
  provider response size, a fixed recursion count, or desired graph appearance.
- An unrelated workflow and non-workflow PDF use the same bounded process.
