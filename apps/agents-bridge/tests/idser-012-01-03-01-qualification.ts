import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { DoclingProvider, doclingRun003OptionProfile, doclingServeVersion, doclingSlimVersion } from "../src/providers/docling.ts";

const sourcePath = process.env.RUN003_QUALIFICATION_PDF ?? "/fixture/Safara_Buyer_Business_PRD_Professional.pdf";
const evidencePath = process.env.RUN003_QUALIFICATION_EVIDENCE;
const bytes = await readFile(sourcePath);
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const config = {
  baseUrl: process.env.DOCLING_BASE_URL ?? "http://docling-serve:5001",
  timeoutMilliseconds: 120_000,
  maxDocumentBytes: 20 * 1024 * 1024,
  maxResponseBytes: 10 * 1024 * 1024,
  serviceVersion: doclingServeVersion,
  doclingSlimVersion,
  optionProfile: doclingRun003OptionProfile,
} as const;
const invoke = async (label: string) => {
  const started = performance.now();
  const result = await new DoclingProvider(config).perceive({ bytes, mimeType: "application/pdf", sourceSha256 }, new AbortController().signal);
  const pages = result.providerResult.pages as readonly { blocks?: readonly unknown[]; tables?: readonly unknown[]; visual_regions?: readonly unknown[] }[];
  const descriptorCount = (result.providerResult.transientVisualDescriptors as readonly unknown[]).length;
  return {
    label,
    elapsedMilliseconds: Math.round(performance.now() - started),
    doclingProcessingMilliseconds: result.provenance.usage?.raw?.doclingReportedProcessingMilliseconds,
    responseBytes: result.provenance.usage?.raw?.responseBytes,
    responseTransferMilliseconds: result.provenance.usage?.raw?.responseBodyTransferMilliseconds,
    mappingMilliseconds: result.provenance.usage?.raw?.mappingSerializationMilliseconds,
    textCount: pages.reduce((total, page) => total + (page.blocks?.length ?? 0), 0),
    tableCount: pages.reduce((total, page) => total + (page.tables?.length ?? 0), 0),
    visualCount: pages.reduce((total, page) => total + (page.visual_regions?.length ?? 0), 0),
    descriptorCount,
    requiresAssetHandoff: result.requiresAssetHandoff === true,
    noDurablePointer: !JSON.stringify(result.providerResult.pages).includes("derived/"),
  };
};

const sequential = [await invoke("sequential-1"), await invoke("sequential-2")];
for (const observation of sequential) {
  assert.equal(observation.textCount, 254);
  assert.equal(observation.tableCount, 4);
  assert.equal(observation.visualCount, 5);
  assert.equal(observation.descriptorCount, 5);
  assert.equal(observation.requiresAssetHandoff, true);
  assert.equal(observation.noDurablePointer, true);
}
const concurrentStarted = performance.now();
const firstTwoPending = Promise.all([invoke("concurrent-1"), invoke("concurrent-2")]);
await new Promise((resolve) => setTimeout(resolve, 100));
const heldThirdStarted = performance.now();
const third = invoke("held-third");
const heldProbe = await Promise.race([third.then(() => "completed"), new Promise<"held">((resolve) => setTimeout(() => resolve("held"), 250))]);
const firstTwo = await firstTwoPending;
const concurrentWallMilliseconds = Math.round(performance.now() - concurrentStarted);
const heldThird = await third;
const report = {
  ticket: "IDSER-012-01-03-01",
  profile: doclingRun003OptionProfile,
  source: { sha256: sourceSha256, byteLength: bytes.byteLength },
  frozenRuntime: { doclingServeVersion, doclingSlimVersion, timeoutMilliseconds: config.timeoutMilliseconds, maxResponseBytes: config.maxResponseBytes, localConversionConcurrency: 2, workers: 1, cpuThreads: 4 },
  sequential,
  concurrent: { observations: firstTwo, wallMilliseconds: concurrentWallMilliseconds },
  heldThird: { observation: heldThird, probeAfter250Milliseconds: heldProbe, elapsedMilliseconds: Math.round(performance.now() - heldThirdStarted) },
  scope: { atlasResultAcceptance: false, perceptionJobsCreated: false, semanticJobsCreated: false, durableAssetsCreated: false },
};
assert.equal(heldProbe, "held", "the third real conversion must remain pending while two are active");
assert.equal(heldThird.textCount, 254);
if (evidencePath) await (await import("node:fs/promises")).writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`IDSER-012-01-03-01 qualification evidence: ${JSON.stringify(report)}\n`);
