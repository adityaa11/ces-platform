# IDSER-BATCH-09-03-02 supplemental CK verification — `ae03382`

- **Ticket:** IDSER-009-03-02 — Authenticated extraction activation lifecycle correction
- **Batch:** `IDSER-BATCH-09-03-02`
- **Review type:** HMN-authorized supplemental-gap post-CFC verification
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `ae03382946847373725616139f11662ac8a2cb53` (`fix(idser): prove corrected 009-03-02 lifecycle authority`)
- **Consumed authorization:** `HMN-IDSER-009-03-02-001`
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-09-03-02-cfc-remediation.md`
- **Supplemental frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-09-03-02-supplemental-contract-correction.md`
- **Original CK artifact:** `project's goal/feedback/IDSER-BATCH-09-03-02-746ba16-review.md`
- **Result:** `REVIEW_CONTRACT_GAP`

## Verification target and scope

The committed CFC checkpoint consumes the newer explicit HMN authorization and is the reviewed checkpoint at `HEAD`. This verification inspected only supplemental clauses `CK-SUP-009-03-02-A` through `-C`, the remediation diff, the committed focused integration assertions, the recorded Compose outcomes, and direct regressions in the changed route/worker integration fixture. It did not restart broad IDSER-009 review or require the IDSER-009-04 production-card sequence.

## Supplemental frozen clause outcomes

| Clause | Frozen-oracle outcome | Evidence inspected |
|---|---|---|
| `CK-SUP-009-03-02-A` | **RESOLVED** | CFC records `test:project-repository` passed 3/3. The existing project repository integration is named as the proof for waiting/queued/X=0/durable-job commit facts and enqueue rollback. |
| `CK-SUP-009-03-02-B` | **RESOLVED** | `packages/atlas-db/src/perception-authority.ts` now requires the exact execution/artifact D1 member and project/workspace-matched bundle in the redemption transaction. `packages/atlas-db/tests/perception-authority.integration.test.ts` asserts waiting/queued to processing/perceiving, X=0, one-time start timestamps, and unchanged control rows. CFC records the focused Compose typecheck and authority integration passed (1/1). |
| `CK-SUP-009-03-02-C` | **RESOLVED against its frozen enumerated oracle** | The committed authority integration provides before/after target and control snapshots for forged, wrong-execution/document/source, expired/missing grant, terminal execution/bundle/member, unbound execution, valid duplicate redemption, and replay after member progress. CFC records the focused Compose authority command passed (1/1). |

## Review-contract gap

The corrected ticket's “Activation, replay, and negative authority” section (line 46) explicitly requires an unauthenticated/incorrect service credential case, with target and unrelated lifecycle rows unchanged. Its “Security readiness” minimal proof (line 61) repeats that the wrong service credential must leave bundle/member state unchanged.

That case is absent from the supplemental clause C frozen case list and from the cited lifecycle snapshots. The existing route integration assertion at `apps/agents-bridge/tests/perception-integration.test.ts:129` observes only HTTP 401 for a wrong credential; it does not capture before/after target and unrelated bundle/member state for this negative. The CFC's focused authority snapshot matrix covers grant and scope denials, but it does not exercise route authentication.

This was a ticket-authorized condition available to the supplemental freeze, so it is a `REVIEW_CONTRACT_GAP`, not a CFC failure and not a new frozen clause. Completion impact: CK cannot certify all corrected RC-C evidence until human/planning authority resolves the gap through the existing supplemental-gap recovery path. The current review does not authorize more remediation or amend the frozen matrix. Return to human/planning authority for a planning decision; a future supplemental freeze and newer explicit HMN authorization are required before any further CFC cycle.

## Historical original findings

The original CK matrix and the earlier `CFC_NOT_READY_FOR_CK` record remain unchanged. The historical production-card clause `CK-002.b` is not a current IDSER-009-03-02 closure condition under the corrected ticket; its final card proof remains owned by IDSER-009-04. No historical clause was reopened or strengthened here.

## Direct regressions

No direct regression was observed in the remediation diff. The production change is limited to enforcing the exact D1 member/bundle join before redemption and lifecycle activation. The changed worker integration fixture now creates and cleans up the matching scoped lifecycle rows. The CFC records the Compose perception integration passed 2/2 as supporting route/worker evidence; no additional validation was run for this CK review.

## Decision

Record `REVIEW_CONTRACT_GAP` for IDSER-009-03-02 / `IDSER-BATCH-09-03-02`. The three supplemental frozen oracles are satisfied as written, but the corrected ticket's wrong-service-credential no-mutation proof was reasonably identifiable and omitted from the supplemental freeze. Return control to human/planning authority under the bounded supplemental-gap recovery process. This artifact does not authorize another CFC cycle.
