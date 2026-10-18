# BSS-V2-007–013 — authorization-first planning and renumbering checkpoint (2026-10-19)

- **State:** planning/authority alignment only; no GO, implementation, CFC, or CK approval is granted by this note.
- **Branch:** `codex/new-atlas-backend`.
- **Decision:** insert two reusable authorization seams immediately after the implemented BSS-V2-006 family, then shift the five previously unimplemented BSS-V2-007..011 planned tickets by **exactly +2**. Preserve every previously approved historical artifact, code contract and CK outcome. A newly planned ticket has no inherited PASS.
- **Distinct legacy series:** `BSS-007`, `BSS-008`, `BSS-009` (no `V2`) in architecture/baselines are separate, earlier source/perception/provider tickets; **do not renumber or reinterpret them**.

## Exact active ticket ID migration

| Former planned ticket | Binding successor ticket | Scope |
| --- | --- | --- |
| *new* | [BSS-V2-007](tickets/Stack_Setup_V2/BSS-V2-007-reusable-receiving-authorization-boundary.md) | Reusable receiving-work authorization verification |
| *new* | [BSS-V2-008](tickets/Stack_Setup_V2/BSS-V2-008-reusable-sender-authorization-boundary.md) | Reusable sender/producer proposed-handoff authorization |
| BSS-V2-007 | [BSS-V2-009](tickets/Stack_Setup_V2/BSS-V2-009-execution-usage-provenance-ledger.md) | Provider execution usage and provenance ledger |
| BSS-V2-008 | [BSS-V2-010](tickets/Stack_Setup_V2/BSS-V2-010-price-profiles-shadow-cogs.md) | Effective-dated prices and shadow COGS |
| BSS-V2-009 | [BSS-V2-011](tickets/Stack_Setup_V2/BSS-V2-011-privacy-preflight.md) | Privacy preflight |
| BSS-V2-010 | [BSS-V2-012](tickets/Stack_Setup_V2/BSS-V2-012-qualified-fallback-route-state.md) | Qualified fallback |
| BSS-V2-011 | [BSS-V2-013](tickets/Stack_Setup_V2/BSS-V2-013-integrated-reconciliation-checkpoint.md) | BSS integrated checkpoint |

**Review batches and RC numbers** follow the new IDs: `BSS-V2-BATCH-07/08` belong exclusively to receiving/sender auth, and former review batches `07..11` for five **planned** tickets become `09..13`. Old internal references to future work are superseded by this map; do not use old 007..011 planned paths for GO.

## Why BSS owns the shared mechanisms

- **BSS-V2-007:** a generic, service-authenticated **receiving-work** verifier and typed policy-port. It proves allowed receiver/route purpose, durable work authority/scope, lifecycle and cancellation without requiring a browser session. Domain adapters retain accepted-document/media/truth validation; GHR owns actual delivery identity and routing. Neither a GHR body nor possession of a service credential alone is access permission.
- **BSS-V2-008:** a generic, service-authenticated **producer/sender** verifier and proposed-intent contract. Domain producer must prove a committed eligible event/work transition bound to route, body schema/hash and scope. This is an **unissued intent**, not a GHR outbox, signature, router, event or delivery permit.
- Mechanisms share **contract/verifier patterns**, never a global all-service secret. Existing `AGENTS_BRIDGE_SERVICE_CREDENTIAL` is not expanded into a universal credential; Atlas/Bridge internal identity remains explicitly scoped and separately checked against domain work.
- Resource and policy ownership remains distinct: Atlas controls accepted NormalizedDocument/source/media and cancellation, each receiver controls its domain payload parser and action eligibility, BSS-005/006 retain capacity and admitted provider work, and GHR remains the only future generic issuer/transport/delivery owner.
- GHR v0.3 body fields remain **proposed**, pending separate production GHR qualification. Use non-delivering fixtures for BSS-007/008 and current IDSER planning; do not claim active routes or forge trusted issuer evidence.

## Bound consumer handoff and sequencing

1. **Current PASS preserved:** `IDSER-012-03-01-01` strict GHR-compatible body fixture/parser, and `IDSER-012-03-01-02` scoped accepted-document resolver are independent historical approved checkpoints. The latter currently verifies Better Auth sessions for its interactive authority; that PASS is not evidence of background work authorization.
2. **BSS-V2-007** qualifies the reusable receiving-work mechanism; **BSS-V2-008** separately qualifies generic producer authorization. Both require their own GO/CK, and no future GHR implementation is assumed.
3. [`IDSER-012-03-01-03`](tickets/Initial_Draft_Phase/IDSER-012-03-01-03-background-receiver-authorization-consumer.md) then reuses BSS-007 as the receiving policy adapter for `semantic/batch-plan` against the **same** accepted-document resolver. Logout must not terminate independently authorized background work, but revoked/stale/foreign work must fail closed. It cannot GO until BSS-007 CK PASS.
4. **`IDSER-012-03-02-01/02`** now require `-01-03` CK PASS rather than treating `-01-02` alone as the terminal background authorization proof; subsequent corpus planning/persistence and non-delivering output checks retain their existing hard stops.
5. **Future GHR** separately binds sender verified-intent evidence to authenticated route delivery/ack and receiving authorization. SEM-CUTOVER and reconciliation reuse both shared auth boundaries through separately frozen route policies, preserving exactly one GHR path and BSS admitted send lane.

## Explicit non-authorizations

No change to approved BSS-V2-005/006, IDSER-012-01, `IDSER-012-03-01-01/02`, SEM-CUTOVER, perception/source grants, GHR implementation, provider credentials or semantic truth. No direct Bridge SQL to `atlas.*`, second accepted-document resolver, per-route auth stack, new global authentication secret, GHR outbox, route registry, queue or provider caller. A ticket is `planned` until explicitly GO-authorized and independently CK reviewed.

**Precedence:** this checkpoint and new/renumbered ticket headers override any stale future-number references in `atlas-bss-v2-implementation-context.md` and archived ticket commentary; approved historical source/CK evidence always remains immutable.
