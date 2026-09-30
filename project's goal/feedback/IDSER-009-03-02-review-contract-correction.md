# Planning decision: IDSER-009-03-02 review-contract correction

Ticket: `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
Batch: `IDSER-BATCH-09-03-02`
Decision date: 2026-09-30
Authority: explicit user-provided human/planning instruction for the bounded IDSER-009 corrective chain.

## Decision

The historical GO checkpoint, first CK artifact, and current `CFC_NOT_READY_FOR_CK` artifact remain immutable historical evidence. Their record that the former contract contained a full authenticated production-card observation is preserved.

The ticket is corrected to own only persisted lifecycle authority at the authenticated, exact-scope `PostgresPerceptionAuthority.redeem()` boundary:

- RC-A: persisted pre-activation creation facts and atomic rollback;
- RC-B: exact-scope first authenticated redemption activates only the bound waiting/perception-queued pair; and
- RC-C: applicable invalid, stale, terminal, and replay redemption cases cannot mutate lifecycle authority.

The previous full real-authenticated `/home` waiting-to-extracting card sequence is removed from IDSER-009-03-02 closure conditions. It is final integration evidence owned by the existing IDSER-009-04 ticket. No ticket is created, no approved predecessor is reopened, and no lifecycle product behavior is changed by this sizing correction.

## Required supplemental review action

CK must create a supplemental review-contract-gap freeze for RC-A through RC-C only. It must preserve every historical CK clause and outcome, use stable supplemental clause IDs, and define exact Compose evidence/oracles for the corrected ticket. The former `CK-002.b` card observation is historical only and cannot be a 03-02 PASS condition.

After that supplemental freeze, a fresh explicit HMN authorization is required before CFC may remediate or collect supplemental evidence. The future CFC must preserve the current uncommitted in-scope redemption work and must not continue the former card oracle.
