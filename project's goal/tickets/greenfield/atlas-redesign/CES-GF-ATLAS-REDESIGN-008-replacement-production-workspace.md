# CES-GF-ATLAS-REDESIGN-008 - Replacement Production Workspace

**Status:** Blocked on REDESIGN-003 through REDESIGN-007
**Review class:** BATCHABLE
**Depends on:** Accepted REDESIGN-003, REDESIGN-004, REDESIGN-005,
REDESIGN-006, and REDESIGN-007
**Owner:** Atlas UI

## Outcome

Replace the existing Atlas UI shell with the accepted UI Gate layout and
section intent, driven exclusively by accepted backend projections.

## Required implementation

- Project/revision context and global multi-PRD lens.
- Sidebar sections: Main Workflow, Project Facts, CES Result, Changes Done, and
  Source Documents.
- Main Workflow overview and semantic-page experience.
- Fact groups, change ledger, source accounting, and manual review controls.
- Cross-section deep navigation preserving project, revision, lens, authority,
  and evidence state.
- Reuse exact PDF viewer, evidence highlighting, graph adapter, and accessible
  summaries only where compatible with the new layout.
- Honest CES unavailable/blocked state until REDESIGN-010; no sample results.
- Removal of the old Explore/permanent-graph/three-column product shell.

## Acceptance

- The production app matches the prototype's layout hierarchy and section
  intent without copying its bundled code or hardcoded Safara data.
- Every semantic value is supplied by a governed API projection.
- Loading, unavailable, empty, blocked, stale, and error states are explicit.
- Desktop and responsive behavior, keyboard navigation, focus, and accessible
  graph/evidence alternatives pass.
- Existing V2 API/PDF security and project isolation do not regress.
- Unit, integration, browser, typecheck, and production build gates pass.

## Manual verification

The owner can complete the available UI Manual Gate checklist in the actual
production-shaped app; CES Result clearly explains why results are unavailable
before accepted POL-010.

## Review evidence and stopping condition

This `BATCHABLE` ticket implements accepted semantics only. Any missing semantic
authority must stop or split into a gate. Record production captures, test/build
results, manual steps, candidate/remediation commits, and one terminal outcome.
