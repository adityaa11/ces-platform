# BSS-V2-014-06 GO-dependency planning amendment 001

- **Authority:** [HMN-BSS-V2-014-06-001](BSS-V2-014-06-hmn-001.md), explicit human/planning decision, 2026-10-24.
- **Applies to:** [BSS-V2-014-06](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md) and [parent closure freeze 001](BSS-V2-014-06-parent-release-closure-contract-freeze-001.md).
- **Scope:** GO-dependency correction and replacement contract freeze only. This is not GO, code implementation, production activation, a release attestation, or GHR/IDSER execution authority.

## Exact supersession

| Historical clause | Superseded portion | Replacement requirement | Reason |
| --- | --- | --- | --- |
| Ticket “Precise non-GHR IDSER invocation finding” and `IDSER_PRODUCTION_PLANNING_INVOCATION_GAP` | treating a separate non-GHR IDSER production trigger as a condition for BSS parent implementation GO | The approved v2-only direct IDSER-to-BSS authenticated reader composition and exact candidate-read readiness are sufficient BSS integration evidence. No live planning execution is claimed. Future GHR-to-IDSER triggering remains separately owned and inactive. | GHR's future trigger relationship is distinct from the already implemented IDSER-to-BSS read relationship. |
| Ticket scope item 1 and `RC-01406-01` | requiring injection into a live planning invocation and removal of the inert entrypoint before BSS implementation | Keep one v2-only composition and its authenticated-read, identity, revision, fingerprint, sizing, and zero-effect proof. It may remain non-executing until separately owned IDSER orchestration exists; it must not be represented as live planning. | BSS must not invent an IDSER trigger, scheduler, or fake consumer to satisfy its own review. |
| Ticket “GO boundary” and `FRZ-01406-02` | treating absent promotion-attestation authority as a blocker for all BSS implementation work | The absence blocks only positive environment-specific successor activation and its completion claim. BSS may implement and validate the active/candidate reader distinction and fail-closed rejection of absent or self-asserted release evidence. | Existing authority supports fail-closed BSS work, not positive release authorization. |
| Ticket `RC-01406-03..05` and activation-positive rows of the validation matrix | requiring a valid reviewed release record and successful activation as part of the current BSS implementation closure | Replace with `RRC-01406-02.a` through `.d` in the replacement freeze. Positive release-record creation and production activation remain a separately owned `BLOCKED_AUTHORITY` gate. | No existing verified attestation authority may be invented by BSS or simulated as production approval. |

## Preserved requirements

The amendment changes no child result and no other parent invariant. The following remain active:

- one BSS authenticated v2 reader and one endpoint, with server-bound identity;
- exact immutable candidate versus exact active-profile semantics; active reads never use an arbitrary latest candidate;
- `bridge.activate_desired_admission_profile(...)` as the sole activation epoch, retaining its lock, monotonic revision, and fail-closed successor guard;
- no v1 compatibility, alternate reader, direct BSS SQL, capacity synthesis, or self-asserted activation evidence;
- GHR `can_continue:false` and `parsed_only`, with no GHR-to-IDSER continuation, NDV1 redemption, Better Auth interaction, SEM execution, provider send, or other downstream effect.

## GO and activation disposition

After independent review of the replacement freeze, a separate explicit GO may implement the BSS release-capable scope: server-bound candidate/active reader semantics, v2 composition/readiness validation, and rejection of untrusted release evidence. It does not authorize an activation record, a successful v2 successor epoch, application/environment deployment, or live IDSER planning execution.

`RELEASE_ATTESTATION_AUTHORITY_GAP` remains the precise production-activation blocker. The existing activation function must continue to reject successor activation until an independently authorized controlled release-attestation authority exists, writes verifiable evidence, and a later bounded contract validates positive and negative activation behavior. No alternate function, configuration flag, test fixture, or caller-provided manifest may bypass that guard.

## Status and handoff

This amendment is effective only with [replacement contract freeze 001](BSS-V2-014-06-go-dependency-replacement-contract-freeze-001.md). Stop after that freeze for independent review. Do not start GO or production activation without separate authorization.
