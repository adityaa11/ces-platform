# CES-GF-AGB-010 - REVIEW_GATE Suspension and Authority Resume

**Status:** Proposed; implementation unauthorized
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-009
**Blocks:** AGB-011 and AGB-014

## Outcome

Make REVIEW_GATE an explicit suspension boundary and resume a Policy knowledge
workflow only from an externally accepted, durably published authority event.

## Scope

- Proposal handoff, suspended review state, terminal review outcomes, bounded
  remediation scope, accepted publication event, and resume validation.
- Terminal outcomes restricted to `ACCEPTED`, `NOT ACCEPTED`, and
  `ACCEPTED WITH DEFERRED ITEMS`.
- Commit/artifact/review/publication provenance and idempotent resume handling.

## Acceptance contract

- Submitting or validating an agent proposal never advances coverage.
- Only a publication bound to the exact reviewed artifact resumes the workflow.
- `NOT ACCEPTED` never triggers free-form autonomous regeneration.
- Closure rounds address only bounded REQUIRED findings unless a qualifying
  regression exists.
- Duplicate, altered, stale, wrong-workflow, or unauthorized resume events fail.

## Explicit non-goals

- Replacing human/project-owner authority, generating review verdicts, or
  granting final POL-008 approval.

## Review focus

Suspension correctness, external authority, bounded review behavior,
publication integrity, idempotency, and absence of self-approval.
