import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CROSS_FIELD_POLICY_BODY } from "./cross-field-policy.mts";
import { compileCrossFieldPrompt } from "./prompt-compiler.mts";
import { createProviderSchema } from "../sem-anm-prompt002/provider-schema.mts";

const here = dirname(fileURLToPath(import.meta.url));
const predecessor = resolve(here, "../sem-anm-prompt002");
const generated = resolve(here, "generated");
const reference = await readFile(resolve(predecessor, "atlas-semantic-v1-zod-reference.ts"));
const predecessorPrompt = await readFile(resolve(predecessor, "generated/system-prompt.txt"));
const predecessorSchema = await readFile(resolve(predecessor, "generated/provider-schema.json"));
const { prompt, provenance } = compileCrossFieldPrompt();
const schemaText = `${JSON.stringify(createProviderSchema(), null, 2)}\n`;
const promptText = `${prompt}\n`;
const provenanceText = `${JSON.stringify(provenance, null, 2)}\n`;

if (!predecessorSchema.equals(Buffer.from(schemaText))) {
  throw new Error("PROMPT-003 provider schema must remain byte-identical to PROMPT-002");
}

const hashes = {
  predecessorReferenceSha256: sha(reference),
  predecessorSystemPromptSha256: sha(predecessorPrompt),
  predecessorProviderSchemaSha256: sha(predecessorSchema),
  systemPromptSha256: sha(promptText),
  providerSchemaSha256: sha(schemaText),
  promptProvenanceSha256: sha(provenanceText),
  crossFieldPolicyBodySha256: sha(CROSS_FIELD_POLICY_BODY),
};

await mkdir(generated, { recursive: true });
await writeFile(resolve(generated, "system-prompt.txt"), promptText, "utf8");
await writeFile(resolve(generated, "provider-schema.json"), schemaText, "utf8");
await writeFile(resolve(generated, "prompt-provenance.json"), provenanceText, "utf8");
await writeFile(resolve(generated, "hashes.json"), `${JSON.stringify(hashes, null, 2)}\n`, "utf8");
console.log(`SEM-ANM-PROMPT-003 artifacts generated; schema sha256=${hashes.providerSchemaSha256}; prompt sha256=${hashes.systemPromptSha256}`);

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
