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

## Tests and evidence

Validation-only retry, workflow-assignment retry, duplicate review, stale
finding, scope expansion, retry success, retry exhaustion, and provider failure.

## Out of scope

Human correction, approval, and model publication.
