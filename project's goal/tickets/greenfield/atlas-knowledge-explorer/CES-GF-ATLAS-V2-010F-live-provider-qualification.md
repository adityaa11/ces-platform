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
- Verify the original PDF, cards, page navigation, OCR confidence, and exact
  highlights in the production UI.

## Acceptance

- Safara produces the evidenced project map and applicable recursive supporting
  graphs without hardcoded labels, relationships, or topology.
- The unrelated workflow produces its own source-worded model.
- The non-workflow document selects its appropriate structures.
- Sparse or invalid live responses fail safely rather than publishing.
- Proposed and approved bundles preserve identical topology and evidence.
- A human manual review confirms the production UI against all three documents.
- Synthetic fixtures remain supporting unit tests and are not accepted as sole
  completion evidence.

