# BSS-V2-004-03-05-REL-02 — provisional source-packet projection

**State:** `APPROVED` — CK returned `PASS` for reviewed commit `78573a3a10978a8ae60c78ae69d430fe23f124d1`. Verification: `project's goal/feedback/BSS-V2-004-03-05-REL-02-78573a3-review.md`.

**Dependencies:** REL-01 CK PASS; existing `08-02-01` source/slot/asset identity contract. REL-02 does not depend on accepted `AuthorizedSourceRelationshipBinding`, `08-01-03`, a reviewer, or an acceptance registry.

## Outcome and runtime boundary

Create a deterministic projection of stored REL-01 **proposed** revisions into the opt-in relationship-extraction request packet. The initial invocation passes an empty collection and is valid. The projection only supplies attribution/dependency context to the provider; it is not an accepted context packet and is never passed to `AcceptedContextEvidence`.

```ts
buildProvisionalRelationshipPacketExtension({
  sourceSnapshot: RelationshipPacketIdentity,
  sourceSlots: readonly TrustedFinalizationSlot[],
  revisions: readonly ContextSourceRelationshipRevisionV1[],
}): ProvisionalRelationshipPacketExtensionV1
```

The output is embedded only in the REL opt-in request body, alongside `source_slots`; legacy `buildSemanticSourcePacket()` and `buildUnhydratedMultimodalSourcePacket()` remain unchanged.

```ts
type ProvisionalRelationshipPacketExtensionV1 = {
  contract_version: "atlas.relationship-packet-extension/v1";
  relationships: readonly {
    relationship_lineage_id: string;
    revision_hash: string;
    owned_source_slot: string;
    context_source_slot: string;
    contextual_role: "title" | "legend" | "scope" | "interpretation";
    necessity: "essential" | "optional";
    uncertainty: "low" | "medium" | "high" | "unknown";
    disposition: "proposed" | "unresolved";
    source_evidence_slots: readonly [string, string];
  }[];
};
```

The packet contains no authorization, accepted status, attestation, candidate ID, asset byte, evidence excerpt, or source text not already supplied through the normal source slots. Each revision is retrieved through `loadForSnapshot` with exact project, workspace, bundle, document and source-SHA equality; the projector revalidates every locator/asset/source slot against the current snapshot before projection. It includes only `proposed`/`unresolved` immutable revisions, sorted by canonical lineage/revision hash. `accepted` records, if a future system creates them, are outside this leaf and are rejected rather than silently downgraded.

## Scope and expected files

| Path | Change |
| --- | --- |
| `packages/atlas-skills/src/provisional-relationship-packet.ts` | extension Zod/types and deterministic source-slot projection. |
| `packages/atlas-skills/src/relationship-extraction-envelope.ts` | additive request-packet composition helper only. |
| `packages/atlas-skills/src/index.ts` | additive exports only. |
| `packages/atlas-skills/tests/provisional-relationship-packet.test.ts` | empty/positive/foreign/stale/duplicate determinism and no-authority tests. |

Do not edit `semantic-source-packet.ts`, the 08-02-01 types, old prompt compiler/schema, source-input Zod, worker/finalizer, contracts, database migrations, or legacy fixture gold. Do not issue, persist, accept, review, hydrate, or publish a relationship.

## Frozen Review Contract

| Row | Binary PASS oracle |
| --- | --- |
| `RC-REL-02-01` | Zero valid revisions produces a deterministic valid empty extension: first extraction neither fails nor requires an existing relationship. |
| `RC-REL-02-02` | Matching immutable proposed revisions project repeatably with exact revision/slot/role/necessity/uncertainty; retrieval/projection rejects foreign scope, source SHA, execution/document mismatch, absent locator/asset, malformed hash, duplicate, unsupported disposition, and stale revision. |
| `RC-REL-02-03` | A projected relationship is visibly provisional and cannot add accepted authority, canonical evidence, candidate identity, source ownership, hydrated media, or a visual business assertion. |
| `RC-REL-02-04` | Existing `buildSemanticSourcePacket()` and `buildUnhydratedMultimodalSourcePacket()` outputs and legacy prompt/schema bytes remain unchanged. |

## Qualification and handoff

Run focused REL-02 tests, `packages/atlas-skills/tests/semantic-skills.test.ts`, and a byte/deep-equality regression for both legacy packet builders. Test fakes must show zero provider calls, jobs, reservations, review, and publication actions. CK PASS makes only REL-03 dependency-ready. A failure in revision issuance/persistence returns to REL-01; a finalizer issue returns to REL-03 planning, never to an in-place 08-02-01 rewrite.
