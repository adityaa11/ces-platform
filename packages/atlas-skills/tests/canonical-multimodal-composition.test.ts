import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { composeCanonicalMultimodalSource } from "../src/canonical-multimodal-composition.ts";

const sourceSha256 = "a".repeat(64);
const assetRef = (suffix: string) => `derived/01234567-89ab-cdef-0123-${suffix}`;
const metadata = (locatorId: string, suffix: string, pageNumber = 1) => ({
  pageNumber,
  locatorId,
  assetRef: assetRef(suffix),
  sourceSha256,
  assetSha256: suffix[0]!.repeat(64),
  mediaType: "image/png" as const,
  width: 640,
  height: 480,
  byteLength: 1_024,
});
const document = () => ({
  version: "v1" as const,
  executionId: "execution-1",
  artifactId: "document-1",
  sourceSha256,
  perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const },
  provider: { name: "docling", processor: "pdf", executionId: "execution-1", processedAt: "2026-10-20T00:00:00.000Z" },
  pages: [
    { number: 1, textBlocks: [{ id: "text-a", text: "Source-grounded text." }], tables: [], visualRegions: [{ id: "visual-a", label: "Owned visual", assetRef: assetRef("111111111111") }] },
    { number: 2, textBlocks: [], tables: [], visualRegions: [{ id: "visual-b", label: "Context visual", assetRef: assetRef("222222222222") }] },
  ],
});
const input = () => ({
  document: document(),
  ownedLocators: [{ pageNumber: 1, locatorType: "text_block" as const, locatorId: "text-a" }, { pageNumber: 1, locatorType: "visual_region" as const, locatorId: "visual-a" }],
  contextOnlyLocators: [{ pageNumber: 2, locatorType: "visual_region" as const, locatorId: "visual-b" }],
  verifiedDerivedImages: [metadata("visual-a", "111111111111"), metadata("visual-b", "222222222222", 2)],
});

test("identical accepted selections and metadata have stable slots, manifests, and identities", () => {
  const first = composeCanonicalMultimodalSource(input());
  const second = composeCanonicalMultimodalSource(input());
  assert.deepEqual(first, second);
  assert.deepEqual(first.sourceSlots.map(({ slot, ownership, status }) => ({ slot, ownership, status })), [
    { slot: "slot-000001", ownership: "independently_owned", status: "ready" },
    { slot: "slot-000002", ownership: "independently_owned", status: "pending_unexamined_visual" },
    { slot: "slot-000003", ownership: "context_only_reference", status: "pending_unexamined_visual" },
  ]);
  assert.deepEqual(first.descriptorManifest.map(({ sourceSlot, locatorId }) => ({ sourceSlot, locatorId })), [
    { sourceSlot: "slot-000002", locatorId: "visual-a" },
    { sourceSlot: "slot-000003", locatorId: "visual-b" },
  ]);
  const changed = input(); changed.verifiedDerivedImages[0] = { ...changed.verifiedDerivedImages[0]!, width: 641 };
  assert.notEqual(composeCanonicalMultimodalSource(changed).descriptorManifestSha256, first.descriptorManifestSha256);
  assert.notEqual(composeCanonicalMultimodalSource(changed).requestCompositionSha256, first.requestCompositionSha256);
  const ownershipChanged = input(); ownershipChanged.ownedLocators = [{ pageNumber: 1, locatorType: "text_block", locatorId: "text-a" }, { pageNumber: 2, locatorType: "visual_region", locatorId: "visual-b" }]; ownershipChanged.contextOnlyLocators = [{ pageNumber: 1, locatorType: "visual_region", locatorId: "visual-a" }];
  assert.notEqual(composeCanonicalMultimodalSource(ownershipChanged).requestCompositionSha256, first.requestCompositionSha256);
});

test("foreign, duplicate, missing, unsafe, and unsupported metadata rejects", () => {
  const cases = [
    () => ({ ...input(), verifiedDerivedImages: [metadata("visual-a", "111111111111"), metadata("visual-a", "222222222222")] }),
    () => ({ ...input(), verifiedDerivedImages: [metadata("visual-a", "111111111111")] }),
    () => ({ ...input(), verifiedDerivedImages: input().verifiedDerivedImages.map((item) => ({ ...item, sourceSha256: "b".repeat(64) })) }),
    () => ({ ...input(), verifiedDerivedImages: input().verifiedDerivedImages.map((item) => ({ ...item, assetRef: "../unsafe.png" })) }),
    () => ({ ...input(), verifiedDerivedImages: input().verifiedDerivedImages.map((item) => ({ ...item, mediaType: "image/jpeg" as "image/png" })) }),
  ];
  for (const createCase of cases) assert.throws(() => composeCanonicalMultimodalSource(createCase()), /CANONICAL_MULTIMODAL_COMPOSITION_REJECTED|SOURCE_RELATIONSHIP_BLOCKED/);
});

test("text-only, image-only, and mixed selections preserve slot and attachment order exactly once", () => {
  const mixed = composeCanonicalMultimodalSource(input());
  const imageOnly = composeCanonicalMultimodalSource({ ...input(), ownedLocators: [{ pageNumber: 1, locatorType: "visual_region", locatorId: "visual-a" }], contextOnlyLocators: [{ pageNumber: 2, locatorType: "visual_region", locatorId: "visual-b" }] });
  const textOnly = composeCanonicalMultimodalSource({ ...input(), ownedLocators: [{ pageNumber: 1, locatorType: "text_block", locatorId: "text-a" }], contextOnlyLocators: [], verifiedDerivedImages: [] });
  assert.equal(mixed.descriptorManifest.length, 2);
  assert.equal(new Set(mixed.descriptorManifest.map((descriptor) => descriptor.assetRef)).size, 2);
  assert.deepEqual(imageOnly.descriptorManifest.map((descriptor) => descriptor.assetRef), [assetRef("111111111111"), assetRef("222222222222")]);
  assert.equal(textOnly.descriptorManifest.length, 0);
});

test("composition freezes ownership and visual examination state without a durable or provider seam", () => {
  const composed = composeCanonicalMultimodalSource(input());
  assert.equal(composed.sourceSlots[1]!.status, "pending_unexamined_visual");
  assert.equal(composed.descriptorManifest[0]!.locatorId, "visual-a");
  assert.equal(Object.isFrozen(composed), true);
  const source = readFileSync(new URL("../src/canonical-multimodal-composition.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\(|base64|DocumentStore|postgres|drizzle|provider body|serialize.*request/i);
});
