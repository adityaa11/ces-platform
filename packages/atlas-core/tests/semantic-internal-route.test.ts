import assert from "node:assert/strict";
import test from "node:test";
import { createSemanticInternalRoutes } from "../src/index.ts";
import { semanticLimits } from "@atlas/contracts";

const credential = "s".repeat(32);
const job = { version: "v1", executionId: "semantic-route", skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: "capability" } as const;
const scope = { projectId: "project", workspaceId: "workspace", bundleId: "bundle", documentId: "document", executionId: job.executionId, contractVersion: "v1" } as const;
const result = { version: "v1", scope, skill: job.skill, provider: { provider: "test", model: "test", endpoint: "internal", latencyMilliseconds: 1, attempt: 1 }, result: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] } } as const;

test("semantic routes authenticate and fail closed when acceptance is unavailable", async () => {
  const calls: string[] = [];
  const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: {
    redeem: async () => ({ executionId: job.executionId, skill: job.skill, scope, context: { version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: { version: "v1", executionId: job.executionId, artifactId: "document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "test", processor: "test", executionId: job.executionId, processedAt: "2026-09-27T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }] } } }),
    deliver: async (_envelope, handler) => { calls.push("deliver"); await handler.accept({ executionId: job.executionId, completionFingerprint: "x", envelope: _envelope }); }, fail: async () => { calls.push("fail"); },
  }, handler: { accept: async () => { throw new Error("unavailable"); } } });
  assert.equal((await routes.context("bad", job)).status, 401);
  assert.equal((await routes.context(credential, job)).status, 200);
  assert.equal((await routes.deliver(credential, result)).status, 409);
  assert.deepEqual(calls, ["deliver"]);
});

test("semantic routes enforce exact JSON request and serialized-context byte boundaries", async () => {
  const baseContext = { version: "v1", skill: "atlas.semantic.extract", scope, normalizedDocument: { version: "v1", executionId: job.executionId, artifactId: "document", sourceSha256: "a".repeat(64), perception: { capability: "atlas.document.perceive", contractVersion: "v1" }, provider: { name: "test", processor: "test", executionId: job.executionId, processedAt: "2026-09-27T00:00:00.000Z" }, pages: [{ number: 1, textBlocks: [{ id: "limit", text: "" }], tables: [], visualRegions: [] }] } } as const;
  const exactContext = structuredClone(baseContext) as typeof baseContext;
  exactContext.normalizedDocument.pages[0].textBlocks[0].text = "x".repeat(semanticLimits.contextBytes - Buffer.byteLength(JSON.stringify(exactContext)));
  assert.equal(Buffer.byteLength(JSON.stringify(exactContext)), semanticLimits.contextBytes);
  const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: {
    redeem: async () => ({ executionId: job.executionId, skill: job.skill, scope, context: exactContext }),
    deliver: async () => {}, fail: async () => {},
  }, handler: { accept: async () => {} } });
  const exactJob = `${" ".repeat(semanticLimits.jobBytes - Buffer.byteLength(JSON.stringify(job)))}${JSON.stringify(job)}`;
  assert.equal(Buffer.byteLength(exactJob), semanticLimits.jobBytes);
  assert.equal((await routes.context(credential, JSON.parse(exactJob))).status, 200);
  const serializedOverLimit = `${exactJob} `;
  assert.equal(Buffer.byteLength(serializedOverLimit), semanticLimits.jobBytes + 1);
  // The framework host rejects this streamed representation before parsing; the
  // framework-neutral route receives parsed JSON, so whitespace is not retained.
  assert.equal((await routes.context(credential, JSON.parse(serializedOverLimit))).status, 200);
  exactContext.normalizedDocument.pages[0].textBlocks[0].text += "x";
  assert.equal((await routes.context(credential, job)).status, 400);
});
