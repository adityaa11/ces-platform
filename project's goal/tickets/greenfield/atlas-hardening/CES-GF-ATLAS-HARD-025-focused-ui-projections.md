# CES-GF-ATLAS-HARD-025 — Focused Backend-Owned UI Projections

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Generate focused UI projections from one complete canonical model instead of
presenting every normalized record in one buyer-facing graph.

## Dependencies

- ATLAS-HARD-010 and ATLAS-HARD-018 through ATLAS-HARD-024.

## Work

- Generate project overview, workflow detail, rules and controls, source
  traceability, and approval-exception projections.
- Restrict overview membership to major process semantics and summaries.
- Render operations, decisions, states, transitions, branches, loops, and
  dependencies in workflow detail.
- Preserve detailed controls in focused views.
- Partition rules-and-controls projections by workflow, cross-cutting control
  area, and semantic kind.
- Support pagination, lazy expansion, filtering, and search so clients do not
  load every project rule into one replacement giant graph.
- Open rules and controls on the selected workflow by default; cross-cutting
  and project-wide views require an explicit user selection.
- Link traceability through document, source unit, atomic claim, candidate,
  record, workflow, and operation.
- Reclassify the all-record graph as experimental semantic or
  rules-and-controls output.
- Keep membership and summaries backend-owned.

## Outputs

`proposed-project-overview-graph.json`,
`proposed-workflow-detail-graphs.json`,
`proposed-rules-controls-graph.json`, `proposed-traceability-graph.json`, and
`proposed-approval-exceptions.json`, plus rendered equivalents.

## Acceptance criteria

- [ ] Overview excludes detailed controls and delivery/commercial clutter.
- [ ] Workflow detail retains operations, decisions, states, and transitions.
- [ ] Detailed requirements remain accessible in focused tabs.
- [ ] Rules and controls support per-workflow and cross-cutting-control slices,
      semantic-kind filtering, pagination, lazy expansion, and search.
- [ ] The default rules-and-controls view loads the selected workflow rather
      than every rule in the project.
- [ ] No single default projection recreates the all-record giant graph.
- [ ] Rendered items resolve to canonical identity and exact evidence.
- [ ] Heuristic hints are not established projection edges.
- [ ] Frontend does not reconstruct semantic membership.
- [ ] Proposed and approved projections share neutral contracts.

## Tests and evidence

Large-model readability, per-workflow and cross-cutting slices, pagination,
lazy expansion, search, membership, exact traceability, workflow detail,
exceptions, proposed/approved parity, and deterministic rendering.

## Out of scope

Approval and eligibility are extended by ATLAS-HARD-026.
