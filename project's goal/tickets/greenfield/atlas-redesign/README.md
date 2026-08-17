# CES Atlas Redesign Delivery Plan

**Status:** Authorized by accepted ATLAS-REDESIGN-000

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
| 10 | [REDESIGN-010](CES-GF-ATLAS-REDESIGN-010-ces-result-integration.md) | REVIEW_GATE | Revision-bound CES results inside Atlas |

Tickets execute in dependency order. Each ticket owns one primary bounded
implementation commit, any scoped remediation commits, review evidence, and
one terminal outcome. `Implemented` and `Completed` are not acceptance.

REDESIGN-009, not REDESIGN-000, authorizes POL-010's dependency check.
REDESIGN-010 follows accepted POL-010 so Atlas completion does not depend
circularly on CES Policies.
