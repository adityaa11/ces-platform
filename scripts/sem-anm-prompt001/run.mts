import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildPromptFromZod } from "./prompt-builder.mts";
import { checkpointCoverage } from "./prompt-provenance.mts";

const output = fileURLToPath(new URL("../../.atlas-data/sem-anm-prompt001/", import.meta.url));
const { jsonSchema, prompt } = buildPromptFromZod();
const sha256 = createHash("sha256").update(prompt).digest("hex");
const coverage = checkpointCoverage(prompt);
if (!coverage.complete) throw new Error("Checkpoint coverage is incomplete");
await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(`${output}generated-provider-schema.json`, `${JSON.stringify(jsonSchema, null, 2)}\n`),
  writeFile(`${output}generated-system-prompt.txt`, `${prompt}\n`),
  writeFile(`${output}generated-system-prompt.sha256`, `${sha256}\n`),
  writeFile(`${output}checkpoint-coverage.json`, `${JSON.stringify(coverage, null, 2)}\n`),
]);
console.log(JSON.stringify({ output, sha256, coverage: "complete" }));
