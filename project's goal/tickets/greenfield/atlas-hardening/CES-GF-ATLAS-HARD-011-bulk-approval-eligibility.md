# CES-GF-ATLAS-HARD-011 — Bulk Approval Eligibility

**Stage:** Atlas hardening approval
**Status:** Planned

## Objective

Calculate safe item and workflow bulk-approval eligibility in the backend so
clients do not infer approval safety from presentation data.

## Dependencies

- ATLAS-HARD-009 and ATLAS-HARD-010.

## Work

- Define versioned machine-readable eligibility rules and blocker codes.
- Require valid source anchors, acceptable confidence, resolved ambiguity,
  absence of conflicts/unsupported claims, resolved deduplication, and no open
  correction request.
- Calculate item, selection, workflow, and all-eligible summaries
  deterministically.
- Pin policy/configuration version and threshold in run metadata.
- Recalculate eligibility after decisions without mutating the proposal.

## Outputs

Per-item eligibility and blocker lists plus workflow and proposal-level bulk
approval summaries.

## Acceptance criteria

- [ ] Eligibility is backend-calculated and deterministic.
- [ ] Every ineligible item has at least one machine-readable blocker.
- [ ] Ambiguous, conflicting, unsupported, source-missing, low-confidence, and
      correction-requested items cannot be bulk approved.
- [ ] Eligibility policy and threshold revisions are pinned.
- [ ] Clients cannot override backend ineligibility.
- [ ] Exceptions remain individually reviewable.

## Tests and evidence

One fixture per blocker, multiple blockers, threshold boundary, stale policy,
workflow aggregation, all-eligible selection, and attempted client override.

## Out of scope

UI controls, reviewer authorization, and decision persistence.
