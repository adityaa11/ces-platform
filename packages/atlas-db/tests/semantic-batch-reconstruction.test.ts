import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket } from "@atlas/skills";
import type { AcceptedDocumentPlannerResultV1 } from "../src/semantic-batch-plan-input.ts";
import { PostgresSemanticBatchReconstructionResolver, SemanticBatchReconstructionError } from "../src/semantic-batch-reconstruction.ts";
import type { ResolvedSemanticBatchV3References } from "../src/semantic-batch-v3-reference-resolution.ts";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const scope = { projectId: "reconstruction-project", workspaceId: "reconstruction-workspace", bundleId: "reconstruction-bundle", documentId: "reconstruction-document" };
const sourceSha256 = digest("reconstruction-source");
const document = {
  version: "v1" as const,
  executionId: "reconstruction-execution",
  artifactId: scope.documentId,
  sourceSha256,
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" as const },
  provider: { name: "docling", processor: "test", executionId: "reconstruction-execution", processedAt: "2026-10-20T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "owned", text: "Owned canonical source." }], tables: [], visualRegions: [{ id: "figure", label: "A selected figure", assetRef: "derived/00000000-0000-0000-0000-000000000001" }] }],
};
const media = { assetRef: "derived/00000000-0000-0000-0000-000000000001", locatorId: "figure", pageNumber: 1, mediaType: "image/png" as const, sha256: digest("png"), byteLength: 68 };
const accepted: AcceptedDocumentPlannerResultV1 = { scope, normalizedDocument: document, source: { documentId: scope.documentId, sourceSha256 }, media: [media], rel: { state: "unavailable" } };
const owned = { documentId: scope.documentId, pageNumber: 1, sourceKind: "text_block" as const, localId: "owned" };
const context = { documentId: scope.documentId, pageNumber: 1, sourceKind: "visual_region" as const, localId: "figure" };
const packet = buildStepwiseSourcePacket({ document, ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "owned" }], contextOnlyLocators: [{ pageNumber: 1, locatorType: "visual_region", locatorId: "figure" }], assetIdentities: [{ pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256 }] });
const request = buildStepwiseRelationshipEnvelopeRequest(packet);
const requestBytes = Buffer.byteLength(request.systemPrompt) + Buffer.byteLength(request.sourceSpecification) + Buffer.byteLength(JSON.stringify(request.responseSchema));
const identity = (name: string) => ({ identity: name, version: "v3" });
const resolved: ResolvedSemanticBatchV3References = {
  reference: { documentPlanRef: "semantic-plan-reference", planHash: digest("plan"), batchId: "batch-0001", batchHandoffRef: "semantic-handoff-reference", batchHandoffHash: digest("handoff") },
  scope,
  source: { sourceSha256, normalizedDocumentRef: "reconstruction-cache", perceptionExecutionId: document.executionId, normalizedDocumentFingerprint: digest(JSON.stringify(document)), normalizedDocumentVersion: "v1", perceptionCapability: document.perception.capability, perceptionContractVersion: "v1" },
  acceptedMedia: [{ assetRef: media.assetRef, locator: context, sha256: media.sha256, mediaType: media.mediaType, byteLength: media.byteLength }],
  selection: { ownedLocators: [owned], contextOnlyLocators: [context] },
  commitments: {
    sourceSpecificationSha256: packet.sourceSpecificationSha256,
    requestSha256: digest(JSON.stringify(request)),
    manifestSha256: digest(JSON.stringify([media])),
    structuralBound: { identity: "reconstruction-bound", version: "v3", maxRequestBytes: requestBytes + 1, maxInputTokens: Math.ceil(requestBytes / 4) + 1, maxPromptBytes: requestBytes + 1, maxContextTokens: Math.ceil(requestBytes / 4) + 1 },
    packetProfile: identity("packet"),
    estimator: identity("estimator"),
    configuration: identity("configuration"),
    conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: requestBytes },
    requestBytes,
    inputTokens: Math.ceil(requestBytes / 4),
    reservedOutputTokens: 10,
    requestResourceEnvelope: { requestUnits: 1, tokenUnits: Math.ceil(requestBytes / 4), dayUnits: 1, concurrencyUnits: 1 },
  },
};

test("reconstructs v3 parity through background accepted-source redemption only", async () => {
  let calls = 0;
  const subject = new PostgresSemanticBatchReconstructionResolver({ unsafe: async () => { throw new Error("reconstruction must not query plan rows"); } }, {
    resolveBackground: async (input) => {
      calls += 1;
      assert.deepEqual(input, { normalizedDocumentRef: "reconstruction-cache", perceptionExecutionId: document.executionId, normalizedDocumentFingerprint: digest(JSON.stringify(document)), sourceSha256, normalizedDocumentVersion: "v1" });
      return accepted;
    },
  });
  const result = await subject.reconstruct(resolved);
  assert.equal(calls, 1);
  assert.equal(result.sourceSpecificationSha256, packet.sourceSpecificationSha256);
  assert.equal(result.requestSha256, resolved.commitments.requestSha256);
  assert.equal(result.manifestSha256, resolved.commitments.manifestSha256);
  assert.deepEqual(result.sourceSlotOrder, request.sourceSlots.map((slot) => slot.slot));
});

test("fails closed on request, media, and structural-envelope drift without a fallback", async () => {
  for (const mutate of [
    (input: ResolvedSemanticBatchV3References) => ({ ...input, commitments: { ...input.commitments, requestSha256: digest("changed-request") } }),
    (input: ResolvedSemanticBatchV3References) => ({ ...input, acceptedMedia: [{ ...input.acceptedMedia[0]!, sha256: digest("changed-image") }] }),
    (input: ResolvedSemanticBatchV3References) => ({ ...input, commitments: { ...input.commitments, structuralBound: { ...input.commitments.structuralBound, maxRequestBytes: 1 } } }),
  ]) {
    let calls = 0;
    const subject = new PostgresSemanticBatchReconstructionResolver({ unsafe: async () => [] }, { resolveBackground: async () => { calls += 1; return accepted; } });
    await assert.rejects(() => subject.reconstruct(mutate(resolved)), SemanticBatchReconstructionError);
    assert.equal(calls, 1);
  }
});
