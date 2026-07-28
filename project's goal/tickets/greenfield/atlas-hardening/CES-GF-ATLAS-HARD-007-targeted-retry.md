# CES-GF-ATLAS-HARD-007 — Targeted Retry

**Stage:** Atlas hardening quality
**Status:** Planned

## Objective

Retry only the source units, categories, assignments, or deduplication decisions
identified by unresolved completeness findings.

## Dependencies

- ATLAS-HARD-006.
- Completed DAPE-005 retry foundation.

## Work

- Define a retry request referencing the triggering finding, source units,
  extractor contract, revision tuple, attempt number, and retry scope.
- Route each request to the smallest applicable bounded extractor or
  deterministic pipeline stage.
- Select extractor capabilities through the pinned registry using finding kind,
  supported semantic kinds, and contract version; do not hardcode a closed
  category-to-extractor switch.
- Route unclaimed or novel findings to broad discovery or human review without
  discarding them.
- Preserve prior candidates and evidence; append retry output and resolution.
- Enforce deterministic attempt limits and explicit exhaustion status.
- Recalculate only affected coverage and findings without hiding history.

## Outputs

Retry requests, attempt history, appended candidates, finding resolutions, and
final unresolved/review-required state.

## Acceptance criteria

- [ ] Every retry is linked to one or more unresolved findings.
- [ ] Retry scope cannot silently expand to the whole extraction.
- [ ] Original candidates and evidence remain available.
- [ ] Attempt limits and terminal statuses are deterministic.
- [ ] Revision mismatch or stale findings reject the retry.
- [ ] Unresolved exhaustion requires human review rather than false success.
- [ ] Registered organization extractors can receive applicable retries without
      core routing changes.
- [ ] Unknown findings remain visible when no extractor capability matches.

## Tests and evidence

Validation-only retry, registered-extension retry, unknown/unclaimed finding,
workflow-assignment retry, duplicate review, stale finding, scope expansion,
retry success, retry exhaustion, and provider failure.

## Out of scope

Human correction, approval, and model publication.
