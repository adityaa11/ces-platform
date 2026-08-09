# CES-GF-ATLAS-V2-010F - Live Provider and Production UI Qualification

**Status:** Planned
**Depends on:** ATLAS-V2-010E

## Outcome

Qualify Atlas using actual PDF ingestion and the configured live provider, not
only curated provider-result fixtures.

## Scope

- Run the actual Safara PDF through ingestion, bounded Agents Bridge calls,
  merge, graph selection, coverage gates, publication, API, UI, and approval.
- Run one unrelated workflow-oriented PDF through the identical path.
- Run one unrelated PDF whose supported project structure is not a workflow.
- Record sanitized extraction scope results and coverage reports.
- Compare Safara output to `graphs context.md` and
  `supporting graphs context.md` at the semantic-objective level.
- Verify the three-column knowledge-explorer layout defined by `graphs
  context.md`: semantic navigation on the left, a permanently visible Main
  Workflow and dynamic detail section in the center, and PDF evidence on the
  right.
- Verify that selecting a Main Workflow node leaves the Main Workflow visible
  and opens that module below it; selecting a supporting graph or deeper child
  changes only the detail section.
- Verify recursive navigation at multiple depths with no UI-imposed maximum,
  using only children supplied by the backend rather than hardcoded graph tabs.
- Verify the breadcrumb begins with `Main Workflow`, reflects the exact current
  ancestry, uses original document labels, provides navigable parent segments,
  and changes only the lower detail context when traversed.
- Verify selection synchronization across left navigation, Main Workflow,
  detail graphs, breadcrumb, and evidence workspace.
- Verify the original PDF, cards, page navigation, OCR confidence, and exact
  highlights in the production UI.

## Acceptance

- Safara produces the evidenced project map and applicable recursive supporting
  graphs without hardcoded labels, relationships, or topology.
- The unrelated workflow produces its own source-worded model.
- The non-workflow document selects its appropriate structures.
- Sparse or invalid live responses fail safely rather than publishing.
- Proposed and approved bundles preserve identical topology and evidence.
- The Main Workflow is never replaced during detail navigation and may be
  minimized only through its explicit control.
- Applicable supporting graphs appear beneath their owning module; unsupported
  graph kinds and fixed empty tabs do not appear.
- Breadcrumb traversal preserves the Main Workflow and restores the correct
  selected detail and corresponding PDF evidence.
- A human manual review confirms the production UI against all three documents.
- Synthetic fixtures remain supporting unit tests and are not accepted as sole
  completion evidence.
