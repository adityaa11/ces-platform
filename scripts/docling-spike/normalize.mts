import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { normalizePerceptionResult } from "../../packages/atlas-core/src/index.ts";

const [input, output, artifactId, sourcePath] = process.argv.slice(2);
if (!input || !output || !artifactId || !sourcePath) throw new Error("Usage: jiti normalize.mts <provider-json> <normalized-json> <artifact-id> <source-pdf>");
const providerResult = JSON.parse(await readFile(resolve(input), "utf8"));
const sourceSha256 = createHash("sha256").update(await readFile(resolve(sourcePath))).digest("hex");
const normalized = normalizePerceptionResult({
  executionId: `docling-spike-${artifactId}`,
  artifactId,
  sourceSha256,
  provider: { provider: "docling", processor: "docling-local", executionId: `docling-spike-${artifactId}`, processedAt: "2026-10-02T00:00:00.000Z" },
  result: providerResult,
});
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
const canonical = JSON.stringify(normalized);
console.log(JSON.stringify({ normalizedStructuralSha256: createHash("sha256").update(canonical).digest("hex"), pageCount: normalized.pages.length }));
