# CES-GF-ATLAS-REDESIGN-001 - Accumulated Project and PRD Contribution Contract

**Status:** Ticket definition remediation pending Round 2 readiness review
**Review class:** REVIEW_GATE
**Depends on:** Accepted ATLAS-REDESIGN-000
**Owner:** Atlas semantic model

## Outcome

Define the canonical accumulated-project authority from which every renewed
workspace section is projected. Adding a PRD creates a proposed successor and
never mutates the last approved revision.

## Required contract

- Stable project, project-revision, source-document, document-revision, PRD
  increment, statement, semantic destination, evidence, and contribution IDs.
- Ordered predecessor/successor revision identity and immutable approved state.
- Proposed, approved, and superseded authority without UI-derived meaning.
- Many PRDs per project and many contributing PRDs per Atlas item.
- One canonical contribution-role vocabulary shared with REDESIGN-005:
  `established`, `clarified`, `expanded`, `changed`, `contradicted`,
  `unresolved`, and `superseded`.
- Each contribution record has one role for one affected semantic destination;
  one source statement may produce multiple contribution records when it
  materially affects multiple destinations.
- Fail-closed project isolation, stale references, and identity validation.

## Production slice

Expose a revision-pinned project-context projection listing available project
revisions, their lifecycle/authority, included PRD increments, and contribution
summary. Preserve existing exact evidence and recursive semantic identities
where compatible.

## Acceptance

- Applying a second PRD creates a successor revision linked to its predecessor.
- The approved predecessor is byte-for-byte unchanged.
- Every accumulated item identifies all establishing or modifying PRDs.
- Cross-project, stale-revision, duplicate, and broken contribution references
  fail deterministic validation.
- Safara and a structurally different fixture prove generic behavior.
- Contract, assembly, API, integration, and regression tests pass.

## Manual verification

The UI exposes project, displayed revision, authority state, predecessor, and
included source increments without confusing proposed and approved truth.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md`.
Record candidate commit, schemas, fixtures, commands/results, screenshots or
production-shaped capture, Round 1 findings, remediation, Round 2 closure, and
one terminal outcome. Stop after the accepted contract and projection work;
statement accounting belongs to REDESIGN-002.

## Ticket-definition readiness ledger

- Candidate ticket-definition commit:
  `e47bc8b5aa027073c11ea11b5bd9fadcdd250f93`
- Round 1 findings: `ATLAS-REDESIGN-R1-BLOCKER-01` through
  `ATLAS-REDESIGN-R1-BLOCKER-03` and `ATLAS-REDESIGN-R1-IMPORTANT-01` through
  `ATLAS-REDESIGN-R1-IMPORTANT-02`, recorded in
  `../../../feedback/CES_ATLAS_REDESIGN_TICKETS_REVIEW_e47bc8b.md`
- Remediation commit: `1a60893`
- Round 2 closure: pending
- Implementation-readiness result: pending
