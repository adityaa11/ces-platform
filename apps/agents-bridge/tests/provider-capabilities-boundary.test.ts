import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const genericPaths = ["../src/semantic-worker.ts", "../src/document-perception-worker.ts", "../src/runtime.ts"];
const compositionPaths = ["../src/main.ts", "../src/worker-main.ts"];

test("generic execution paths depend on Bridge capabilities, never concrete provider types", async () => {
  for (const relativePath of genericPaths) {
    const source = await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    assert.doesNotMatch(source, /providers\/mistral|MistralProvider|MistralChatRuntime|Gemini/u, relativePath);
    assert.match(source, /provider-capabilities/u, relativePath);
  }
});

test("composition roots inject capabilities without naming concrete provider classes", async () => {
  for (const relativePath of compositionPaths) {
    const source = await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    assert.doesNotMatch(source, /new MistralProvider|MistralChatRuntime|GeminiProvider/u, relativePath);
    assert.match(source, /createMistralCapabilities/u, relativePath);
  }
});
