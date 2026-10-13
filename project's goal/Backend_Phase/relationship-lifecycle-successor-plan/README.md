# Option A relationship-lifecycle successor plan

**Status:** `REL-01_READY_FOR_GO` planning freeze. This directory contains the frozen successor contracts only; it is not GO, CFC, CK PASS, a migration, or production activation.

**Planning authority:** `project's goal/feedback/BSS-V2-004-03-05-hmn-004.md`, continued and frozen by `project's goal/feedback/BSS-V2-004-03-05-rel-hmn-005.md`.

**Historical preservation:** `BSS-V2-004-03-05`, GO commit `298021d`, and `CK-001.a`/`.b` remain historically unchanged and unresolved. `298021d` is retained as a code baseline; it is not a predecessor CK-PASS gate. No successor ticket reopens `08-01-03`, `08-01-04`, `08-02-01`, or the historical ticket.

## Frozen orders

### Implementation dependency order

```text
REL-01: additive provider envelope + provisional sidecar contract
  └─ CK PASS
       └─ REL-02: retrieve and project prior provisional revisions
            └─ CK PASS
                 └─ REL-03: successor finalization, staging and bindings
                      └─ CK PASS
                           └─ REL-04: offline successor qualification
                                └─ CK PASS
```

`08-01-03` is not an implementation prerequisite: REL-01 adds a sibling opt-in response envelope and does not alter `atlasSemanticSourceInputV031Schema` or its frozen stage map. `08-01-04` remains untouched because the new envelope compiler is a separately named opt-in compiler, not a change to the eight-stage compiler. `08-02-01` remains the authoritative source/slot/asset identity producer; REL-02 consumes its identity vocabulary but does not modify its accepted-relationship packet. `08-03-02` and `08-03-03` supply their existing strict-parser and final offline oracles respectively; REL-04 adds only the relationship-lifecycle oracle rows named in its ticket.

### Runtime order

```text
FIRST EXTRACTION
verified NormalizedDocument / derived-asset identities
  -> initial packet with source slots and zero relationship descriptors
  -> exactly one provider request using the REL opt-in envelope
  -> strict envelope parse; source-slot and source-evidence validation
  -> immutable provisional relationship revisions
  -> independent Semantic V1 finalization
     + durable draft-local deferred interpretations where essential dependency exists
  -> atomic draft-side staging/replay reference plus unchanged canonical handoff

LATER EXTRACTION
verified source snapshot + attributable stored provisional revisions
  -> REL-02 scope-verified deterministic projection
  -> exactly one provider request using the same opt-in envelope
  -> new/refined/challenged provisional revisions; append-only bindings and staging
```

No first packet requires, invents, or upgrades a relationship. A subsequent packet may use an existing **provisional** revision only as labelled context; it never becomes accepted authority, canonical evidence, or a completed Semantic V1 assertion because it was projected.

## Frozen interface choice

The old strict `atlasProviderExtractionProposalV1Schema` remains exactly:

```ts
{ version: "v1"; source_results: AtlasProviderSourceResultV1[] }
```

REL-01 owns the new, separately selected, strict envelope:

```ts
atlasProviderRelationshipExtractionEnvelopeV1Schema = z.strictObject({
  contract_version: z.literal("atlas.relationship-extraction-envelope/v1"),
  semantic_proposal: atlasProviderExtractionProposalV1Schema,
  relationship_proposals: z.array(atlasProviderRelationshipProposalV1Schema),
});
```

It is a single provider response, not an eighth-plus relationship call. Legacy callers continue to submit and parse only the old schema. The envelope's relationship proposal is detailed in REL-01; every provider-supplied ordinal, confidence, status-like value, or candidate reference is untrusted input and cannot issue accepted status or an Atlas canonical ID.

## Identity chronology

| When | Identity | Owner and authority |
| --- | --- | --- |
| Before request | `NormalizedDocument` execution/artifact/source SHA and locator/asset identities | existing perception/source owners; verifies source attribution only. |
| Packet build | `slot-######` temporary slot | packet-local, Atlas assigned; never a candidate identity. |
| Parsed response | provider relationship array ordinal and candidate reference tuple | REL-01 parser; ordering key only, never accepted authority or canonical identity. |
| After source validation | `relationship_lineage_id` and immutable `revision_hash` | REL-01; Atlas-issued from scope, source snapshot, validated locators, exact proposal payload, and provider ordinal. |
| Independent finalization | canonical Semantic V1 `local_candidate_id` | REL-03; Atlas-derived only after strict finalization. |
| Essential dependent meaning | `deferred_interpretation_id` | REL-03; draft-local immutable ID tied to exact response candidate tuple and relationship revision; not Semantic V1. |
| After finalization | `binding_hash` revision | REL-01 sidecar contract as invoked by REL-03; append-only relationship-to-canonical-candidate binding, or a deferred binding with no canonical candidate. |

## Retained and disabled behavior

| Existing behavior | Successor disposition |
| --- | --- |
| strict proposal parsing, owned-slot accounting, Atlas-derived IDs/evidence, canonical Semantic V1 parsing | retained in REL-03. |
| provider-neutral worker; staging, replay, fencing, cancellation, reconciliation, D1 stop | retained and regression-proven in REL-03/04. |
| two-string `AcceptedContextEvidence` | rejected at the REL-03 successor boundary; it is neither a provisional descriptor nor accepted evidence. |
| `AuthorizedSourceRelationshipBinding` accepted packet | remains owned by `08-02-01`; it is not used as a REL provisional input. |
| visual evidence in a completed canonical assertion based on provisional context | prohibited. |
| whole-document block from an unrelated unresolved relation | prohibited; only its exact dependent interpretation is deferred. |

The ticket files freeze scopes, changed-file ownership, review rows, legacy regressions and CK handoffs.
