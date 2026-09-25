import assert from "node:assert/strict";
import test from "node:test";
import { assertCreateAtlasProjectInput } from "../src/project.ts";

const input = () => ({
  id: "project-internal-id",
  projectId: "customer-portal-v2",
  name: "Customer portal",
  description: null,
  creatorUserId: "better-auth-user",
  masterWorkspaceId: "master-workspace",
  initialDraftWorkspaceId: "draft-workspace",
  documents: [{ id: "artifact-id", originalFilename: "prd.pdf", storageKey: "opaque-server-key", sourceSha256: "a".repeat(64), byteSize: 42, mediaType: "application/pdf" as const, createdByUserId: "better-auth-user" }],
});

test("project persistence contract keeps stable identity, owner attribution, and distinct workspaces", () => {
  assert.doesNotThrow(() => assertCreateAtlasProjectInput(input()));
  assert.throws(() => assertCreateAtlasProjectInput({ ...input(), projectId: "UPPERCASE" }), /Project ID/);
  assert.throws(() => assertCreateAtlasProjectInput({ ...input(), initialDraftWorkspaceId: "master-workspace" }), /distinct/);
  assert.throws(() => assertCreateAtlasProjectInput({ ...input(), documents: [] }), /source document/);
});
