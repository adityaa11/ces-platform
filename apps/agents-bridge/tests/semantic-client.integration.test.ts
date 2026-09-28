import assert from "node:assert/strict";
import test from "node:test";
import { createAtlasSemanticClient } from "../src/atlas-semantic-client.ts";
import { MistralProvider } from "../src/providers/mistral.ts";
import { semanticExtractionSkill, semanticReconciliationSkill } from "@atlas/skills";

const credential = "s".repeat(32);
const scope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: "execution", contractVersion: "v1" };
const job = { version: "v1" as const, executionId: "execution", skill: { id: "atlas.semantic.extract" as const, version: "v1" as const }, contextCapability: "capability" };
const normalized = { version: "v1", executionId: "perception", artifactId: "document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "mistral", processor: "ocr", executionId: "perception", processedAt: "2026-09-28T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] };

test("configured Mistral structured requests and authenticated semantic handoffs exercise both production skills", async () => {
  const received: string[] = []; let providerCalls = 0;
  const client = createAtlasSemanticClient({ baseUrl: "http://atlas.test", contextPath: "/internal/semantic/context", resultPath: "/internal/semantic/result", failurePath: "/internal/semantic/failure", serviceCredential: credential, timeoutMilliseconds: 1_000 }, async (url, init) => {
    received.push(String(url)); assert.equal((init?.headers as Record<string, string>).authorization, `Bearer ${credential}`);
    if (String(url).endsWith("/context")) return new Response(JSON.stringify({ version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: normalized }), { status: 200 });
    return new Response(null, { status: 204 });
  });
  const provider = new MistralProvider({ apiKey: "test-secret", baseUrl: "http://mistral-mock", structuredModel: "qualified", chatModel: "chat", ocrModel: "ocr", maxDocumentBytes: 1, zeroDataRetentionApproved: false }, async (_url, init) => { providerCalls += 1; const body = JSON.parse(String(init.body)); assert.equal(body.model, "qualified"); return new Response(JSON.stringify({ model: "qualified", choices: [{ message: { content: JSON.stringify({ version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] }) } }] }), { status: 200 }); });
  const context = await client.context(job, new AbortController().signal);
  const response = await provider.structured({ messages: [{ role: "system", content: semanticExtractionSkill.promptTemplate }, { role: "user", content: JSON.stringify(context) }], schema: semanticExtractionSkill.outputSchema, signal: new AbortController().signal });
  await client.deliver({ version: "v1", scope, skill: job.skill, provider: response.provenance, result: response.value }, new AbortController().signal);
  const reconciliation = new MistralProvider({ apiKey: "test-secret", baseUrl: "http://mistral-mock", structuredModel: "qualified", chatModel: "chat", ocrModel: "ocr", maxDocumentBytes: 1, zeroDataRetentionApproved: false }, async () => { providerCalls += 1; return new Response(JSON.stringify({ model: "qualified", choices: [{ message: { content: JSON.stringify({ version: "v1", relationships: [], questions: [] }) } }] }), { status: 200 }); });
  await reconciliation.structured({ messages: [{ role: "system", content: semanticReconciliationSkill.promptTemplate }], schema: semanticReconciliationSkill.outputSchema, signal: new AbortController().signal });
  assert.equal(providerCalls, 2); assert.deepEqual(received.map((value) => new URL(value).pathname), ["/internal/semantic/context", "/internal/semantic/result"]);
});
