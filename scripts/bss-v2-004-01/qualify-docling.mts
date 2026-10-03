import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { availableParallelism, totalmem } from "node:os";
import { normalizePerceptionResult } from "../../packages/atlas-core/src/index.ts";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";
import { DoclingProvider, doclingOptionProfile, doclingServeVersion, doclingSlimVersion } from "../../apps/agents-bridge/src/providers/docling.ts";

const fixtures = [
  { id: "safara-full", path: process.env.SAFARA_FULL_PDF_PATH ?? "docs/example/Safara_PRD_01_Foundation.pdf" },
  { id: "finance", path: "docs/example/Safara_PRD_02_Finance_Documents.pdf" },
  { id: "readiness", path: "docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf" },
  { id: "safara-full-repeat", path: process.env.SAFARA_FULL_PDF_PATH ?? "docs/example/Safara_PRD_01_Foundation.pdf" },
] as const;
const provider = new DoclingProvider({ baseUrl: "http://docling-serve:5001", timeoutMilliseconds: 20_000, maxDocumentBytes: 20 * 1024 * 1024, maxResponseBytes: 10 * 1024 * 1024, serviceVersion: doclingServeVersion, doclingSlimVersion, optionProfile: doclingOptionProfile });
const coldBootMilliseconds = Number(process.env.DOCLING_COLD_BOOT_MILLISECONDS);
if (!Number.isFinite(coldBootMilliseconds) || coldBootMilliseconds < 0) throw new Error("DOCLING_COLD_BOOT_MILLISECONDS must record the preceding pinned Compose cold boot to /ready.");

async function run(id: string, path: string) {
  const bytes = new Uint8Array(await readFile(path));
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  const deterministicArtifactId = id.replace(/-repeat$/u, "");
  const started = performance.now();
  const perceived = await provider.perceive({ bytes, mimeType: "application/pdf" }, new AbortController().signal);
  const afterProvider = performance.now();
  const normalized = normalizePerceptionResult({ executionId: `bss-v2-004-01-${deterministicArtifactId}`, artifactId: deterministicArtifactId, sourceSha256, provider: { provider: perceived.provenance.provider, processor: perceived.provenance.model, executionId: `bss-v2-004-01-${deterministicArtifactId}`, processedAt: "2026-10-03T00:00:00.000Z" }, result: perceived.providerResult as { pages: readonly unknown[] } });
  const afterNormalize = performance.now();
  const parsed = parseNormalizedDocument(normalized);
  const completed = performance.now();
  const canonical = JSON.stringify(parsed);
  const timing = perceived.provenance.usage?.raw ?? {};
  return { id, sourceSha256, pageCount: parsed.pages.length, providerOutputSha256: createHash("sha256").update(JSON.stringify(perceived.providerResult)).digest("hex"), outputSha256: createHash("sha256").update(canonical).digest("hex"), requestSerializationMilliseconds: timing.requestSerializationMilliseconds ?? null, httpRequestTransferMilliseconds: timing.httpRequestTransferMilliseconds ?? null, doclingReportedProcessingMilliseconds: timing.doclingReportedProcessingMilliseconds ?? null, responseBodyTransferMilliseconds: timing.responseBodyTransferMilliseconds ?? null, mappingSerializationMilliseconds: timing.mappingSerializationMilliseconds ?? null, normalizeMilliseconds: Math.round(afterNormalize - afterProvider), parseMilliseconds: Math.round(completed - afterNormalize), endToEndMilliseconds: Math.round(completed - started), parserValidNormalizedDocumentV1: parsed.version === "v1", withinWarmGate: completed - started <= 20_000 };
}

// This is route initialization only, deliberately reported outside the qualification matrix.
const warmup = await run("warmup", fixtures[0].path);
const runs = [];
for (const fixture of fixtures) runs.push(await run(fixture.id, fixture.path));
const primary = runs[0]; const repeat = runs[3];
console.log(JSON.stringify({ harness: "Bridge DoclingProvider -> normalizePerceptionResult -> parseNormalizedDocument", timingBoundaries: { serviceColdBootMilliseconds: "external pinned Compose start to /ready observation", exactProfileWarmupMilliseconds: "warmup end-to-end conversion", requestSerializationMilliseconds: "fixed multipart form construction", httpRequestTransferMilliseconds: "POST round trip minus Docling-reported processing", doclingReportedProcessingMilliseconds: "Docling response processing_time", responseBodyTransferMilliseconds: "response headers to complete body", mappingSerializationMilliseconds: "parsed Docling JSON to mapped generic result", normalizeParseMilliseconds: "Atlas normalizer then parser", endToEndMilliseconds: "Bridge has bytes through parser-valid output" }, serviceColdBootMilliseconds: coldBootMilliseconds, profile: { pipeline: "standard", ocr: false, tables: true, remoteServices: false, plugins: false }, resourceProfile: { availableCpus: availableParallelism(), totalMemoryBytes: totalmem(), doclingCpuThreads: Number(process.env.DOCLING_CPU_THREADS ?? 4), cpuThreadRationale: "bounded four-thread local CPU qualification profile", doclingServeWorkers: Number(process.env.DOCLING_SERVE_WORKERS ?? 1), localConversionConcurrency: Number(process.env.DOCLING_LOCAL_CONVERSION_CONCURRENCY ?? 1), cudaDeviceUse: false }, warmup, runs, deterministicSafara: primary?.outputSha256 === repeat?.outputSha256, allWarmRunsWithinGate: runs.every((run) => run.withinWarmGate && run.parserValidNormalizedDocumentV1) }, null, 2));
