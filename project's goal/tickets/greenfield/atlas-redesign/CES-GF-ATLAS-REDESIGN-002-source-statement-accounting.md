# CES-GF-ATLAS-REDESIGN-002 - Source Statement Accounting

**Status:** Definition ready; implementation blocked on REDESIGN-001
**Review class:** REVIEW_GATE
**Depends on:** Accepted ATLAS-REDESIGN-001
**Owner:** Atlas semantic model

## Outcome

Guarantee that every material source statement receives a visible, governed
disposition and exact source traceability. Nothing material silently
disappears between ingestion and accumulated project knowledge.

## Required contract

- Stable inventory of every bounded source unit in each document revision.
- Deterministic `processed` or `unprocessed` state for every source unit;
  unprocessed units require an extraction-failure disposition and diagnostic.
- Governed material/non-material decision for every processed source unit;
  non-material classification requires a reason and exact supporting evidence.
- One source unit may yield zero or more stable material statements, but zero
  requires a governed non-material decision rather than silent omission.
- Stable material-statement identity, exact wording, source document/revision,
  source unit, page/span/coordinates, and extraction confidence.
- Dispositions for placed knowledge, needs answer, explicit exclusion,
  unsupported content, and extraction failure.
- Permanent destination IDs for placed statements and mandatory reasons for
  all non-placed dispositions.
- Review state and correction history without destroying original evidence.
- Reconciliation from total source units to processed/non-material/failed
  units, then from material statements to all statement disposition categories.
- Publication failure for missing, duplicate, or unexplained dispositions.

## Production slice

Add revision-pinned source-document list, accounting summary, statement detail,
destination navigation, and evidence APIs. Missing means unavailable, never an
empty success response.

## Acceptance

- Every material statement has exactly one current disposition.
- Every source unit is accounted for as materially processed, governed
  non-material, or extraction failed with a visible reason.
- Source-unit-to-statement and statement-to-disposition totals both reconcile.
- Totals are deterministic and reconcile for every document revision.
- Placed statements resolve to valid accumulated Atlas destinations.
- Needs-answer, exclusion, unsupported, and failure reasons remain visible.
- Exact PDF page and evidence location open without browser text search.
- Safara plus unrelated workflow and non-workflow cases cover every disposition.

## Manual verification

Opening a source document shows the accounting equation and lets the owner open
every statement's destination or explicit unresolved reason.

## Review evidence and stopping condition

This ticket inherits the per-slice evidence contract in `README.md`.
Use the bounded two-round protocol and one terminal outcome. Stop when complete
accounting and navigation are accepted; workflow grouping belongs to
REDESIGN-003.
