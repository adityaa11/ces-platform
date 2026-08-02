# CES-GF-ATLAS-HARD-025 — Focused Backend-Owned UI Projections

**Stage:** Canonical model and workflow projection refinement
**Status:** Reopened — focused artifacts exist, workflow projections are disconnected

## Objective

Generate one readable integrated semantic graph plus supported model-specific
UI projections from one complete canonical model. Do not assume every document
supports a workflow.

## Dependencies

- ATLAS-HARD-010 and ATLAS-HARD-018 through ATLAS-HARD-024.

## Work

- Consume the HARD-021 model-support assessment and generate only supported
  model projections.
- Generate an integrated graph that relates shared actors, modules, workflows,
  operations, decisions, rules, states, reports, and evidence through canonical
  identities and governed typed relationships.
- Generate supported model views for workflow, module dependency, state,
  decision, actor-goal, sequence-interaction, functional-decomposition,
  activity-flow, BPMN-candidate, and conceptual-data models without cloning
  canonical concepts.
- Partition the integrated graph behind a small index and summary. Load actor,
  module, workflow, decision, state, conceptual-entity, rule, and evidence
  layers only when requested.
- Generate project overview, workflow detail, rules and controls, source
  traceability, and approval-exception projections.
- Restrict overview membership to major process semantics and summaries.
- Render operations, decisions, states, transitions, branches, loops, and
  dependencies in workflow detail.
- Preserve detailed controls in focused views.
- Partition rules-and-controls projections by workflow, cross-cutting control
  area, and semantic kind.
- Implement backend-owned deterministic artifact slices or an equivalent
  backend query contract for filtering and pagination; client-side filtering
  over one complete payload does not satisfy this ticket.
- Require revision-pinned cursors, deterministic sorting, stable slice IDs,
  bounded page sizes, lazy detail expansion, and search so clients never need
  to download every project rule.
- Open rules and controls on the selected workflow by default; cross-cutting
  and project-wide views require an explicit user selection.
- Link traceability through document, source unit, atomic claim, candidate,
  record, workflow, and operation.
- Reclassify the all-record graph as experimental semantic or
  rules-and-controls output.
- Keep membership and summaries backend-owned.
- Expose backend-owned semantic-layer filters for the integrated graph so the
  UI can progressively reveal actors, workflows/modules, decisions, states,
  rules, and evidence without downloading or rendering the entire inventory.
- Publish distinct projection-local node/edge IDs and canonical
  concept/relationship IDs according to ATLAS-UI-000.
- Attach evidence IDs, origin, rationale, and governance state to every
  governed projected node and edge.
- Represent projection-only constructs separately from canonical concepts and
  publish their derivation relationship IDs.
- Make overview eligibility, priority, semantic role, inclusion reason, and
  default visibility explicit backend fields.
- Publish bounded-summary limits and truncation/layer metadata so overview
  readability is measurable rather than frontend-inferred.

## Outputs

`proposed-model-support-assessment.json`,
`proposed-integrated-semantic-graph-index.json`,
`proposed-integrated-semantic-graph/summary.json`,
partitioned actor, module, workflow, decision, state, conceptual-entity, rule,
and evidence slices,
`proposed-model-projection-index.json`,
supported activity-flow, business-workflow, BPMN-candidate,
functional-decomposition, module-dependency, state, decision, actor-goal,
sequence-interaction, and conceptual-data projection artifacts,
`proposed-project-overview-graph.json`,
`proposed-workflow-detail-graphs.json`,
`proposed-rules-controls-index.json`, revision-pinned per-workflow and
cross-cutting rules-and-controls slices (or an equivalent backend query
contract), `proposed-traceability-graph.json`, and
`proposed-approval-exceptions.json`, plus rendered equivalents. Indexes and
slices remain non-authoritative projections of canonical bundle components.

## Acceptance criteria

- [x] Overview excludes detailed controls and delivery/commercial clutter.
- [x] Workflow detail retains operations, decisions, states, and transitions.
- [x] Detailed requirements remain accessible in focused tabs.
- [x] Rules and controls support per-workflow and cross-cutting-control slices,
      semantic-kind filtering, pagination, lazy expansion, and search.
- [x] Filtering and pagination are backend-owned with revision-pinned cursors,
      deterministic ordering, stable slice identifiers, and bounded pages.
- [x] No focused view requires downloading the complete project rule
      inventory.
- [x] The default rules-and-controls view loads the selected workflow rather
      than every rule in the project.
- [x] No single default projection recreates the all-record giant graph.
- [x] Rendered items resolve to canonical identity and exact evidence.
- [x] Heuristic hints are not established projection edges.
- [x] Frontend does not reconstruct semantic membership.
- [x] Proposed and approved projections share neutral contracts.
- [ ] The integrated graph and every focused model projection resolve shared
      concepts to the same canonical IDs.
- [ ] Only model kinds marked `supported` are offered as normal proposed
      projections.
- [ ] `partially_supported` produces only a visibly incomplete review
      projection; `human_review_required` produces only a non-authoritative
      preview.
- [ ] `insufficient_evidence`, `conflicting_evidence`, and `not_applicable`
      never produce a normal diagram projection.
- [ ] Selecting an item in any projection resolves the same item in the
      integrated graph and other applicable projections.
- [ ] Integrated-graph layer filters are backend-owned and do not infer new
      semantics in the frontend.
- [ ] The default integrated view loads only the bounded summary and index;
      detailed layers are paginated or progressively loaded.
- [ ] The integrated index publishes available layers, record counts, artifact
      hashes, schema versions, pagination metadata, and canonical-ID indexes.
- [ ] A non-workflow PRD can qualify without producing a workflow projection.
- [ ] Projection-local IDs are never reused as canonical semantic IDs.
- [ ] Every governed node and edge exposes exact evidence and governance data.
- [ ] Projection-only constructs remain explicitly non-authoritative and do
      not create canonical concepts.
- [ ] Overview inclusion and ordering are machine-readable backend decisions.
- [ ] Initial node, edge, byte, and layout budgets are configurable and
      reported in projection metadata.

## Tests and evidence

Large-model readability, per-workflow and cross-cutting slices, pagination,
lazy expansion, search, membership, exact traceability, workflow detail,
exceptions, proposed/approved parity, and deterministic rendering.

## Out of scope

Approval and eligibility are extended by ATLAS-HARD-026.

## Reopened acceptance gaps

The Safara workflow-detail artifacts exist, but every detail graph has an empty
edge collection and no readable per-workflow Mermaid projection is emitted.

- [ ] Workflow detail renders connected operations, decisions, states,
      branches, joins, loops, and dependencies.
- [ ] Generate deterministic Mermaid output for every non-empty workflow.
- [ ] Add a relationship-review projection for pending candidates.
- [ ] Preserve pending-edge styling as visibly non-authoritative.
- [ ] Prove project overview remains smaller than the full semantic model.
- [ ] Prove traceability reaches workflow and operation nodes through source
      unit, atomic claim, and canonical record lineage.
- [ ] Each governed semantic concept appears once per projection even when it
      has equivalent source representations in several languages.
- [ ] Evidence projections retain every exact original document
      representation.
- [ ] Pending equivalence members remain separate proposed non-authoritative
      nodes and may
      appear only as a review cluster; accepted equivalence projects one node,
      and rejected equivalence projects separate nodes.
- [ ] Project overview distinguishes parallel enablement, conditional branches,
      states, and non-sequential reporting data dependencies.
- [ ] Projections preserve fanout-group and independent/non-exclusive path
      metadata.
- [ ] Every displayed multilingual label identifies its selected
      representation, selection reason, and whether fallback was used.

### Safara qualification thresholds

- [ ] Every workflow has a detail projection.
- [ ] Every non-empty workflow has a deterministic Mermaid projection.
- [ ] Every projected edge resolves to canonical nodes and governance data.
- [ ] The project overview is smaller than the canonical semantic inventory.
- [ ] Rules and controls remain accessible without loading every project
      record.
- [ ] The relationship-review projection displays all pending candidates.

## Implementation evidence

Atlas now creates lifecycle-neutral focused projection contracts for project
overview, workflow detail, rules and controls, traceability, and approval
exceptions. Rules/control membership, sorting, pagination, revision-pinned
cursors, stable slice IDs, and artifact paths are backend-owned. Each slice is
published separately and the index contains only descriptors, so clients never
need to download the complete semantic inventory.

The canonical CLI emits:

- `proposed-project-overview-graph.json`
- `proposed-workflow-detail-graphs.json`
- `proposed-rules-controls-index.json` plus partitioned slice artifacts
- `proposed-traceability-graph.json`
- `proposed-approval-exceptions.json`

Verification:

- `corepack pnpm --filter @company/ces-atlas-intent-graph build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/atlas-intent-graph/src/index.test.ts apps/cli/src/atlas.test.ts`
- 14 focused tests passed.

## Connected shared-data and context projection amendment

The project overview and integrated semantic graph must render shared data and
context nodes when they materially explain the main workflow. They must use
canonical governed relationships and must not infer missing edges in the UI.

Additional acceptance criteria:

- [ ] Overview JSON and Mermaid display connected shared-data/context nodes
      rather than unexplained isolated boxes.
- [ ] Execution edges, data dependencies, context dependencies, reporting
      dependencies, and audit dependencies use distinguishable projection
      semantics.
- [ ] Shared input fanout remains one node with multiple edges.
- [ ] Reporting and audit consumers may both receive data without being
      represented as final sequential workflow steps.
- [ ] Selected workflow detail does not remove or replace the persistent main
      overview.
- [ ] Every projected shared-data/context edge resolves to canonical identity,
      governance, evidence, and review state.
- [ ] The projection contains no UI-side Safara inference or fixture-specific
      node/edge injection.
- [ ] A non-travel fixture produces the same projection shape rules with its
      own source-grounded labels and topology.

## Decision/outcome deduplication projection amendment

Focused projections must show a complete source condition once as a decision
and show each source-defined result as a distinct state node. Projection code
must not create a second normal node containing the same statement as the
decision.

Additional acceptance criteria:

- [ ] A decision statement appears once per semantic identity in an overview.
- [ ] Branch targets render their own source-defined state labels and semantic
      identities.
- [ ] Decision diamonds and state nodes never share the same canonical record
      solely to simplify projection.
- [ ] Exact decision wording remains available without forcing the state node
      to repeat the condition.
- [ ] The qualifying state, rather than the decision statement, owns a
      state-gated downstream edge.
- [ ] Duplicate decision/state display meaning emits a projection exception
      instead of silently rendering both.
- [ ] JSON and Mermaid contain matching decision, outcome, and edge identities.
- [ ] Generic fixtures prove the behavior for non-travel approval and
      lifecycle decisions.
- [ ] UI and projection code contain no Safara labels, special-case state
      shortening, or fixture-specific node replacement.
