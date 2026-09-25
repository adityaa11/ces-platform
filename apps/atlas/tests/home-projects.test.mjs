import assert from "node:assert/strict";
import { createJiti } from "jiti";
import { readFile } from "node:fs/promises";
import test from "node:test";

const jiti = createJiti(import.meta.url);
const { toProjectCardViewModel } = await jiti.import("../lib/home-projects.ts");

test("PCC-004 projects only persisted initial-draft state into a safe waiting card", () => {
  const readyToProject = { id: "private-project-row", projectId: "customer-portal", name: "Customer portal", description: null, createdAt: new Date(), initialDraftDocumentCount: 2, masterWorkspaceState: "empty", initialDraftWorkspaceState: "draft", hasDownstreamExtractionState: false };
  const card = toProjectCardViewModel({ ...readyToProject, storageKey: "must-not-project" });
  assert.deepEqual(card, {
    id: "private-project-row",
    projectId: "customer-portal",
    name: "Customer portal",
    summary: "No project description provided.",
    documentCount: 2,
    state: "waiting-for-extraction",
    master: { label: "No published work" },
    initialDraft: { processedLabel: "0 of 2 PRDs processed", progressPercent: 0 },
    metrics: { publishedFacts: 0, uploadedPrds: 2 },
    action: { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." },
  });
  assert.equal("storageKey" in card, false);
  assert.equal(toProjectCardViewModel({ ...readyToProject, initialDraftDocumentCount: 0 }), null, "a project without uploaded PRDs cannot be projected as waiting");
  assert.equal(toProjectCardViewModel({ ...readyToProject, initialDraftDocumentCount: Number.NaN }), null, "invalid persisted counts fail closed");
  assert.equal(toProjectCardViewModel({ ...readyToProject, masterWorkspaceState: null }), null, "a non-empty Master prerequisite fails closed");
  assert.equal(toProjectCardViewModel({ ...readyToProject, initialDraftWorkspaceState: null }), null, "an absent Initial Draft prerequisite fails closed");
  assert.equal(toProjectCardViewModel({ ...readyToProject, hasDownstreamExtractionState: true }), null, "downstream extraction state is not projected as waiting");
});

test("PCC-004 forwards only the server-resolved identity to the authorized read repository", async () => {
  const { listHomeProjectCards } = await jiti.import("../lib/home-projects.ts");
  let receivedUserId;
  const cards = await listHomeProjectCards("better-auth-user", {
    async listAccessibleTo(userId) {
      receivedUserId = userId;
      return [{ id: "project-row", projectId: "customer-portal", name: "Customer portal", description: null, createdAt: new Date(), initialDraftDocumentCount: 1, masterWorkspaceState: "empty", initialDraftWorkspaceState: "draft", hasDownstreamExtractionState: false }];
    },
  });
  assert.equal(receivedUserId, "better-auth-user");
  assert.equal(cards[0].initialDraft.processedLabel, "0 of 1 PRDs processed");
});

test("PCC-004's internal read transport is fixed and never forwards browser session context", async () => {
  const source = await readFile(new URL("../lib/home-project-read-service.ts", import.meta.url), "utf8");
  assert.match(source, /const internalHomeReadUrl = "http:\/\/atlas:3001\/internal\/home-projects"/);
  assert.doesNotMatch(source, /requestHeaders|cookie|\.get\("host"\)|http:\/\/\$\{/i);
});
