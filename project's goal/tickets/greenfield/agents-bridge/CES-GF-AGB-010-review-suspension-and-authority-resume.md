# CES-GF-AGB-010 - REVIEW_GATE Suspension and Authority Resume

**Status:** Implemented candidate; pending REVIEW_GATE
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

## Implementation evidence

- The accepted event-authoritative workflow now records review, publication,
  and resume as hash-bound transitions while remaining suspended after proposal
  validation, review, and publication.
- Review outcomes are restricted to `ACCEPTED`, `NOT ACCEPTED`, and
  `ACCEPTED WITH DEFERRED ITEMS`; `NOT ACCEPTED` requires explicit bounded
  REQUIRED identities and cannot publish or trigger autonomous regeneration.
- Review rounds bind predecessor review, reviewed commit, exact proposal hash,
  bounded closure findings, and any qualifying-regression declaration.
- Publication requires an accepting review and binds the same review, commit,
  artifact hash, and external authority evidence. Only that exact, unconsumed
  publication can resume into `COVERAGE_RERUN_PENDING`.
- Altered, missing, rejected, stale, and duplicate resume paths fail. Proposal,
  validation, and review alone never advance coverage.
- Focused workflow and architecture tests pass, together with package
  typechecking.

This candidate records external authority; it does not generate a review
verdict, self-approve, grant final POL-008 authority, or implement AGB-011 retry
and non-convergence policy.
