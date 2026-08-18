# CES-GF-ATLAS-REDESIGN-007 - Exact-Revision Review and Approval Workspace

**Status:** Definition ready; implementation blocked on REDESIGN-002,
REDESIGN-005, and REDESIGN-006
**Review class:** REVIEW_GATE
**Depends on:** Accepted REDESIGN-002, REDESIGN-005, and REDESIGN-006
**Owner:** Atlas review governance

## Outcome

Make the production UI the manual gate through which the project owner reviews
and approves one exact eligible Atlas proposal.

## Required contract

- Proposal revision and canonical hash; immutable reviewed subject identities.
- Review subjects covering workflow pages/elements, facts, statement
  dispositions, unresolved items, and governed revision changes.
- Findings, blocker class, clarification/correction link, decision, reviewer,
  timestamp, and audit history.
- Bounded Round 1 discovery, scoped remediation, Round 2 closure, and terminal
  outcome using established CES vocabulary.
- Deterministic eligibility derived from complete accounting, required subject
  decisions, unresolved blockers, proposal freshness, and exact hash.
- Accept, reject, defer, or supersede behavior only where the backend contract
  explicitly authorizes it.

## Acceptance

- Stale hashes, missing subjects, unresolved blockers, rejected required
  subjects, and cross-project decisions fail closed.
- Approval promotes only the reviewed proposal and preserves its predecessor.
- A later PRD creates a proposed successor and does not mutate approval history.
- UI never calculates eligibility independently.
- Audit replay reproduces the approved authority and decision chain.
- Tests cover all required revision states from the UI Manual Gate Context.

## Manual verification

The owner can inspect blockers and evidence, complete bounded decisions, see
eligibility, and approve exactly the proposal revision/hash shown on screen.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md`, including
Safara and structurally different non-Safara qualification.
Use one primary commit, bounded remediation, Round 2 closure, and one terminal
outcome. Stop after exact-proposal review and approval are accepted; authority
publication remains REDESIGN-009.
