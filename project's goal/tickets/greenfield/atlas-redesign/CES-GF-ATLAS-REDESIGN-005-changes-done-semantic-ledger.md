# CES-GF-ATLAS-REDESIGN-005 - Changes Done Semantic Ledger

**Status:** Blocked on REDESIGN-001, REDESIGN-003, and REDESIGN-004
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-001, REDESIGN-003, and REDESIGN-004
**Owner:** Atlas review governance and Atlas API projection

## Outcome

Define an authoritative per-PRD semantic revision ledger explaining how each
increment affected the accumulated project model.

## Required contract

- Stable change identity linked to source PRD, predecessor/successor revisions,
  evidence, affected Atlas identities, and permanent current destination.
- Governed classifications: established, clarified, expanded, changed,
  contradicted, unresolved, and explicitly superseded.
- Clear separation between project change and derived CES policy impact.
- Preservation of historical changes when current knowledge is superseded.
- Backend semantic delta; browser text diffing is forbidden.

## Acceptance

- Every contribution-changing PRD produces complete deterministic entries.
- Each entry resolves to Main Workflow, Project Facts, or an unresolved item.
- No-op, wording-only, and material semantic changes are distinguished by
  governed rules.
- Contradictions and supersession remain visible and evidence-linked.
- Safara increments plus a structurally different revision history qualify it.

## Manual verification

The owner opens a PRD group, understands what it established or changed, and
navigates to the accumulated destination and exact source evidence.

## Review evidence and stopping condition

Use the bounded two-round protocol. Stop when semantic change authority,
projection, fixtures, UI slice, and terminal outcome are accepted.
