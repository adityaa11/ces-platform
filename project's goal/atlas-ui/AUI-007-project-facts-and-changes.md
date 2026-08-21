# AUI-007: Project Facts and Changes Done

- **State:** awaiting_review
- **Review batch:** BATCH-06
- **Depends on:** AUI-003, AUI-004
- **Baseline:** UI/UX Prototype PRD 5.2, 5.4, 6, 9.1, 9.3; [AUI-007–AUI-010 reference-system analysis](AUI-007-010-reference-system-analysis.md)

## Outcome

Present non-workflow knowledge and incremental PRD evolution as source-grounded, navigable product surfaces.

## Scope

- Refine the fixture graph for fact groups/rows, typed change destinations, and source-accounting statements before rendering the surfaces.
- Implement Project Facts as numbered, expandable groups containing accumulated-value rows, source history, and shared PRD-lens behavior.
- Implement Changes Done as a timeline grouped by PRD increment, not a flat list.
- Represent established, clarified, expanded, superseded, and unresolved changes.
- Link every visible change to its fixture-resolved workflow, fact group/row, CES item, project-level, or unresolved destination.
- Consume the shared workspace lens and preserve it across destination links; do not own a screen-local selection.

## Acceptance criteria

- Facts such as scope, responsibilities, constraints, protection, outputs, and commitments are first-class, grouped, and traceable at both group and row level.
- Changes can be understood as an accumulated history by PRD increment, with kind, date, provenance, and resolvable destination.
- The one workspace PRD lens remains coherent in contextual and isolation modes in both surfaces and persists through cross-links.
- A user can inspect source evidence and source-accounting placement from representative facts and changes.

## Validation

- Exercise all change kinds, typed destinations, PRD-selection modes, accounting routing, and empty/isolation states.
- Check expanded fact groups/rows and increment timelines at desktop and mobile widths, including retained lens state after navigation.
