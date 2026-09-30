# Planning decision: IDSER-009-03-02 supplemental D recovery

Ticket: `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
Batch: `IDSER-BATCH-09-03-02`
Decision date: 2026-09-30
Authority: explicit user-provided human/planning instruction for the bounded supplemental-gap recovery.

## Decision

The post-CFC verification at `project's goal/feedback/IDSER-BATCH-09-03-02-ae03382-supplemental-verification.md` identified one ticket-derived omission: the incorrect service credential must reject without mutating either the target or unrelated lifecycle rows. This decision authorizes exactly one additional supplemental contract-gap freeze for that omission.

The existing resolved supplemental clauses `CK-SUP-009-03-02-A`, `CK-SUP-009-03-02-B`, and `CK-SUP-009-03-02-C` remain historical resolved outcomes and must not be reopened, renumbered, or redesigned. The historical production-card requirement remains owned by IDSER-009-04. No architecture, authentication, lifecycle-contract, schema, or ticket-scope decision is required.

## Required supplemental review action

CK must freeze exactly one clause, `CK-SUP-009-03-02-D`, directly traced to corrected-ticket RC-C. Its sole closure target is route-authentication no-mutation evidence for an incorrect service credential through the existing internal perception-source route. After that freeze, a newer explicit HMN authorization may select only `CK-SUP-009-03-02-D` for one evidence-remediation CFC cycle.
