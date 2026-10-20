import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { anomanMultipartSerializationPolicy } from "../src/providers/anoman-multipart-serialization.ts";
import { inventoryMultimodalCandidates } from "../src/idser-multimodal-inventory-candidates.ts";

const sourceSha256 = "a".repeat(64);
const asset = (suffix: string) => `derived/12345678-1234-1234-1234-${suffix}`;
const document = (visuals = [{ id: "visual-a", assetRef: asset("000000000001") }, { id: "visual-b", assetRef: asset("000000000002") }]) => ({
  scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document" },
  source: { documentId: "document", sourceSha256 }, rel: { state: "unavailable" as const },
  normalizedDocument: { version: "v1" as const, executionId: "execution", artifactId: "document", sourceSha256, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: "provider", processedAt: "2026-10-20T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "text", text: "Source-grounded text." }], tables: [{ id: "table", content: "| Status | active |" }], visualRegions: visuals }] },
  media: visuals.map((visual, index) => ({ pageNumber: 1, locatorId: visual.id, assetRef: visual.assetRef!, mediaType: "image/png" as const, sha256: String(index + 1).repeat(64), byteLength: 10 + index })),
});
const configuration = () => ({ estimator: { identity: "idser-multimodal-estimator", version: "v1" }, configuration: { identity: "idser-multimodal-accounting", version: "v1" }, inputBytesPerToken: 4, framingAllowanceBytes: 2048, requestByteSafetyMargin: 32, inputTokenSafetyMargin: 3, reservedOutputTokens: 40, requestResourceEnvelope: { requestUnits: 1, dayUnits: 1, concurrencyUnits: 1 } });
const route = () => ({ version: "v1" as const, routeId: "route", profileId: "profile", profileVersion: "v1", image: { version: "v1" as const, mediaTypes: ["image/png" as const], maxImageCount: 4, maxImageBytes: 1000, maxImageWidth: 4096, maxImageHeight: 4096 }, maxPromptBytes: 100000, maxDeadlineMilliseconds: 30000, imageTpm: { state: "unknown" as const } });
const measurements = (accepted = document()) => accepted.media.map((media, index) => ({ ...media, sourceSha256, assetSha256: media.sha256, width: 768 + index, height: 768, mediaType: media.mediaType }));
const input = (accepted = document()) => ({ acceptedDocument: accepted, verifiedVisualMeasurements: measurements(accepted), effectiveRoute: route(), serializerPolicy: { ...anomanMultipartSerializationPolicy, model: "gemini-2.5-flash" } as const, estimatorConfiguration: configuration() });

test("inventories every accepted locator once and constructs deterministic mixed, image-only, and text-only candidates", () => {
  const mixed = inventoryMultimodalCandidates(input());
  const repeat = inventoryMultimodalCandidates(input());
  assert.deepEqual(mixed, repeat);
  assert.equal(mixed.inventory.length, 4);
  assert.equal(mixed.candidates.length, 1);
  assert.deepEqual(mixed.candidates[0]?.selectedMedia.map((item) => item.locatorId), ["visual-a", "visual-b"]);
  assert.equal(new Set(mixed.candidates[0]?.selectedMedia.map((item) => item.assetRef)).size, 2);
  assert.ok(mixed.inventory.every((item) => item.disposition === "eligible" && item.candidateId === mixed.candidates[0]?.candidateId));
  const imageOnly = document([{ id: "visual-a", assetRef: asset("000000000001") }]); imageOnly.normalizedDocument.pages[0]!.textBlocks = []; imageOnly.normalizedDocument.pages[0]!.tables = [];
  assert.equal(inventoryMultimodalCandidates(input(imageOnly)).candidates[0]?.selectedMedia.length, 1);
  const textOnly = document([]);
  assert.equal(inventoryMultimodalCandidates(input(textOnly)).candidates[0]?.selectedMedia.length, 0);
});

test("fail-closes malformed, foreign, unavailable, unsupported, and indivisible visual inputs", () => {
  const unavailable = input(); unavailable.verifiedVisualMeasurements = unavailable.verifiedVisualMeasurements.filter((item) => item.locatorId !== "visual-a");
  assert.equal(inventoryMultimodalCandidates(unavailable).inventory.find((item) => item.locator.locatorId === "visual-a")?.reason, "unavailable");
  const foreign = input(); foreign.verifiedVisualMeasurements = foreign.verifiedVisualMeasurements.map((item) => item.locatorId === "visual-a" ? { ...item, assetRef: asset("000000000099") } : item);
  assert.equal(inventoryMultimodalCandidates(foreign).inventory.find((item) => item.locator.locatorId === "visual-a")?.reason, "foreign");
  const unsupported = input(); unsupported.verifiedVisualMeasurements = unsupported.verifiedVisualMeasurements.map((item) => item.locatorId === "visual-a" ? { ...item, mediaType: "image/jpeg" } : item);
  assert.equal(inventoryMultimodalCandidates(unsupported).inventory.find((item) => item.locator.locatorId === "visual-a")?.reason, "unsupported");
  const malformed = input(); malformed.verifiedVisualMeasurements = malformed.verifiedVisualMeasurements.map((item) => item.locatorId === "visual-a" ? { ...item, width: 0 } : item);
  assert.equal(inventoryMultimodalCandidates(malformed).inventory.find((item) => item.locator.locatorId === "visual-a")?.reason, "malformed");
  const duplicate = input(); duplicate.verifiedVisualMeasurements = [...duplicate.verifiedVisualMeasurements, duplicate.verifiedVisualMeasurements[0]!];
  assert.equal(inventoryMultimodalCandidates(duplicate).inventory.find((item) => item.locator.locatorId === "visual-a")?.reason, "malformed");
  const indivisible = input(); indivisible.effectiveRoute = { ...route(), image: { ...route().image!, maxImageCount: 1 } };
  const outcome = inventoryMultimodalCandidates(indivisible);
  assert.ok(outcome.inventory.filter((item) => item.locator.locatorType === "visual_region").every((item) => item.reason === "indivisible"));
  assert.equal(outcome.candidates[0]?.selectedMedia.length, 0, "text/table candidate remains transient and does not treat rejected visuals as text");
});

test("has no BSS, persistence, or media-retrieval dependency", () => {
  const source = readFileSync(new URL("../src/idser-multimodal-inventory-candidates.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\(|postgres|drizzle|capacity-consumer|hydrate|base64|dispatchMultipart|admission/i);
});
