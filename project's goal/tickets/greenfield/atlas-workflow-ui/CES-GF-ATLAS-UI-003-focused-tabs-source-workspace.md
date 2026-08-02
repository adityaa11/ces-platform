# CES-GF-ATLAS-UI-003 — Focused Workflow Tabs and Source Workspace

**Stage:** Atlas workflow review UI
**Status:** Reopened — contracts exist; Next.js component migration and real evidence-route integration are required

## Objective

Let reviewers inspect each selected workflow through focused backend-owned
views while keeping exact source evidence visible beside it.

## Dependencies

- ATLAS-HARD-025, ATLAS-UI-001, and ATLAS-UI-002.

## Work

- Add workflow-detail tabs:
  - Flow;
  - Rules;
  - Validations;
  - Permissions;
  - States;
  - Evidence;
  - Approval.
- Keep these workflow-detail tabs distinct from top-level supported-model
  projections. The frontend must not reinterpret one model kind as another.
- Hide a tab only when the backend projection explicitly reports it empty.
- Load workflow-specific slices instead of downloading the complete semantic
  inventory.
- In the source workspace:
  - show the source-document list;
  - open the selected document and page;
  - show the exact original-language statement;
  - show every exact original document representation attached to the selected
    semantic concept;
  - highlight the exact source unit and text span;
  - show bounding boxes when available;
  - label translations and canonical wording as interpretation aids.
- Keep traceability visible through document, source unit, atomic claim,
  canonical record, workflow, and operation.
- Synchronize graph, tab item, and source selections without frontend semantic
  inference.

## Acceptance criteria

- [x] Every non-empty focused projection has a corresponding tab.
- [x] Top-level supported-model tabs come only from the backend model-support
      assessment and share canonical selection with focused detail tabs.
- [x] Selecting a node, edge, rule, validation, permission, or state opens its
      exact evidence.
- [x] Original wording is visually distinct from translations and canonical
      wording.
- [x] Same-meaning multilingual content appears once in workflow views, with
      all exact original representations available in Evidence.
- [x] Pending possible-equivalence members remain visibly separate and are
      labeled as pending human review; only accepted equivalence is displayed
      as one authoritative concept.
- [x] The primary label exposes its source representation and deterministic
      selection reason; changing candidate order does not change it.
- [x] Page, section, source-unit identity, and text span are displayed.
- [x] Bounding boxes are shown when projection data provides them.
- [x] One workflow can load without downloading every project record.
- [x] Missing evidence is shown as an approval exception, not silently hidden.
- [x] Cross-tab and source synchronization is tested.
- [x] Source documents are delivered only after authenticated, project-scoped
      authorization and document-access events are audited.
- [ ] Focused tabs and source navigation run as React components against real
      authenticated Next.js Route Handlers, not assumed endpoint contracts.
- [ ] Cross-model selection uses the same canonical concept ID while every
      exact source representation remains inspectable in Evidence.

## Out of scope

Human decisions and approval materialization are completed by ATLAS-UI-004.

## Implementation evidence

- Detail projections explicitly declare Flow, Rules, Validations, Permissions,
  States, Evidence, and Approval slices; only `explicitly_empty` slices hide.
- Each item retains its backend canonical concept and optional evidence ID.
  Pending equivalence stays separate and labeled; accepted concepts can expose
  multiple exact source representations behind one workflow item.
- Evidence access uses same-origin credentials, project scope, and revision
  pinning. Responses must contain the matching project/revision and a server
  audit-event receipt before any document text renders.
- The source pane distinguishes exact originals from canonical interpretation,
  displays deterministic primary-selection rationale, location/span/bounds,
  and the full document-to-operation trace.
- Eleven UI tests pass and application typecheck passes.
