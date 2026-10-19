import assert from "node:assert/strict";
import test from "node:test";
import { estimateAcceptedCorpusDemand } from "../src/idser-corpus-demand-estimator.ts";

const sha = "a".repeat(64);
const configuration = () => ({
  bssRegisteredEstimator: { identity: "anoman-prospective-estimator", version: "v2" },
  estimator: { identity: "anoman-prospective-estimator", version: "v2" },
  modelRoute: { model: "qualified-semantic-model", route: "anoman-semantic" },
  overheads: { systemPromptBytes: 100, schemaBytes: 200, contextPlaceholderBytes: 30, contextPlaceholderTokens: 7, reservedOutputBytes: 400, reservedOutputTokens: 40, mediaMetadataBytes: 50, mediaInputTokensPerByte: 1, inputBytesPerToken: 4, requestByteSafetyMargin: 11, inputTokenSafetyMargin: 5 },
});
const accepted = () => ({
  scope: { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document" },
  source: { documentId: "document", sourceSha256: sha }, rel: { state: "unavailable" as const },
  normalizedDocument: { version: "v1" as const, executionId: "execution", artifactId: "document", sourceSha256: sha, perception: { capability: "atlas.document.perceive" as const, contractVersion: "v1" as const }, provider: { name: "docling", processor: "pdf", executionId: "execution", processedAt: "2026-10-19T00:00:00.000Z" }, pages: [
    { number: 2, textBlocks: [{ id: "text-b", text: "Temporal scope remains Q4." }], tables: [{ id: "table-b", content: "| Legend | Value |\n| --- | --- |\n| limit | 40 |" }], visualRegions: [] },
    { number: 1, textBlocks: [{ id: "text-a", text: "Language and scope are source facts." }, { id: "blank", text: "  " }], tables: [], visualRegions: [{ id: "legend", label: "Regional legend", assetRef: "derived/legend.png" }, { id: "unexamined", assetRef: "derived/unexamined.png" }] },
  ] },
  media: [{ assetRef: "derived/legend.png", locatorId: "legend", pageNumber: 1, mediaType: "image/png" as const, sha256: "b".repeat(64), byteLength: 16 }, { assetRef: "derived/unexamined.png", locatorId: "unexamined", pageNumber: 1, mediaType: "image/png" as const, sha256: "c".repeat(64), byteLength: 12 }],
});

test("estimates actual accepted text, tables, and granted media deterministically with every envelope dimension", () => {
  const first = estimateAcceptedCorpusDemand({ acceptedDocument: accepted(), configuration: configuration() });
  const second = estimateAcceptedCorpusDemand({ acceptedDocument: accepted(), configuration: configuration() });
  assert.deepEqual(first, second);
  assert.equal(first.disposition, "READY");
  assert.deepEqual(first.estimator, configuration().bssRegisteredEstimator);
  assert.deepEqual(first.units.map((unit) => [unit.locator.pageNumber, unit.locator.sourceKind, unit.locator.localId]), [[1, "text_block", "blank"], [1, "text_block", "text-a"], [1, "visual_region", "legend"], [1, "visual_region", "unexamined"], [2, "text_block", "text-b"], [2, "table", "table-b"]]);
  const visual = first.units.find((unit) => unit.locator.localId === "legend")!;
  assert.equal(visual.demand?.requestBytes, 822, "label, media metadata/bytes, system/schema/context/output, and margin are counted");
  assert.equal(visual.demand?.inputTokens, 167, "media, context, output reservation, and safety margin are counted conservatively");
  assert.deepEqual(visual.demand?.envelope, { requestUnits: 1, tokenUnits: 167, dayUnits: 1, concurrencyUnits: 1 });
  assert.deepEqual(first.units.find((unit) => unit.locator.localId === "blank"), { locator: { documentId: "document", pageNumber: 1, sourceKind: "text_block", localId: "blank" }, classification: "deferred", reason: "empty_content" });
  assert.deepEqual(first.units.find((unit) => unit.locator.localId === "unexamined"), { locator: { documentId: "document", pageNumber: 1, sourceKind: "visual_region", localId: "unexamined" }, classification: "unexamined", reason: "unlabeled_visual" });
  assert.equal(Object.isFrozen(first), true);
});

test("fails closed for estimator mismatch, missing or foreign media, duplicate locators, and fabricated REL", () => {
  const mismatch = configuration(); mismatch.estimator = { identity: "foreign", version: "v9" };
  assert.equal(estimateAcceptedCorpusDemand({ acceptedDocument: accepted(), configuration: mismatch }).disposition, "SEM_BATCH_ESTIMATOR_GAP");
  const missingMedia = accepted(); missingMedia.media = [];
  const missing = estimateAcceptedCorpusDemand({ acceptedDocument: missingMedia, configuration: configuration() });
  assert.equal(missing.disposition, "SEM_BATCH_ESTIMATOR_GAP");
  assert.equal(missing.units.find((unit) => unit.locator.localId === "legend")?.reason, "missing_required_media");
  const foreignMedia = accepted(); foreignMedia.media = [...foreignMedia.media, { assetRef: "derived/foreign.png", locatorId: "foreign", pageNumber: 99, mediaType: "image/png" as const, sha256: "d".repeat(64), byteLength: 1 }];
  assert.ok(estimateAcceptedCorpusDemand({ acceptedDocument: foreignMedia, configuration: configuration() }).issues.includes("foreign_media"));
  const duplicate = accepted(); duplicate.normalizedDocument.pages[0]!.textBlocks.push({ id: "text-b", text: "duplicate" });
  assert.equal(estimateAcceptedCorpusDemand({ acceptedDocument: duplicate, configuration: configuration() }).disposition, "SEM_BATCH_ESTIMATOR_GAP");
  const forgedRel = accepted() as any; forgedRel.rel = { state: "available" };
  assert.ok(estimateAcceptedCorpusDemand({ acceptedDocument: forgedRel, configuration: configuration() }).issues.includes("rel_not_unavailable"));
});

test("empty accepted corpus is a typed zero-unit result and estimation has no external side-effect surface", () => {
  const empty = accepted(); empty.normalizedDocument.pages = [{ number: 1, textBlocks: [{ id: "blank", text: "" }], tables: [], visualRegions: [] }]; empty.media = [];
  const result = estimateAcceptedCorpusDemand({ acceptedDocument: empty, configuration: configuration() });
  assert.equal(result.disposition, "NO_ELIGIBLE_SOURCE");
  assert.equal(result.units.filter((unit) => unit.classification === "eligible").length, 0);
  assert.equal(result.units.length, 1);
});
