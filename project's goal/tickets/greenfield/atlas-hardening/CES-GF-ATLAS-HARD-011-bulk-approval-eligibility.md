# CES-GF-ATLAS-HARD-011 — Bulk Approval Eligibility

**Stage:** Atlas hardening approval
**Status:** Implemented

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
- Define mandatory blockers for `unknown_semantic_kind`,
  `classification_required`, and `derived_interpretation_requires_review`.
- Calculate item, selection, workflow, and all-eligible summaries
  deterministically.
- Pin policy/configuration version and threshold in run metadata.
- Recalculate eligibility after decisions without mutating the proposal.

## Outputs

Per-item eligibility and blocker lists plus workflow and proposal-level bulk
approval summaries.

## Acceptance criteria

- [x] Eligibility is backend-calculated and deterministic.
- [x] Every ineligible item has at least one machine-readable blocker.
- [x] Ambiguous, conflicting, unsupported, source-missing, low-confidence, and
      correction-requested items cannot be bulk approved.
- [x] Unknown, unclassified, and unconfirmed derived records cannot be bulk
      approved.
- [x] Eligibility policy and threshold revisions are pinned.
- [x] Clients cannot override backend ineligibility.
- [x] Exceptions remain individually reviewable.

## Tests and evidence

One fixture per blocker, multiple blockers, threshold boundary, stale policy,
workflow aggregation, all-eligible selection, and attempted client override.

## Completion evidence

- Added hashed policy, item/workflow eligibility, summary, and selection-guard
  contracts to the proposal package.
- Eligibility derives from canonical evidence, candidate confidence, kind,
  classification, origin, and machine-readable issues.
- Unknown, classification-required, derived, and review-risk records are
  blocked while exact eligible records remain selectable.
- Proposal and architecture tests passed; package typecheck passed.

## Out of scope

UI controls, reviewer authorization, and decision persistence.
