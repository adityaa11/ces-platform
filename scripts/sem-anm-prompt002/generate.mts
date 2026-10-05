import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProviderSchema, FROZEN_REFERENCE_SHA256 } from "./provider-schema.mts";
import { compileExtractionPrompt } from "./prompt-compiler.mts";

const here = dirname(fileURLToPath(import.meta.url));
const referencePath = resolve(here, "atlas-semantic-v1-zod-reference.ts");
const generatedDir = resolve(here, "generated");
const referenceBytes = await readFile(referencePath);
const referenceSha256 = createHash("sha256").update(referenceBytes).digest("hex");
if (referenceSha256 !== FROZEN_REFERENCE_SHA256) {
  throw new Error(`Frozen reference integrity failure: ${referenceSha256}`);
}

const schema = createProviderSchema();
const schemaText = `${JSON.stringify(schema, null, 2)}\n`;
const providerSchemaSha256 = createHash("sha256").update(schemaText).digest("hex");
const { prompt, provenance } = compileExtractionPrompt(schema);
const promptText = `${prompt}\n`;
const provenanceText = `${JSON.stringify(provenance, null, 2)}\n`;
const systemPromptSha256 = createHash("sha256").update(promptText).digest("hex");
const hashesText = `${JSON.stringify({ referenceSha256, providerSchemaSha256, systemPromptSha256 }, null, 2)}\n`;

await mkdir(generatedDir, { recursive: true });
await writeFile(resolve(generatedDir, "provider-schema.json"), schemaText, "utf8");
await writeFile(resolve(generatedDir, "system-prompt.txt"), promptText, "utf8");
await writeFile(resolve(generatedDir, "prompt-provenance.json"), provenanceText, "utf8");
await writeFile(resolve(generatedDir, "hashes.json"), hashesText, "utf8");
console.log(`Prompt and provider schema generated; reference sha256=${referenceSha256}; schema sha256=${providerSchemaSha256}; prompt sha256=${systemPromptSha256}`);
