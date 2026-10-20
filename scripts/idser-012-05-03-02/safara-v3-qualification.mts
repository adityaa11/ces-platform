import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { buildStepwiseRelationshipEnvelopeRequest, buildStepwiseSourcePacket } from "@atlas/skills";
import { PostgresAcceptedSemanticBatchPlanDocumentResolver, PostgresAcceptedSemanticBatchPlanInputFixtureRepository } from "../../packages/atlas-db/src/semantic-batch-plan-input.ts";
import { PostgresImmutableSemanticCorpusPlanRepository } from "../../packages/atlas-db/src/immutable-semantic-corpus-plan.ts";
import { PostgresSemanticBatchPlanReadyFixtureReceiver, fixtureSemanticBatchPlanReadyV1 } from "../../packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const sql = postgres(databaseUrl, { max: 2 });

try {
  const [source] = await sql.unsafe(`SELECT execution.id
    FROM atlas.project project
    JOIN atlas.document document ON document.project_id=project.id
    JOIN atlas.extraction_bundle_document member ON member.document_id=document.id
    JOIN atlas.extraction_bundle bundle ON bundle.id=member.bundle_id AND bundle.project_id=project.id
    JOIN atlas.document_perception_execution execution ON execution.id=member.perception_execution_id
    WHERE project.name='Safara Professional Perception'
      AND document.original_filename='Safara_Buyer_Business_PRD_Professional.pdf'
      AND member.state='perceived' AND bundle.state='processing' AND execution.state='completed'
    ORDER BY execution.created_at DESC LIMIT 1`);
  assert.ok(source?.id, "the preserved Safara source must have one accepted perceived execution");

  const fixture = await new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql as never).derive(String(source.id));
  const accepted = await new PostgresAcceptedSemanticBatchPlanDocumentResolver(sql as never).resolveBackground(fixture.input);
  const owned = accepted.normalizedDocument.pages.flatMap((page) => [
    ...page.textBlocks.filter((block) => block.text.trim()).map((block) => ({ documentId: accepted.scope.documentId, pageNumber: page.number, sourceKind: "text_block" as const, localId: block.id })),
    ...page.tables.filter((table) => table.content.trim()).map((table) => ({ documentId: accepted.scope.documentId, pageNumber: page.number, sourceKind: "table" as const, localId: table.id })),
  ]).slice(0, 2);
  const selectedMedia = accepted.media.slice(0, 1);
  assert.ok(owned.length > 0 && selectedMedia.length === 1, "Safara qualification requires selected text/table and visual content");
  const visual = selectedMedia.map((media) => ({ documentId: accepted.scope.documentId, pageNumber: media.pageNumber, sourceKind: "visual_region" as const, localId: media.locatorId }));
  const packet = buildStepwiseSourcePacket({
    document: accepted.normalizedDocument,
    ownedLocators: owned.map(({ pageNumber, sourceKind, localId }) => ({ pageNumber, locatorType: sourceKind, locatorId: localId })),
    contextOnlyLocators: visual.map(({ pageNumber, sourceKind, localId }) => ({ pageNumber, locatorType: sourceKind, locatorId: localId })),
    assetIdentities: selectedMedia.map((media) => ({ pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256: fixture.input.sourceSha256 })),
  });
  const request = buildStepwiseRelationshipEnvelopeRequest(packet);
  const requestBytes = Buffer.byteLength(request.systemPrompt) + Buffer.byteLength(request.sourceSpecification) + Buffer.byteLength(JSON.stringify(request.responseSchema));
  const inputTokens = Math.ceil(requestBytes / 4);
  const manifestSha256 = hash(JSON.stringify(selectedMedia));
  const requestSha256 = hash(JSON.stringify(request));
  const identity = (name: string) => ({ identity: name, version: "v3" });
  const plan = {
    version: "ImmutableSemanticCorpusPlan/v3" as const,
    scope: accepted.scope,
    source: {
      sourceSha256: fixture.input.sourceSha256,
      normalizedDocumentRef: fixture.input.normalizedDocumentRef,
      perceptionExecutionId: fixture.input.perceptionExecutionId,
      normalizedDocumentFingerprint: fixture.input.normalizedDocumentFingerprint,
      normalizedDocumentVersion: "v1" as const,
      perceptionCapability: accepted.normalizedDocument.perception.capability,
      perceptionContractVersion: accepted.normalizedDocument.perception.contractVersion,
      rel: accepted.rel,
      acceptedMedia: selectedMedia.map((media) => ({ assetRef: media.assetRef, locator: { documentId: accepted.scope.documentId, pageNumber: media.pageNumber, sourceKind: "visual_region" as const, localId: media.locatorId }, sha256: media.sha256, mediaType: media.mediaType, byteLength: media.byteLength })),
    },
    proposal: {
      proposalId: "idser-012-05-03-02-safara-v3",
      proposalHash: hash("idser-012-05-03-02-safara-v3-proposal"),
      sourceHash: hash(packet.sourceSpecification), policyHash: hash("idser-012-05-03-02-policy"), estimatorHash: hash("idser-012-05-03-02-estimator"), manifestSha256,
      structuralBound: { identity: "idser-012-05-03-02-safara-bound", version: "v3", maxRequestBytes: requestBytes + 1, maxInputTokens: inputTokens + 1, maxPromptBytes: requestBytes + 1, maxContextTokens: inputTokens + 1 },
      bssSnapshot: { source: { sourceId: "idser-012-05-03-02-qualification", sourceVersion: "v3" }, enforcement: { policyId: "idser-012-05-03-02-qualification", policyVersion: "v3" }, process: { profileId: "idser-012-05-03-02-qualification", profileVersion: "v3" }, workload: { planId: "idser-012-05-03-02-qualification", planVersion: "v3", estimator: identity("idser-012-05-03-02-estimator") } },
      packetProfile: identity("stepwise-relationship-envelope"), estimator: identity("idser-012-05-03-02-estimator"), configuration: identity("idser-012-05-03-02-sizing"), promptIdentity: identity("stepwise-relationship-prompt"), schema: identity("atlas-provider-extraction-proposal"), composer: identity("stepwise-source-packet"), route: identity("reference-only"), adapter: identity("reference-only"),
      eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: inputTokens, dayUnits: 1, concurrencyUnits: 1 },
      inventory: [...owned.map((locator) => ({ locator, classification: "eligible" as const })), ...visual.map((locator) => ({ locator, classification: "unexamined" as const, reason: "visual_context_only" }))],
      batches: [{ batchId: "batch-0001", ownedLocators: owned, contextOnlyLocators: visual, sourceSpecificationSha256: packet.sourceSpecificationSha256, requestSha256, manifestSha256, packetProfile: identity("stepwise-relationship-envelope"), estimator: identity("idser-012-05-03-02-estimator"), configuration: identity("idser-012-05-03-02-sizing"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1" as const, value: requestBytes }, requestBytes, inputTokens, reservedOutputTokens: 1, requestResourceEnvelope: { requestUnits: 1, tokenUnits: inputTokens, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: packet.sourceSpecificationSha256, requestBytes, inputTokens, reservedOutputTokens: 1, outcome: "fit" as const }] }],
    },
  };
  const repository = new PostgresImmutableSemanticCorpusPlanRepository(sql as never);
  const persisted = await repository.persist(plan);
  const body = fixtureSemanticBatchPlanReadyV1(persisted);
  assert.deepEqual(await new PostgresSemanticBatchPlanReadyFixtureReceiver(sql as never).receive(body.canonicalJson), body.body, "the v3 handoff must remain reference-only and membership-consistent");
  const rebuilt = buildStepwiseRelationshipEnvelopeRequest(buildStepwiseSourcePacket({
    document: accepted.normalizedDocument,
    ownedLocators: owned.map(({ pageNumber, sourceKind, localId }) => ({ pageNumber, locatorType: sourceKind, locatorId: localId })),
    contextOnlyLocators: visual.map(({ pageNumber, sourceKind, localId }) => ({ pageNumber, locatorType: sourceKind, locatorId: localId })),
    assetIdentities: selectedMedia.map((media) => ({ pageNumber: media.pageNumber, locatorId: media.locatorId, assetRef: media.assetRef, sha256: media.sha256, sourceSha256: fixture.input.sourceSha256 })),
  }));
  assert.equal(rebuilt.sourceSpecificationSha256, packet.sourceSpecificationSha256, "SEM reconstruction is deterministic for the selected text and image reference");
  assert.equal(hash(JSON.stringify(rebuilt)), requestSha256, "the reconstructed request retains the persisted request identity without storing a request body");
  console.log(JSON.stringify({ planId: persisted.planId, planHash: persisted.planHash, handoff: persisted.handoffs[0], sourceSpecificationSha256: packet.sourceSpecificationSha256, requestSha256, requestBytes, inputTokens, selectedMedia: selectedMedia.map((media) => media.assetRef), referenceBodySha256: body.canonicalJsonSha256 }));
} finally {
  await sql.end();
}
