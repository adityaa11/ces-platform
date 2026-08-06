# CES-GF-ATLAS-V2-003 - Graph Selection

**Status:** Implemented
**Depends on:** ATLAS-V2-002

## Outcome

Select suitable graph kinds from extracted facts using the general heuristics
in `supporting graphs context.md`.

## Scope

- Evaluate explicit activity sequence before proposing a business workflow.
- Detect workflow, state machine, decision tree/table, entity lifecycle,
  dependency, audit flow, entity relationship, and future registered kinds.
- Support zero, one, or several graphs per module.
- Store evidence, score, rationale, missing prerequisites, and review state.
- Keep graph-kind selection separate from renderer selection.

## Acceptance

- Selection is deterministic for identical semantic facts.
- Unsupported or weakly supported graph kinds are absent or review-required.
- Adding a renderer cannot change the selected graph kind.
- Domain labels, Safara headings, and fixed keyword templates are not embedded
  in production selection logic.

Implemented by `@company/ces-atlas-graph-selection`. The selector uses typed
semantic facts and original context paths, emits evidence-linked support
assessments, and contains no renderer selection or Safara vocabulary.
