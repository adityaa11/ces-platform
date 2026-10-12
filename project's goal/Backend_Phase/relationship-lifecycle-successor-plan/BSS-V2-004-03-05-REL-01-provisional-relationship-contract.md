# BSS-V2-004-03-05-REL-01 — provisional relationship contract and producer

**State:** `APPROVED` — CK returned `PASS` for remediation commit `cf3fa8a3f0f22f5ed22c4bbd5d451c34c46321d4`. Verification: `project's goal/feedback/BSS-V2-004-03-05-REL-01-cf3fa8a-verification.md`.

**Authority:** approved Option A; `BSS-V2-004-03-05-hmn-004.md`; `BSS-V2-004-03-08-01-02-hmn-003.md`; successor README and closure matrix.

**Dependencies:** none requiring another REL CK PASS. `298021d` is inspected baseline only. `08-01-03` is not reopened or required: this ticket adds a sibling opt-in response-envelope contract rather than changing its source-input Zod or stage authority map.

**Downstream:** REL-02 consumes the stored records; REL-03 consumes the parser/sidecar port. No reviewer, acceptance registry, publication, worker lifecycle, or finalizer change is in this ticket.

## Outcome and precise producer boundary

Create the strict, provider-neutral parser and deterministic materializer that turn an already received provider response into source-verified **provisional** relationship revisions. The concrete producer entry point is:

```ts
materializeProvisionalRelationshipRevisions({
  envelope: unknown,
  packetIdentity: RelationshipPacketIdentity,
  sourceSlots: readonly TrustedFinalizationSlot[],
  providerProvenance: ProviderProvenance,
  repository: ProvisionalRelationshipRepository,
}): Promise<MaterializedRelationshipProposalSet>
```

The function is called after JSON decoding and before any relation can be projected, finalized, or staged. It strictly parses the envelope, resolves each source reference exclusively through `sourceSlots`/`packetIdentity`, rejects invalid input before append, and persists the result through the repository port. It does not call a provider, decide which job/profile dispatches the envelope, emit canonical Semantic V1, or use `AcceptedContextEvidence`.

### Exact provider response interface

```ts
type AtlasProviderRelationshipProposalV1 = {
  owned_source_slot: string;
  context_source_slot: string;
  source_evidence_slots: readonly [string, string];
  relationship_type: "context_qualifies";
  direction: "context_to_owned";
  contextual_role: "title" | "legend" | "scope" | "interpretation";
  necessity: "essential" | "optional";
  uncertainty: "low" | "medium" | "high" | "unknown";
  proposed_meaning: string;
  source_language: string | null;
  candidate_refs: readonly { source_slot: string; candidate_index: number }[];
  predecessor: null | { relationship_revision_hash: string; relation: "refines" | "challenges" | "replaces" };
};

type AtlasProviderRelationshipExtractionEnvelopeV1 = {
  contract_version: "atlas.relationship-extraction-envelope/v1";
  semantic_proposal: AtlasProviderExtractionProposalV1;
  relationship_proposals: readonly AtlasProviderRelationshipProposalV1[];
};
```

Both objects are `z.strictObject`; strings and arrays are bounded, `candidate_index` is a non-negative integer, and `source_evidence_slots` must equal the owned/context pair in that order. The envelope is deliberately separate from `atlasProviderExtractionProposalV1Schema`: the old schema remains strict, byte/behavior compatible, and unable to accept relationship fields. The future opt-in request compiler selects this envelope as the response schema for one provider request; it is not a change to `prompt-003/v1` nor eight requests for eight logical stages.

`candidate_refs` and array position are untrusted response coordinates only. REL-01 assigns `provider_relationship_ordinal` from response order and records it as provenance. It does not accept a provider candidate ID, status, authorization, attestation, canonical ID, or arbitrary source identity. Original source wording/language is preserved by local resolution of the referenced source slots; `source_language` is merely an untrusted descriptive label and triggers no language-specific inference.

## Immutable records and replay port

`materialize…` writes an append-only `ContextSourceRelationshipRevisionV1` compatible with `atlas.context-provenance/v1`:

```text
{ relationship_lineage_id, revision_hash, scope(project, workspace, bundle, document, execution, source_sha256),
  normalized_document(execution_id, artifact_id, source_sha256), owned_source(locator), context_source(locator, asset identity when applicable),
  relationship(type, direction, role, necessity), disposition: "proposed", uncertainty,
  proposal_provenance(provider identity/run/ordinal/confidence=null), predecessor?, authorization: null }
```

`relationship_lineage_id` and `revision_hash` are Atlas-generated canonical hashes of the validated scope, source snapshot, local locator/asset identities, immutable proposal fields, predecessor, and provider ordinal. A provider's `proposed_meaning`, uncertainty, or source label never alters `disposition`. The record proves attributable source identity, **not** semantic correctness.

The exact persistence/replay port is:

```ts
interface ProvisionalRelationshipRepository {
  appendForExecution(input: { executionId: string; sourceSnapshot: RelationshipPacketIdentity; revisions: readonly ContextSourceRelationshipRevisionV1[] }): Promise<readonly ContextSourceRelationshipRevisionV1[]>;
  loadForSnapshot(input: { projectId: string; workspaceId: string; bundleId: string; documentId: string; sourceSha256: string }): Promise<readonly ContextSourceRelationshipRevisionV1[]>;
  stageSidecar(input: ProvisionalRelationshipStageV1): Promise<ProvisionalRelationshipStageV1>;
  loadStagedSidecar(input: { executionId: string; idempotencyKey: string }): Promise<ProvisionalRelationshipStageV1 | undefined>;
}
```

`appendForExecution` is idempotent on `(executionId, revision_hash)` and rejects same lineage/revision conflict. `stageSidecar` is idempotent on `(executionId, idempotencyKey, sidecar_hash)`. REL-01 defines the port and deterministic records only; a durable adapter/migration and the worker's atomic composition are REL-03 integration work and must meet REL-03's replay oracle. This is an explicit handoff, not an unnamed prerequisite.

## Scope, expected files, and prohibited work

Permitted source/test ownership is bounded to new REL-owned modules and their focused tests:

| Path | Change |
| --- | --- |
| `packages/atlas-skills/src/relationship-extraction-envelope.ts` | strict envelope Zod, types, deterministic parser/materializer. |
| `packages/atlas-skills/src/relationship-provenance.ts` | immutable revision, sidecar-port types and hashing helpers. |
| `packages/atlas-skills/src/index.ts` | additive exports only. |
| `packages/atlas-skills/tests/relationship-extraction-envelope.test.ts` | positive/negative/parser/replay-port contract tests. |

Do not edit `semantic-prompt.ts`, `semantic-source-input-v031.ts`, `semantic-source-packet.ts`, `packages/atlas-contracts`, the worker/finalizer, database migrations, legacy fixture files, or frozen tickets. Do not add a real provider call, job, reservation, human-confirmation path, acceptance issuer, canonical candidate, or publication path.

## Frozen Review Contract and regression matrix

| Row | Binary PASS oracle |
| --- | --- |
| `RC-REL-01-01` | A valid envelope linked to exact supplied source slots produces repeatable immutable `proposed` revisions with local scope/source/locator provenance and `authorization: null`. |
| `RC-REL-01-02` | Unknown fields, fences/decoded malformed values, noncanonical enums, missing/foreign/duplicate slots, incorrect source evidence pair, source-SHA/asset mismatch, dangling candidate tuple, forged predecessor, duplicate conflict, and accepted/confirmed/published claims are rejected before append. |
| `RC-REL-01-03` | Provider ordinal, confidence, candidate reference and source-language label remain provenance only; no test result contains accepted authority, canonical Semantic V1 output, visual-owned candidate, or automatic semantic correctness claim. |
| `RC-REL-01-04` | Repeated append/stage calls return the same immutable hashes and no duplicate revision; no provider interaction is performed by the materializer. |

Run the focused module tests plus `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts`; record that `prompt-003/v1`, the old proposal schema and `buildSemanticSourcePacket()` remain unchanged. CK must independently reproduce the rows and confirm zero provider calls/jobs/reservations.

## CK handoff and terminal condition

GO may finish only at `READY_FOR_CK` with all four rows proven, the exact changed-file inventory above, and an explicit replay-port handoff to REL-03. CK PASS unlocks REL-02. Any required change outside the listed paths is `OWNERSHIP_CONFLICT_BLOCKED`, not permission to expand this leaf.
