# CES-GF-ATLAS-REDESIGN-006 - Global PRD Lens and Cross-Section Navigation

**Status:** Definition ready; implementation blocked on REDESIGN-003,
REDESIGN-004, and REDESIGN-005
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-003, REDESIGN-004, and REDESIGN-005
**Owner:** Atlas API projection and Atlas UI

## Outcome

Provide one shared multi-PRD lens whose highlight and isolation semantics remain
consistent across every workspace section and navigation action.

## Required contract

- Selected source-increment IDs, mode, matching contribution IDs, affected
  section/item/page identities, and navigation ordering.
- Default accumulated mode with no source selected.
- Highlight mode preserving the full accumulated model while emphasizing
  selected contributions and de-emphasizing unselected data.
- Isolation mode returning selected contributions plus only required structural
  context, with every retained context item explicitly classified `CONTEXT`.
- Backend-owned context necessity and contribution matching; the UI must not
  infer either from text, colors, or graph adjacency.
- Stable navigation state containing project, revision, selected PRDs, mode,
  section, destination, and evidence location.

## Acceptance

- The same selection produces consistent results in workflow pages, facts,
  changes, source accounting, and the available CES shell.
- Multi-select, clear selection, highlight, isolation, and direct affected-page
  navigation work with keyboard and screen readers.
- Isolation never presents disconnected nodes as a complete workflow.
- Deep links restore all governed state and reject stale/cross-project IDs.
- Safara and unrelated fixtures demonstrate different contribution patterns.

## Manual verification

The owner selects one or more PRDs once, moves between sections, and sees the
same contributions highlighted or isolated with understandable context.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md`.
Use bounded Round 1/2 review and one terminal outcome. Stop after accepted lens
semantics, navigation projection, production UI slice, and qualification.
