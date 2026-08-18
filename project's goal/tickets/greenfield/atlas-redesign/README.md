# CES Atlas Redesign Delivery Plan

**Status:** REDESIGN-001 through REDESIGN-009 definitions ready; REDESIGN-010
and REDESIGN-010A pending scoped regression closure

This is the active finite delivery sequence for the renewed Atlas manual
verification workspace. Product rails, gap evidence, supersession timing, and
the bounded review protocol are governed by
[`ATLAS-REDESIGN-000`](CES-GF-ATLAS-REDESIGN-000-manual-verification-workspace-redefinition.md).

## Delivery sequence

| Order | Ticket | Review class | Outcome |
| ---: | --- | --- | --- |
| 1 | [REDESIGN-001](CES-GF-ATLAS-REDESIGN-001-accumulated-project-prd-contribution-contract.md) | REVIEW_GATE | Accumulated project revisions and PRD contribution authority |
| 2 | [REDESIGN-002](CES-GF-ATLAS-REDESIGN-002-source-statement-accounting.md) | REVIEW_GATE | Complete material-statement disposition and traceability |
| 3 | [REDESIGN-003](CES-GF-ATLAS-REDESIGN-003-journey-stages-semantic-workflow-pages.md) | REVIEW_GATE | Backend-owned journey stages and semantic workflow pages |
| 4 | [REDESIGN-004](CES-GF-ATLAS-REDESIGN-004-project-facts-projection.md) | BATCHABLE | Buyer-facing non-workflow project facts |
| 5 | [REDESIGN-005](CES-GF-ATLAS-REDESIGN-005-changes-done-semantic-ledger.md) | REVIEW_GATE | Per-PRD semantic revision ledger |
| 6 | [REDESIGN-006](CES-GF-ATLAS-REDESIGN-006-global-prd-lens-navigation.md) | REVIEW_GATE | Consistent highlight/isolation and cross-section navigation |
| 7 | [REDESIGN-007](CES-GF-ATLAS-REDESIGN-007-exact-revision-review-approval.md) | REVIEW_GATE | Manual review and exact-proposal approval gate |
| 8 | [REDESIGN-008](CES-GF-ATLAS-REDESIGN-008-replacement-production-workspace.md) | BATCHABLE | Replacement UI Gate production workspace |
| 9 | [REDESIGN-009](CES-GF-ATLAS-REDESIGN-009-atlas-qualification-authority-publication.md) | REVIEW_GATE | Final trusted Atlas authority and POL-010 unblock gate |
| 10 | [REDESIGN-010](CES-GF-ATLAS-REDESIGN-010-ces-result-integration.md) | REVIEW_GATE | POL-010 consumed-authority view and honest result unavailability |
| 10A | [REDESIGN-010A](CES-GF-ATLAS-REDESIGN-010A-policy-result-projection.md) | REVIEW_GATE | Actual policy bindings/results traced through Atlas to evidence |

Tickets execute in dependency order. Each ticket owns one primary bounded
implementation commit, any scoped remediation commits, review evidence, and
one terminal outcome. `Implemented` and `Completed` are not acceptance.

## Inherited per-slice evidence contract

REDESIGN-001 through REDESIGN-010A explicitly inherit this contract. Each slice
must record or link:

- the semantic contract it creates or the exact accepted semantic contract it
  implements;
- its API or projection contract;
- production UI behavior that is manually verifiable;
- Safara evidence without production hardcoding;
- structurally different non-Safara evidence whenever the accepted ticket
  requires generic or cross-domain qualification;
- automated unit, contract, integration, and browser tests proportional to the
  slice;
- typecheck and production build evidence for every affected application;
- manual verification steps and observed result;
- candidate, remediation, and acceptance-bookkeeping commits; and
- Round 1 findings, Round 2 closure, and one terminal outcome.

A `BATCHABLE` slice consumes rather than creates semantic authority and must
name the accepted contract it implements. Discovery of missing or changed
authority triggers the established stop-and-promote rule.

REDESIGN-009, not REDESIGN-000, authorizes POL-010's dependency check.
REDESIGN-010 follows accepted POL-010 so Atlas completion does not depend
circularly on CES Policies. Actual policy-result projection begins in the named
REDESIGN-010A successor only after accepted POL-011 and POL-012.

## Ticket-definition readiness ledger

- Candidate ticket set: `e47bc8b5aa027073c11ea11b5bd9fadcdd250f93`
- Remediation: `1a60893c1341a8c479d254978b4f78776868362f`
- Remediation record: `b1b027616e57721c8b2b8423e9bbe069fdc7b81c`
- Round 2 result: REDESIGN-001 through REDESIGN-009 definitions ready for
  implementation in dependency order, recorded in
  `../../../feedback/CES_ATLAS_REDESIGN_TICKETS_ROUND2_REVIEW_b1b0276.md`.
- Remaining finding: `ATLAS-REDESIGN-R2-REGRESSION-01`, limited to
  REDESIGN-010/010A authority alignment.
