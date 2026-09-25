import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createStoredAtlasProject, ProjectCreationConflictError, ProjectCreationValidationError, type AtlasProjectRepository, type CreateAtlasProjectInput } from "../src/index.ts";

const pdf = new Uint8Array(Buffer.from("%PDF-1.7\nproject source"));
const hash = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function repository(events: string[], options: { available?: boolean; failure?: Error } = {}): AtlasProjectRepository {
  return {
    async isProjectIdAvailable() { events.push("preflight"); return options.available ?? true; },
    async create(_input: CreateAtlasProjectInput) { events.push("transaction"); if (options.failure) throw options.failure; },
    async listAccessibleTo() { return []; },
  };
}

test("project creation stores every source before its metadata transaction and returns a bounded summary", async () => {
  const events: string[] = [];
  const stored: Uint8Array[] = [];
  const result = await createStoredAtlasProject({ projectId: "customer-portal", name: "Customer portal", description: null, creatorUserId: "server-auth-user", sources: [{ originalFilename: "brief.pdf", bytes: pdf, mediaType: "application/pdf" }, { originalFilename: "appendix.pdf", bytes: pdf, mediaType: "application/pdf" }] }, {
    documentStore: { async put(input) { events.push("store"); stored.push(input.bytes); return { storageKey: `documents/${stored.length}`, contentHash: hash(input.bytes), byteSize: input.bytes.byteLength, mediaType: input.mediaType }; }, async read() { return pdf; } },
    projectRepository: repository(events),
  });
  assert.deepEqual(events, ["preflight", "store", "store", "transaction"]);
  assert.deepEqual(result, { projectId: "customer-portal", name: "Customer portal", documentCount: 2 });
  assert.equal(JSON.stringify(result).includes("storageKey"), false);
});

test("project creation rejects invalid input before storing bytes and makes storage failures non-visible", async () => {
  const events: string[] = [];
  await assert.rejects(() => createStoredAtlasProject({ projectId: "bad", name: "Name", description: null, creatorUserId: "server-auth-user", sources: [{ originalFilename: "not-a-pdf.pdf", bytes: new Uint8Array([1]), mediaType: "application/pdf" }] }, { documentStore: { async put() { events.push("store"); throw new Error("unreachable"); }, async read() { return pdf; } }, projectRepository: repository(events) }), ProjectCreationValidationError);
  assert.deepEqual(events, []);
  await assert.rejects(() => createStoredAtlasProject({ projectId: "customer-portal", name: "Name", description: null, creatorUserId: "server-auth-user", sources: [{ originalFilename: "brief.pdf", bytes: pdf, mediaType: "application/pdf" }] }, { documentStore: { async put() { events.push("store"); throw new Error("storage unavailable"); }, async read() { return pdf; } }, projectRepository: repository(events) }), /storage unavailable/);
  assert.deepEqual(events, ["preflight", "store"]);
});

test("project creation returns a stable conflict for preflight and concurrent database conflicts", async () => {
  const command = { projectId: "customer-portal", name: "Name", description: null, creatorUserId: "server-auth-user", sources: [{ originalFilename: "brief.pdf", bytes: pdf, mediaType: "application/pdf" }] };
  const store = { async put(input: { bytes: Uint8Array; mediaType: string }) { return { storageKey: "documents/1", contentHash: hash(input.bytes), byteSize: input.bytes.byteLength, mediaType: input.mediaType }; }, async read() { return pdf; } };
  await assert.rejects(() => createStoredAtlasProject(command, { documentStore: store, projectRepository: repository([], { available: false }) }), ProjectCreationConflictError);
  await assert.rejects(() => createStoredAtlasProject(command, { documentStore: store, projectRepository: repository([], { failure: Object.assign(new Error("duplicate key"), { code: "23505" }) }) }), ProjectCreationConflictError);
});
