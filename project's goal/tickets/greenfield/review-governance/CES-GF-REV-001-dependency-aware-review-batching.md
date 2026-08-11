# CES-GF-REV-001 - Dependency-Aware Review Batching

**Status:** Accepted
**Review class:** REVIEW_GATE
**Depends on:** Existing bounded CES review protocol

## Outcome

Adopt dependency-aware provisional implementation and multi-ticket review
transport while preserving strict authority sequencing, per-ticket contracts,
bounded review rounds, commit provenance, and one terminal outcome per ticket.

## Scope

- Define REVIEW_GATE and BATCHABLE ticket classifications.
- Allow provisional BATCHABLE work only after its authority gates are accepted.
- Permit one review request/artifact to cover an explicit commit range.
- Preserve independent findings, rounds, and terminal outcomes per ticket.
- Require topological review where one ticket depends on an unresolved surface.
- Define primary, remediation, and acceptance-bookkeeping commit provenance.
- Require promotion to REVIEW_GATE when batchable work discovers new authority.

## Acceptance contract

- This workflow remains proposed and inactive until REV-001 is accepted.
- Terminal outcomes remain exactly `ACCEPTED`, `NOT ACCEPTED`, and
  `ACCEPTED WITH DEFERRED ITEMS`.
- A combined review artifact cannot issue a batch-level terminal result.
- Every included ticket retains its own acceptance evaluation, findings,
  review round, dependency impact, and terminal outcome.
- Real semantic dependencies are reviewed topologically; conditional terminal
  acceptance is prohibited.
- Each ticket has one primary implementation commit and may have only scoped
  remediation and acceptance-bookkeeping commits afterward.
- Unreviewed authority never becomes operational.
- Existing accepted outcomes and historical commit evidence remain unchanged.

## Explicit non-goals

- Weakening source-rights, security, migration, schema, or agent gates.
- Combining multiple tickets into one acceptance contract or terminal result.
- Reopening previously accepted tickets through batch review.
- Changing product semantics, product dependencies, or frozen CES boundaries.
- Allowing POL-006 extraction before its declared authority gates close.

## Review focus

Review only sequencing safety, activation authority, per-ticket review
independence, dependency propagation, commit provenance, and consistency with
the existing bounded two-round protocol.

## Acceptance evidence

- Commit `feb49b6` introduced the proposed dependency-aware batching gate.
- Round 1 result: `NOT ACCEPTED`; REQUIRED-01 and REQUIRED-02 required
  consistent inactive proposal wording and bounded commit-chain terminology.
- Commit `d8c6421` corrected both internal inconsistencies.
- Round 2 closure result: `ACCEPTED`.
