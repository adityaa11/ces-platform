# BSS-V2-014-05 initial v2 activation planning amendment 001

- **Authority:** explicit human/planning approval, `HMN APPROVED — BSS-V2-014-05 Initial V2 Consumer Activation`, 2026-10-24.
- **Applies to:** [BSS-V2-014-05](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md) and the [BSS-V2-014 parent](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-weighted-capacity-ticket-set.md).
- **Basis:** [HMN-BSS-V2-014-05-001](BSS-V2-014-05-hmn-001.md), which established that the v1 factory is library/test-only and there is no active production v1 IDSER capacity consumer.
- **Scope:** contract correction and replacement freeze only. This is not GO, CFC, implementation, activation, a BSS plan change, or GHR authorization.

## Exact supersession

| Historical clause | Superseded portion | Replacement requirement | Reason |
| --- | --- | --- | --- |
| `-05` Purpose and ownership boundary, first sentence | “replaces the active calculated-capacity consumer binding” | `-05` is initial activation of one v2-only IDSER consumer. | No active v1 production consumer exists. |
| `-05` Frozen consumer contract item 5 | removal/revocation of an old active v1 consumer and single-cutover replacement wording | Historical v1 code remains non-production-active; no v1 composition/binding, adapter, fallback, or dual read is allowed. | A nonexistent consumer cannot be revoked or used as cutover evidence. |
| `RC-01405-05` | active-v1 replacement and atomic endpoint/consumer switching | Replacement clauses `RRC-01405-05.a`–`.e` in the replacement freeze. | Application composition and the database activation transaction cannot be atomically committed by an existing source mechanism. |
| Parent activation gate item 4 | an atomic switch of an endpoint and active IDSER consumer | The fail-closed sequence below, using the existing activation epoch only after v2 readiness evidence. | The database epoch cannot observe or transact with application composition. |

`RC-01405-01..04` remain active and unchanged. The clarification to the existing full-request requirement is binding: IDSER uses `sizing.maxEligibleCompleteRequestTokens` for one complete Semantic request, and accepts only when `inputTokens + reservedOutputTokens <= maxEligibleCompleteRequestTokens` plus every qualified input, output, context, byte, and applicable media bound. IDSER owns output reservation/buffer estimation and batch packing; BSS owns allocation, qualification, and runtime admission.

## Replacement parent release requirement

The parent must retain `bridge.activate_desired_admission_profile(...)` as the sole BSS activation authority and use its activation revision. Before calling it for the successor, the release must prove: a prepared v2-only IDSER composition; an authenticated, qualified exact BSS v2 candidate; matching identity, revisions, policy provenance, allocation, structural bounds, and canonical fingerprint; the full-request sizing invariant; accepted `-03` and `-04-03` evidence; and the absence of every v1/adapter/fallback/dual-reader/alternate-authority path.

Candidate readiness while `qualification.productionActive` is `false` is valid pre-activation evidence. It is neither a failed readiness check nor a statement that traffic-bearing IDSER production execution exists. Any unavailable, stale, foreign, non-qualified, or mismatched observation blocks activation; the v2 consumer must fail closed to typed stop/replan after activation as well.

No new service, registry, database table, scheduler, activation epoch, or parallel capacity authority is authorized. The release record is a reviewable proof artifact, not a claim of application/database atomicity or a new authoritative consumer registry.

## Immutable boundaries

- GHR is excluded. `can_continue: false`, `parsed_only`, existing route registration/handler versions, and delivery/acknowledgement behavior are unchanged.
- No NDV1 redemption, Better Auth dependency, SEM/provider/reconciliation/projection execution, or GHR-to-IDSER continuation is authorized.
- No production v1 capacity consumer, adapter, fallback, dual read, direct BSS SQL, second tokenizer, capacity synthesis, TPM/concurrency division, or borrow-dependent immutable batch sizing is authorized.

## Status and handoff

This amendment is effective only with [replacement contract freeze 001](BSS-V2-014-05-replacement-contract-freeze-001.md). `BSS-V2-014-05` remains frozen and has no GO authorization. The remaining blocker before GO is independent review of this amendment/freeze; a separate explicit GO authorization is required afterwards.
