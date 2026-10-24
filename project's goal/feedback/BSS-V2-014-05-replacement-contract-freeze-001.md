# BSS-V2-014-05 replacement contract freeze 001 — initial v2 consumer activation

- **Ticket:** [BSS-V2-014-05](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-05-idser-calculated-capacity-consumer-handoff.md)
- **Parent:** [BSS-V2-014](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-weighted-capacity-ticket-set.md)
- **Planning amendment:** [initial v2 activation planning amendment 001](BSS-V2-014-05-initial-v2-activation-planning-amendment-001.md)
- **Historical freeze:** [BSS-V2-014-05 contract freeze 001](BSS-V2-014-05-contract-freeze-001.md), preserved unchanged.
- **Authority:** explicit human/planning approval on 2026-10-24, following [HMN-BSS-V2-014-05-001](BSS-V2-014-05-hmn-001.md).
- **State:** replacement contract frozen; not GO-authorized and not production-active.

## Replacement eligibility and scope

The historical `RC-01405-05` assumes a former active v1 IDSER consumer. The durable HMN diagnosis established that the v1 factory has no production composition or binding and occurs only in historical library/test fixtures. Satisfying the historical replacement oracle would require an unapproved fake v1 deployment. The planning amendment supersedes only that premise and the unsupported database/application atomicity claim. `RC-01405-01..04`, all BSS allocation/admission authority, accepted `-03`/`-04-03` evidence, and every GHR boundary remain active and unchanged.

## Replacement Review Contract

| Replacement clause | Historical mapping | Required observable state | Required proof / forbidden substitute |
| --- | --- | --- | --- |
| `RRC-01405-05.a` | `RC-01405-05` consumer-count/inventory portion | Exactly one active IDSER capacity-consumer composition uses one authenticated BSS v2 reader. No production v1 consumer or reader binding, adapter, fallback, dual-read, prospective conversion, direct BSS SQL, alternate reader, or parallel capacity authority exists. Historical v1 source may remain unbound. | Production-composition/source/caller/credential inventory with a negative v1-binding case. Importable library code or a test fixture is not an active consumer. |
| `RRC-01405-05.b` | `RC-01405-05` exact-reader integration portion | The v2 consumer accepts only authenticated `CapacityPlanningSnapshot/v2` with `status=qualified`, exact identity, revisions, policy provenance, allocation, structural bounds, and canonical fingerprint. Candidate readiness with `qualification.productionActive=false` is valid before activation. | Actual-reader integration through the composed consumer; stale, unavailable, foreign, non-qualified, or mismatched snapshot is typed stop/replan. No direct-table double or client-selected authority. |
| `RRC-01405-05.c` | `RC-01405-05` sizing/cutover consequence | One complete Semantic request satisfies `inputTokens + reservedOutputTokens <= sizing.maxEligibleCompleteRequestTokens` and every qualified input, output, context, request-byte, and applicable media bound. | Deterministic text/image/framing/output positive and boundary-negative fixtures through the existing shared estimator. No TPM/concurrency division, second tokenizer, capacity synthesis, or borrow-dependent immutable batch size. |
| `RRC-01405-05.d` | `RC-01405-05` release-activation portion | The parent release first proves v2-only candidate readiness, identity/revision/fingerprint match, `-03` and `-04-03` evidence, and no legacy path; only then does the existing BSS epoch activate the successor. Every failed prerequisite blocks activation. | Parent-gate negative/positive integration evidence tied to the selected activation profile/revision and fingerprint. No claim of distributed database/application atomicity, new epoch, registry, table, service, or compatibility lane. |
| `RRC-01405-05.e` | `RC-01405-05` isolation consequence | Capacity reads and readiness create no admission, reservation, quota/window mutation, job, transport, GHR continuation/delivery change, SEM call, provider send, reconciliation, projection, or semantic-truth effect. GHR remains `can_continue: false` and `parsed_only`. | Before/after effect counters and static GHR-boundary regression. No NDV1, Better Auth, GHR receiver/worker/route/payload change, or downstream execution substitute. |

## Parent fail-closed release sequence

1. Predeploy the v2-only consumer without enabling production processing.
2. Authenticate and qualify the exact BSS v2 candidate; accept isolated `productionActive=false` as pre-activation readiness only.
3. Verify `RRC-01405-05.a`–`.c`, exact release identity/revisions/fingerprint, and the accepted BSS runtime-enforcement dependencies.
4. Verify `RRC-01405-05.e` and retain the release evidence.
5. Invoke only the existing BSS activation epoch for the successor.
6. If any precondition or later read fails, block activation or typed-stop/replan; never fall back to v1 or an alternate capacity authority.

This is intentionally a serial, observable release procedure. The current database activation transaction cannot include application configuration/liveness, so this contract makes no atomicity claim.

## GO boundary

This freeze authorizes neither implementation nor activation. Independent review must confirm that the amendment supersedes only the named historical portions, preserves `RC-01405-01..04`, has no GHR drift, introduces no legacy compatibility or duplicate authority, and names no premature production path. A separate explicit user GO authorization is required after that review.
