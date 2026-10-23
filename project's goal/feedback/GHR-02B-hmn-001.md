# HMN Authorization: GHR-02B

**Ticket:** GHR-02B — Atomic NDV1 acceptance integration and pointer-only
pg-boss publication  
**Batch:** no separate batch identifier declared  
**HMN authorization ID:** `HMN-GHR-02B-001`  
**Invocation:** explicit user delegation of planning authority, 2026-10-24  
**Current workflow state:** historical CK `CHANGES_REQUIRED` on `CK-001.a`;
an explicit bounded planning amendment has now been recorded.  
**Frozen ticket reference:** [GHR-02B](../Backend_Phase/tickets/GHR_Phase/GHR-02B-atomic-ndv1-acceptance-and-pg-boss-publication.md)  
**Current HEAD before this record:** `133d737f`  
**Relevant GO commit:** `dde68c561b0c2e189f8543ad6d9adeed3644045b`  
**Relevant CK artifact:** [GHR-02B CK review](GHR-02B-dde68c56-review.md)  
**Relevant CFC commit:** none  
**Prior HMN authorization:** none  
**Worktree state:** unrelated pre-existing tracked and untracked changes are
present; none are included in this decision.

## Diagnosis

`CK-001.a` is a proof-environment issue, not a defect in the committed atomic
publication implementation. Its clone-only normal Atlas route proof could not
run because the clone Atlas dev server did not open a port. A full substitute
would need the Atlas/Docling runtime, not merely the protected PostgreSQL
clone. The user explicitly chose the bounded planning resolution: retire that
clone-exclusive normal-route condition and use the already completed,
authorized canonical signed-in project-card/PDF proof instead.

## Ticket-authority trace

The original requirement is traceable to the frozen ticket's **Required
real-source validation environment** and `GHR-02B-RC-01`; historical
`CK-001.a` records it verbatim. The user planning decision is recorded in
[GHR-02B planning amendment 001](GHR-02B-planning-amendment-001.md). It
supersedes only the impossible clone-exclusive normal-route proof and retains
the clone rollback assertion and every other ticket obligation.

## Decision

**RETURN_TO_CK** — no production remediation is authorized. The implementation
and its evidence have a stable committed target; CK must independently record
the effective replacement contract and determine the result under the explicit
planning amendment. This is not an HMN PASS and does not alter historical
`CK-001.a`.

## Authorized scope

Only the explicit planning amendment's superseded proof portion may be
considered for effective acceptance. RC-02 through RC-05, all non-superseded
RC-01 behavior, and the protected clone rollback proof are protected from
redesign or reopening.

## Required validation

CK must use the planning amendment and historical review as its authority
record, preserve the historical finding, and evaluate only the replacement
proof plus the still-active original obligations.

## Forbidden work

No CFC, new code, canonical mutation, clone rebuild, consumer, receipt/lease,
delivery, semantic, provider, or ticket-scope expansion is authorized by this
record.

## Handoff

**Expected next command:** `ck` — independent replacement-contract freeze and
verification of the amended effective acceptance conditions.
