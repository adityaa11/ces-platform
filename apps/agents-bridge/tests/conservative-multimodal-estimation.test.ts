import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildStepwiseSourcePacket, composeCanonicalMultimodalSource } from "@atlas/skills";
import { estimateConservativeMultimodalRequest, ConservativeMultimodalEstimationError } from "../src/conservative-multimodal-estimation.ts";
import { anomanMultipartSerializationPolicy, projectAnomanMultipartRequestBytes, serializeAnomanMultipartRequest } from "../src/providers/anoman-multipart-serialization.ts";

const sourceSha256 = "a".repeat(64);
const assetSha256 = "b".repeat(64);
const visual = { pageNumber: 1, locatorId: "visual", assetRef: "derived/12345678-1234-1234-1234-123456789abc", sourceSha256, assetSha256, mediaType: "image/png" as const, width: 769, height: 768, byteLength: 10 };
const document = () => ({
  version: "v1" as const,
  executionId: "accepted-execution",
  artifactId: "accepted-document",
  sourceSha256,
  perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
  provider: { name: "docling", processor: "pdf", executionId: "provider-execution", processedAt: "2026-10-20T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "text", text: "Source-grounded scope." }], tables: [], visualRegions: [{ id: "visual", label: "Accepted visual", assetRef: visual.assetRef }] }],
});
const configuration = (framingAllowanceBytes = 2_048) => ({
  estimator: { identity: "idser-multimodal-estimator", version: "v1" },
  configuration: { identity: "idser-multimodal-accounting", version: "v1" },
  inputBytesPerToken: 4,
  framingAllowanceBytes,
  requestByteSafetyMargin: 32,
  inputTokenSafetyMargin: 3,
  reservedOutputTokens: 40,
  requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 },
});
const route = (imageTpm: { state: "unknown" } | { state: "qualified"; tokensPerImage: number } = { state: "unknown" }) => ({
  version: "v1" as const,
  routeId: "anoman-semantic",
  profileId: "atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0",
  profileVersion: "2026-10-20",
  image: { version: "v1" as const, mediaTypes: ["image/png" as const], maxImageCount: 4, maxImageBytes: 1_000, maxImageWidth: 4_096, maxImageHeight: 4_096 },
  maxPromptBytes: 100_000,
  maxDeadlineMilliseconds: 30_000,
  imageTpm,
});
const serializerPolicy = { ...anomanMultipartSerializationPolicy, model: "gemini-2.5-flash" } as const;

test("the pinned serializer projection equals the adapter's data-URL JSON bytes", () => {
  const messages = [{ role: "user" as const, parts: [{ type: "text" as const, sourcePartId: "source", text: "source" }, { type: "image" as const, sourcePartId: "visual", media: { mimeType: "image/png" as const, sha256: assetSha256, byteLength: 10, width: 1, height: 1, bytes: new Uint8Array(10) } }] }];
  const projected = projectAnomanMultipartRequestBytes({ model: serializerPolicy.model, messages: [{ role: "user", parts: [{ type: "text", text: "source" }, { type: "image", media: { mimeType: "image/png", byteLength: 10 } }] }] });
  assert.equal(projected, Buffer.byteLength(serializeAnomanMultipartRequest(serializerPolicy.model, messages), "utf8"));
});

function input(locators = [{ pageNumber: 1, locatorType: "visual_region" as const, locatorId: "visual" }]) {
  const accepted = document();
  const includesVisual = locators.some((locator) => locator.locatorType === "visual_region");
  const composition = composeCanonicalMultimodalSource({ document: accepted, ownedLocators: locators, contextOnlyLocators: [], verifiedDerivedImages: includesVisual ? [visual] : [] });
  const candidatePacket = buildStepwiseSourcePacket({
    document: accepted,
    ownedLocators: locators,
    assetIdentities: includesVisual ? [{ pageNumber: visual.pageNumber, locatorId: visual.locatorId, assetRef: visual.assetRef, sha256: visual.assetSha256, sourceSha256 }] : [],
  });
  return { composition, candidatePacket };
}

test("measures image-only, mixed, and text-only canonical compositions exactly once", () => {
  const imageOnly = input();
  const mixed = input([{ pageNumber: 1, locatorType: "text_block", locatorId: "text" }, { pageNumber: 1, locatorType: "visual_region", locatorId: "visual" }]);
  const textOnly = input([{ pageNumber: 1, locatorType: "text_block", locatorId: "text" }]);
  const measure = (value: ReturnType<typeof input>) => estimateConservativeMultimodalRequest({ ...value, effectiveRoute: route(), serializerPolicy, configuration: configuration() });
  const first = measure(imageOnly);
  assert.deepEqual(first, measure(imageOnly));
  assert.equal(first.selectedImageCount, 1);
  assert.equal(first.selectedImageBytes, visual.byteLength);
  assert.equal(first.estimate.components.estimatedImageTokens, 1_032, "ceil(769/768) * ceil(768/768) * 516");
  assert.deepEqual(first.providerImageTpm, { state: "unknown" }, "unknown provider TPM is retained, never fabricated");
  assert.equal(first.estimate.requestResourceEnvelope.tokenUnits, first.estimate.inputTokens + first.estimate.reservedOutputTokens, "output reservation enters BSS demand exactly once");
  assert.ok(first.estimate.requestBytes >= first.projectedTransportBytes);
  assert.equal(measure(mixed).selectedImageCount, 1);
  assert.equal(measure(textOnly).selectedImageCount, 0);
  assert.equal(measure(textOnly).estimate.components.estimatedImageTokens, 0);
});

test("rejects serializer undercount, drift, malformed canonical input, and route-bound violations", () => {
  const canonical = input();
  assert.throws(() => estimateConservativeMultimodalRequest({ ...canonical, effectiveRoute: route(), serializerPolicy: { ...serializerPolicy, model: "m".repeat(1_000_000) }, configuration: configuration(0) }), ConservativeMultimodalEstimationError);
  assert.throws(() => estimateConservativeMultimodalRequest({ ...canonical, effectiveRoute: route(), serializerPolicy: { ...serializerPolicy, version: "v2" } as never, configuration: configuration() }), /adapter serialization policy/);
  assert.throws(() => estimateConservativeMultimodalRequest({ ...canonical, effectiveRoute: { ...route(), image: undefined }, serializerPolicy, configuration: configuration() }), /media capability/);
  const changedPacket = { ...canonical.candidatePacket, sourceSlots: canonical.candidatePacket.sourceSlots.map((slot) => ({ ...slot, slot: "slot-999999" })) };
  assert.throws(() => estimateConservativeMultimodalRequest({ ...canonical, candidatePacket: changedPacket, effectiveRoute: route(), serializerPolicy, configuration: configuration() }), /does not exactly consume/);
});

test("stays a pure estimator and never imports transport, hydration, or BSS seams", () => {
  const source = readFileSync(new URL("../src/conservative-multimodal-estimation.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\(|dispatchMultipartStructured|preflightMultimodalRequest|hydrate|capacity-planning|idser-prospective/i);
});
