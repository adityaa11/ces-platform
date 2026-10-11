# BSS-V2-004-03-08-02-01 GO checkpoint — deterministic multimodal source ownership/relationship packet

- **Ticket:** `BSS-V2-004-03-08-02-01`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-01-deterministic-multimodal-source-ownership-relationship-packet.md`
- **State:** `awaiting_review`
- **Implementation commit:** `640b99b604b6295bfa53f3b849e0d58161b91ef4` (`feat(atlas): add unhydrated multimodal source packet`)
- **Reviewed base:** `712ee5b50ae75953f26b346aa875396700aeea0e` (`docs(bss): approve stepwise compiler ticket`)
- **Prerequisites consumed:** `08-01-02` context-provenance resolution CK `PASS` in `BSS-V2-BATCH-04.03-08.01-02-ced86fa-context-provenance-review.md`; `08-01-04` CK `PASS` in `BSS-V2-BATCH-04.03-08.01-04-bce0856-review.md`.
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`; local offline test environment.

## Bounded implementation and changed-file impact

| Path | Contract impact | Classification |
| --- | --- | --- |
| `packages/atlas-skills/src/semantic-source-packet.ts` | Adds the independent `atlas.semantic.unhydrated-source-packet/v1` builder, accepted normalized/manifest relationship checks, pending media descriptors, deterministic source specification/hash, and successor handoff requirements. The existing text-only builder's return shape and bytes stay unchanged. | `INTENDED_NEW_PACKET_ONLY` |
| `packages/atlas-skills/src/index.ts` | Additive exports for the new offline packet contract only. | `INTENDED_NEW_PACKET_ONLY` |
| `packages/atlas-skills/tests/semantic-skills.test.ts` | Adds frozen positive/negative packet fixtures, including legacy text-only differential evidence. | `INTENDED_NEW_PACKET_ONLY` |

No canonical Semantic V1 schema, normalized-document schema, perception manifest, resolver, storage, bridge/provider adapter, job, reservation, transport, UI, fixture/gold, or historical CK artifact changed. The independently modified/untracked worktree paths were preserved and not staged.

## Packet boundary and successor handoff

`buildUnhydratedMultimodalSourcePacket()` consumes a parsed `NormalizedDocument`, manifest-declared contextual requirements, and only pre-authorized relationship bindings. It deterministically allocates one slot per normalized text/table/visual locator. A contextual visual is emitted only as `reference_context`; it does not create a business assertion. Image-bearing visuals without a contextual binding remain `pending_authorized_media`, including an unlabeled visual with no content. The packet contains only locator/reference/hash metadata and its deterministic specification hash; it has no `userPrompt`, image bytes, base64, vendor call, job, reservation, or media-token estimate.

An essential relationship requirement lacking an accepted binding fails `SOURCE_RELATIONSHIP_BLOCKED`. Duplicate/over-bound requirements, foreign document scope, unknown/mismatched visual asset references, malformed authorizations, and unsupported relationship roles fail before any transport seam. The packet consumes an accepted relationship; it neither issues nor upgrades relationship authority.

`unhydratedMultimodalPacketHandoffRequirements` records the later resolver's service identity, scoped replay-safe grant, verified manifest/integrity checks, ephemeral redacted retrieval, and cancellation duties. It records the planner's future use of hydrated-part metadata, prompt/profile/capability/deadline inputs and separately owned resource envelope. It explicitly provides no media-token estimate.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 17 tests, including deterministic unhydrated packet, pending-media, legacy-parity, missing/foreign/duplicate/unsupported relationship negatives. |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests, including the approved Semantic V1 differential-parity oracle. |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests, including staged replay without a second provider call. |
| `git diff --check` | PASS — no whitespace errors. |

All validation is deterministic and local. `external_provider_attempt_count: 0`; `semantic_job_count: 0`; `unintended_perception_job_count: 0`; `admission_reservation_count: 0`. No image bytes/base64, secret, provider request, retry, reconciliation, or publication was generated or logged. No pre-existing failure occurred in the required lanes.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Give each owned text/table/visual locator one deterministic slot; retain reference-context provenance without a business assertion; derive same-source relationships only from authorized normalized/manifest binding. | `semantic-source-packet.ts` sorts normalized pages and locators, scopes a binding to execution/artifact/source SHA plus the normalized visual `assetRef`, and emits `referenceContexts` separate from slots. `semantic-skills.test.ts`, `authorized multimodal packets are deterministic, unhydrated, and preserve pending media`, proves exact slot/relationship mapping and two-build equality. | `PROVEN` |
| `RC-02` | Keep unlabeled image-bearing visuals pending; fail missing, duplicate, foreign, unsupported, and over-bound relationships before transport. | The same positive test retains an unlabeled asset as `pending_authorized_media` without content. `multimodal packets fail closed for foreign, malformed, duplicate, and unbound visual relationships` proves foreign scope, mismatched asset, duplicate/over-bound, unknown visual, malformed authorization, missing essential binding, and unsupported role rejections. | `PROVEN` |
| `RC-03` | Demonstrate exact packet/source-spec/hash repeatability, reference-context nonownership, and unchanged legacy text-only bytes/failure decisions. | The packet test compares two complete packets and validates `sourceSpecificationSha256`; it verifies a context visual has role `reference_context`, and compares the text-only packet immediately before/after construction. Existing `normalized documents build deterministic complete provider-neutral source packets` and `source packets fail closed for duplicate, overflow, and byte-overflow source material` still pass in the 17-test skills run. | `PROVEN` |
| `RC-04` | Document later resolver/resource-planner inputs; include no bytes, vendor API, jobs, or invented media-token estimate. | `unhydratedMultimodalPacketHandoffRequirements` in `semantic-source-packet.ts` has bounded resolver/planner obligations. The positive test asserts the explicit no-media-token-estimate boundary; source inspection test and focused run establish no provider, persistence, or finalization seam. | `PROVEN` |

Internal readiness: READY_FOR_CK

**Handoff:** Stop for independent CK of `640b99b604b6295bfa53f3b849e0d58161b91ef4`. This checkpoint is not a CK `PASS` and does not authorize any successor leaf.
