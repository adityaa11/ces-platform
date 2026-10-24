# BSS-V2-014-06 parent-release closure contract freeze 001

- **Ticket:** [BSS-V2-014-06 parent release/activation closure](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md)
- **Parent:** [BSS-V2-014](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-weighted-capacity-ticket-set.md)
- **Authority:** explicit parent-level planning authorization, 2026-10-24.
- **State:** contract frozen for independent review; not GO-authorized, not production-active, and not an environment activation record.

## Frozen disposition

All BSS-V2-014 child CK evidence is accepted unchanged. The remaining work is parent release closure only. No child is reopened by this freeze unless an implementation defect is demonstrated at the parent integration seam.

Two facts are frozen as release blockers, not implementation invitations:

1. The current v2 composition in `apps/agents-bridge/src/main.ts` is inert (`void idserCapacityPlanningSnapshotV2Consumer`). No non-GHR production caller invokes either approved IDSER structural-fit planner. Tests and an offline qualification script are not a legitimate production invocation.
2. The current successor guard in `bridge.activate_desired_admission_profile(...)` correctly rejects the v2 calculated profile pending a parent gate, but the repository has not identified an existing controlled promotion invocation that can create a database-verifiable release attestation. A caller-supplied assertion cannot be treated as approval.

The first blocker belongs to future IDSER planner orchestration; the second belongs to the existing release/promotion authority. Neither is GHR, SEM, NDV1, Better Auth, or child remediation work.

## Contract freeze

The only admissible successor design is:

1. Use the established non-GHR IDSER invocation when and only when its owner provides it; inject the already-approved v2 consumer there. Do not create a scheduler, adapter, test fake, GHR continuation, or secondary BSS reader.
2. Keep the endpoint and authenticated reader. Before activation it resolves the release-selected immutable candidate and declares `productionActive:false`; after activation it resolves the exact active desired profile and declares `productionActive:true`. The latter never resolves an arbitrary newest candidate.
3. Keep `bridge.activate_desired_admission_profile(...)` as the exclusive epoch, with its advisory lock and monotonic revision. Permit the v2 successor only by an immutable reviewed release record checked and consumed in that same activation transaction. No boolean, configuration switch, app health signal, or direct SQL invocation may bypass it.
4. Bind the release record to candidate profile/revision, expected predecessor and resulting activation revisions, policy/allocation/route-authority revisions, canonical fingerprint, exact consumer/planner readiness, v2-only inventory, child evidence hashes, and independent-review evidence.
5. Preserve GHR exactly: `can_continue:false`, `parsed_only`, no GHR-to-IDSER continuation, no NDV1 redemption, Better Auth interaction, SEM execution, provider send, or other downstream effect.

## Review gates

Independent review must answer each question yes before GO:

| Gate | Review question |
| --- | --- |
| `FRZ-01406-01` | Does the proposed IDSER wire point already exist as a legitimate non-GHR production invocation, rather than a test, offline script, GHR path, or newly invented scheduler? |
| `FRZ-01406-02` | Does the release record have an existing, auditable attestation authority and is it immutable, exact, and consumed atomically by the existing epoch? |
| `FRZ-01406-03` | Does the one reader distinguish isolated candidate from exact active profile without a second endpoint, v1/v2 adapter, direct SQL, or latest-candidate-as-active behavior? |
| `FRZ-01406-04` | Do the validation oracles prove pre-activation rejection, authorized activation, post-activation active read, stale/revision/fingerprint rejection, zero legacy bindings, and zero forbidden effects? |
| `FRZ-01406-05` | Are child evidence and every GHR hard boundary preserved without scope expansion? |

## Independent-review request

Request independent review of this freeze and ticket before GO. If either frozen ownership blocker remains absent, the reviewer must return the named stop code and owner; they must not approve a substitute invocation, new activation authority, or GHR expansion.
