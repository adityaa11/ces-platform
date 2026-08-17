# CES-GF-ATLAS-REDESIGN-009 - Atlas Qualification and Authority Publication

**Status:** Blocked on REDESIGN-001 through REDESIGN-008
**Review class:** REVIEW_GATE
**Depends on:** Accepting terminal outcomes for REDESIGN-001 through
REDESIGN-008; ATLAS-V2-011G resolved or explicitly superseded and satisfied here
**Owner:** Cross-product integration
**Blocks:** POL-010 dependency check

## Outcome

Prove that renewed Atlas is a trustworthy, generic manual verification product,
publish its exact accepted authority, reconcile obsolete UI authority, and
provide the sole Atlas gate that may unblock POL-010.

## Qualification scope

- Production-shaped Safara run with complete PRD accounting and accumulated
  project verification.
- At least one unrelated live workflow PDF and one unrelated live non-workflow
  PDF; synthetic-only evidence is insufficient.
- Multiple PRD increments, approved predecessor, proposed successor,
  contradictions/questions, lens modes, review/approval, and stale state.
- Every displayed semantic item and relationship traces to exact evidence.
- Complete UI Manual Gate checklist executed by the project owner.
- Unit, contract, integration, browser, security, typecheck, and production
  build gates.

## Authority publication

- Pin accepted contract versions, candidate/remediation commits, qualification
  artifacts, proposal hash/revision, reviewer decision, and terminal outcome.
- Execute the REDESIGN-000 supersession register for Atlas authority, plans,
  V2-008, V2-011, V2-011F, POL-010, Policies plan, and production gate.
- Remove or mark obsolete the legacy UI runtime and documentation without
  removing reusable semantic/evidence history.
- Resolve V2-011G by its own accepted outcome or explicitly record how this
  ticket subsumes every remaining live generic criterion.

## Acceptance

- All REDESIGN-001 through REDESIGN-008 outcomes are accepting and traceable.
- All three live project shapes pass without domain hardcoding.
- No material statement disappears and no UI component invents truth.
- Proposed/approved/stale states and exact approval operate correctly.
- The owner records successful manual verification of the production workspace.
- Published Atlas authority identifies the exact revision-pinned contract POL-010
  may consume.

## Manual verification

The owner can conclude that Atlas accounted for the documents, represented the
project correctly, exposed uncertainty, and approved one exact trusted revision.

## Review evidence and stopping condition

Use the established two-round `REVIEW_GATE`. Terminal outcomes are only
`ACCEPTED`, `NOT ACCEPTED`, or `ACCEPTED WITH DEFERRED ITEMS`. POL-010 remains
blocked unless this ticket has an accepting outcome whose deferred items do not
touch its input authority. This is the final Atlas product authority gate.
