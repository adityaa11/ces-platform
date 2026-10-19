import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildStepwiseSourcePacket } from "@atlas/skills";
import { CompleteSemCandidateRequestEstimatorError, estimateCompleteSemCandidateRequest } from "../src/complete-sem-candidate-request-estimator.ts";

const sha = "a".repeat(64);
const configuration = () => ({
  estimator: { identity: "anoman-semantic-complete-request", version: "v1" },
  configuration: { identity: "anoman-semantic-request-accounting", version: "v7" },
  inputBytesPerToken: 4,
  framingAllowanceBytes: 31,
  requestByteSafetyMargin: 11,
  inputTokenSafetyMargin: 5,
  reservedOutputTokens: 40,
  requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
});
const document = () => ({
  version: "v1" as const,
  executionId: "execution",
  artifactId: "document",
  sourceSha256: sha,
  perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
  provider: { name: "docling", processor: "pdf", executionId: "execution", processedAt: "2026-10-20T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "text", text: "Scope remains source grounded." }], tables: [{ id: "table", content: "| Field | Value |\n| --- | --- |\n| status | active |" }], visualRegions: [{ id: "visual", label: "Approved legend", assetRef: "derived/visual.png" }] }],
});
const packet = (ownedLocators = [{ pageNumber: 1, locatorType: "text_block" as const, locatorId: "text" }]) => buildStepwiseSourcePacket({ document: document(), ownedLocators, assetIdentities: [{ pageNumber: 1, locatorId: "visual", assetRef: "derived/visual.png", sha256: "b".repeat(64), sourceSha256: sha }] });

test("measures one actual composed SEM request with fixed overhead once and distinct input/output accounting", () => {
  const candidate = packet();
  const first = estimateCompleteSemCandidateRequest({ candidatePacket: candidate, configuration: configuration() });
  const second = estimateCompleteSemCandidateRequest({ candidatePacket: candidate, configuration: configuration() });
  assert.deepEqual(first, second);
  assert.equal(first.components.sourceSpecificationBytes, Buffer.byteLength(candidate.sourceSpecification, "utf8"));
  assert.equal(first.components.systemPromptBytes, Buffer.byteLength(candidate.systemPrompt, "utf8"));
  assert.equal(first.requestBytes, first.components.systemPromptBytes + first.components.sourceSpecificationBytes + first.components.schemaAllowanceBytes + 31 + 11);
  assert.equal(first.inputTokens, first.components.estimatedTextTokens + 5);
  assert.equal(first.prospectiveTokenDemand, first.inputTokens + 40);
  assert.equal(first.requestResourceEnvelope.tokenUnits, first.prospectiveTokenDemand, "reservation enters the BSS envelope exactly once");
  assert.equal(first.reservedOutputTokens, 40);
  assert.equal(first.provenance.sourcePacket.sourceSpecificationSha256, candidate.sourceSpecificationSha256);
  assert.equal(Object.isFrozen(first), true);
});

test("changes only the complete measurement when packet, schema framing, media accounting, or pinned configuration changes", () => {
  const text = estimateCompleteSemCandidateRequest({ candidatePacket: packet(), configuration: configuration() });
  const table = estimateCompleteSemCandidateRequest({ candidatePacket: packet([{ pageNumber: 1, locatorType: "table", locatorId: "table" }]), configuration: configuration() });
  const framing = configuration(); framing.framingAllowanceBytes = 32;
  const framed = estimateCompleteSemCandidateRequest({ candidatePacket: packet(), configuration: framing });
  const visualPacket = packet([{ pageNumber: 1, locatorType: "visual_region", locatorId: "visual" }]);
  const visual = estimateCompleteSemCandidateRequest({ candidatePacket: visualPacket, selectedMedia: [{ sourceSlot: "slot-000001", assetSha256: "b".repeat(64), transportAllowanceBytes: 19, estimatedImageTokens: 7 }], configuration: configuration() });
  assert.notEqual(text.requestBytes, table.requestBytes);
  assert.equal(framed.requestBytes, text.requestBytes + 1);
  assert.equal(visual.components.mediaTransportAllowanceBytes, 19);
  assert.equal(visual.components.estimatedImageTokens, 7);
  assert.notEqual(text.provenance.configuration.sha256, framed.provenance.configuration.sha256);
  assert.notEqual(text.provenance.sourcePacket.sourceSpecificationSha256, table.provenance.sourcePacket.sourceSpecificationSha256);
});

test("fails closed for invalid configuration, missing visual accounting, and foreign media without any downstream seam", () => {
  const invalid = configuration(); invalid.inputBytesPerToken = 0;
  assert.throws(() => estimateCompleteSemCandidateRequest({ candidatePacket: packet(), configuration: invalid }), CompleteSemCandidateRequestEstimatorError);
  const visualPacket = packet([{ pageNumber: 1, locatorType: "visual_region", locatorId: "visual" }]);
  assert.throws(() => estimateCompleteSemCandidateRequest({ candidatePacket: visualPacket, configuration: configuration() }), /every selected visual/);
  assert.throws(() => estimateCompleteSemCandidateRequest({ candidatePacket: visualPacket, selectedMedia: [{ sourceSlot: "slot-000001", assetSha256: "c".repeat(64), transportAllowanceBytes: 1, estimatedImageTokens: 1 }], configuration: configuration() }), /selected-media accounting/);
});

test("remains a pure logical estimator with no BSS reader, persistence, partition, or provider import", () => {
  const source = readFileSync(new URL("../src/complete-sem-candidate-request-estimator.ts", import.meta.url), "utf8");
  assert.match(source, /logical-byte accounting policy/);
  assert.doesNotMatch(source, /from "\.\/(?:idser-prospective-capacity-snapshot|idser-structural-fit-corpus-partition|capacity-planning-snapshot|provider-|queue|semantic-worker)/);
});
