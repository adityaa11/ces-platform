import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeProviderOperationalFeedback } from "../src/provider-operational-feedback.js";

const genericPaths = ["../src/semantic-worker.ts", "../src/document-perception-worker.ts", "../src/runtime.ts"];
const compositionPaths = ["../src/main.ts", "../src/worker-main.ts"];

test("generic execution paths depend on Bridge capabilities, never concrete provider types", async () => {
  for (const relativePath of genericPaths) {
    const source = await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    assert.doesNotMatch(source, /providers\/mistral|MistralProvider|MistralChatRuntime|Gemini|Anoman/u, relativePath);
    assert.match(source, /provider-capabilities/u, relativePath);
  }
});

test("provider operational feedback is bounded, typed, and free of raw provider payloads", () => {
  assert.deepEqual(normalizeProviderOperationalFeedback({ transportMayHaveStarted: true, usage: { tpm: 7 }, retryAfterSeconds: 4, lowerLimit: { dimension: "tpm", value: 9 } }), { transportMayHaveStarted: true, usage: { tpm: 7 }, retryAfterSeconds: 4, lowerLimit: { dimension: "tpm", value: 9 } });
  assert.throws(() => normalizeProviderOperationalFeedback({ transportMayHaveStarted: true, usage: { raw: 1 } }), /unsupported resource dimension/i);
  assert.throws(() => normalizeProviderOperationalFeedback({ transportMayHaveStarted: false }), /trustworthy outcome/i);
  assert.throws(() => normalizeProviderOperationalFeedback({ transportMayHaveStarted: true, retryAfterSeconds: 3601 }), /bounded/i);
});

test("composition roots inject capabilities without naming concrete provider classes", async () => {
  for (const relativePath of compositionPaths) {
    const source = await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    assert.doesNotMatch(source, /new MistralProvider|MistralChatRuntime|GeminiProvider/u, relativePath);
    assert.match(source, /route-registry/u, relativePath);
    assert.match(source, /createRouteRegistry/u, relativePath);
    assert.match(source, /deploymentProfile === "test"[\s\S]*?new TestRuntime/u, relativePath);
    assert.doesNotMatch(source, /AnomanProvider|GeminiProvider/u, relativePath);
    if (relativePath.endsWith("worker-main.ts")) {
      assert.match(source, /createAnomanCapabilities\(config\.anoman\)/u, relativePath);
      assert.match(source, /registry\.resolve\("atlas\.document\.perceive"\)/u, relativePath);
      assert.match(source, /registry\.resolve\(capabilityForSkill\(job\.skill\.id\)\)/u, relativePath);
    }
  }
});
