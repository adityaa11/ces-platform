import assert from "node:assert/strict";
import { createJiti } from "jiti";
import { readFile } from "node:fs/promises";
import test from "node:test";

const jiti = createJiti(import.meta.url);
const { toProjectCardViewModel } = await jiti.import("../lib/home-projects.ts");
const { parseApprovedHomeProjectCards } = await jiti.import("../lib/home-project-read-service.ts");
const base = { id: "private-project-row", projectId: "customer-portal", name: "Customer portal", description: null, createdAt: new Date(), masterWorkspaceId: "master", initialDraftWorkspaceId: "draft", initialDraftDocumentCount: 2, masterWorkspaceState: "empty", initialDraftWorkspaceState: "draft", hasDownstreamExtractionState: true };
const members = (states, failures = []) => states.map((state, index) => ({ documentId: `doc-${index + 1}`, sequence: index + 1, state, hasTechnicalFailure: failures.includes(index) }));
const bundle = (bundleState, completed, states, failures) => ({ kind: "bundle", bundleId: "bundle", bundleState, expectedDocumentCount: 2, completedDocumentCount: completed, memberFacts: members(states, failures) });

test("IDSER-009-02 maps every valid persisted lifecycle state without deriving progress", () => {
  const cases = [
    [{ ...base, hasDownstreamExtractionState: false, lifecycle: { kind: "legacy_no_bundle" } }, "waiting-for-extraction", "0 of 2 PRDs processed", 0],
    [{ ...base, lifecycle: bundle("waiting", 0, ["pending", "perception_queued"]) }, "waiting-for-extraction", "0 of 2 PRDs processed", 0],
    [{ ...base, lifecycle: bundle("processing", 1, ["completed", "extracting"]) }, "extracting", "1 of 2 PRDs processed", 50],
    [{ ...base, lifecycle: { kind: "technical_failure", bundleId: "bundle", expectedDocumentCount: 2, completedDocumentCount: 0, memberFacts: members(["needs_attention", "pending"], [0]) } }, "needs-attention", "0 of 2 PRDs processed", 0],
    [{ ...base, initialDraftWorkspaceState: null, lifecycle: bundle("ready_for_review", 2, ["completed", "completed"]) }, "ready-for-review", "2 of 2 PRDs processed", 100],
  ];
  for (const [project, state, label, percent] of cases) {
    const card = toProjectCardViewModel(project);
    assert.equal(card?.state, state);
    assert.equal(card?.initialDraft.processedLabel, label);
    assert.equal(card?.initialDraft.progressPercent, percent);
    assert.deepEqual(card?.master, { label: "No published work" });
    assert.deepEqual(card?.metrics, { publishedFacts: 0, uploadedPrds: 2 });
    assert.deepEqual(card?.action, { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." });
  }
  assert.equal(toProjectCardViewModel(cases[3][0])?.attentionReason, "Processing needs attention.");
  const thirds = toProjectCardViewModel({ ...base, initialDraftDocumentCount: 3, lifecycle: { kind: "bundle", bundleId: "bundle-3", bundleState: "processing", expectedDocumentCount: 3, completedDocumentCount: 1, memberFacts: members(["completed", "extracting", "pending"]) } });
  assert.deepEqual(thirds?.initialDraft, { processedLabel: "1 of 3 PRDs processed", progressPercent: 33 }, "partial progress floors from persisted X/N");
});

test("IDSER-009-02 fails closed for malformed records and does not count non-completed stages", () => {
  assert.equal(toProjectCardViewModel({ ...base, lifecycle: bundle("processing", 1, ["perceiving", "extracting"]) }), null, "OCR/extraction-only stages cannot increment X");
  assert.equal(toProjectCardViewModel({ ...base, lifecycle: bundle("ready_for_review", 1, ["completed", "completed"]) }), null, "ready requires X=N");
  assert.equal(toProjectCardViewModel({ ...base, lifecycle: bundle("waiting", 1, ["completed", "pending"]) }), null, "waiting cannot contain completed work");
  assert.equal(toProjectCardViewModel({ ...base, lifecycle: { kind: "legacy_no_bundle" } }), null, "legacy with downstream state is not projected");
  assert.equal(toProjectCardViewModel({ ...base, lifecycle: bundle("processing", 0, ["needs_attention", "pending"], [0]) }), null, "technical failure requires the bounded failure lifecycle");
});

test("IDSER-009-02 transports only the approved signed read model", async () => {
  const valid = { projects: [{ id: "project", projectId: "customer", name: "Customer", summary: "Summary", documentCount: 1, state: "extracting", master: { label: "No published work" }, initialDraft: { processedLabel: "0 of 1 PRDs processed", progressPercent: 0 }, metrics: { publishedFacts: 0, uploadedPrds: 1 }, action: { label: "Workspace unavailable", unavailableReason: "A production workspace is not available yet." } }] };
  assert.deepEqual(parseApprovedHomeProjectCards(valid), valid.projects);
  assert.throws(() => parseApprovedHomeProjectCards({ projects: [{ ...valid.projects[0], storageKey: "private/key" }] }), /Invalid Atlas project model/);
  assert.throws(() => parseApprovedHomeProjectCards({ projects: [{ ...valid.projects[0], state: "invented" }] }), /Invalid Atlas project model/);
  const source = await readFile(new URL("../lib/home-project-read-service.ts", import.meta.url), "utf8");
  assert.match(source, /const internalHomeReadUrl = "http:\/\/atlas:3001\/internal\/home-projects"/);
  assert.doesNotMatch(source, /requestHeaders|cookie|\.get\("host"\)|http:\/\/\$\{/i);
});

test("IDSER-009-02 forwards only the server-resolved identity to the authorized read repository", async () => {
  const { listHomeProjectCards } = await jiti.import("../lib/home-projects.ts");
  let receivedUserId;
  const cards = await listHomeProjectCards("better-auth-user", { async listAccessibleTo(userId) { receivedUserId = userId; return [{ ...base, id: "project-row", lifecycle: bundle("waiting", 0, ["pending", "pending"]) }]; } });
  assert.equal(receivedUserId, "better-auth-user");
  assert.equal(cards[0].initialDraft.processedLabel, "0 of 2 PRDs processed");
});
