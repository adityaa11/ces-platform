import assert from "node:assert/strict";
import { createJiti } from "jiti";
import test from "node:test";

const jiti = createJiti(import.meta.url);
const { toProjectCardViewModel } = await jiti.import("../lib/home-projects.ts");

test("PCC-004 projects only persisted initial-draft state into a safe waiting card", () => {
  const card = toProjectCardViewModel({ id: "private-project-row", projectId: "customer-portal", name: "Customer portal", description: null, createdAt: new Date(), initialDraftDocumentCount: 2, storageKey: "must-not-project" });
  assert.deepEqual(card, {
    id: "private-project-row",
    projectId: "customer-portal",
    name: "Customer portal",
    summary: "No project description provided.",
    documentCount: 2,
    state: "waiting-for-extraction",
    action: { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." },
  });
  assert.equal("storageKey" in card, false);
  assert.equal(toProjectCardViewModel({ id: "invalid", projectId: "invalid", name: "Invalid", description: null, createdAt: new Date(), initialDraftDocumentCount: 0 }), null, "a project without uploaded PRDs cannot be projected as waiting");
  assert.equal(toProjectCardViewModel({ id: "invalid", projectId: "invalid", name: "Invalid", description: null, createdAt: new Date(), initialDraftDocumentCount: Number.NaN }), null, "invalid persisted counts fail closed");
});
