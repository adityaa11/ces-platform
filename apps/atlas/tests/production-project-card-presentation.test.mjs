import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jitiFactory from "jiti";

const jiti = jitiFactory(import.meta.url, { interopDefault: true });
const { toProductionProjectCardPresentation } = await jiti.import("../components/production-project-card-presentation.ts");

const base = {
  action: { label: "Workspace unavailable", unavailableReason: "A review workspace is not available yet." },
  documentCount: 2,
  id: "project-1",
  initialDraft: { processedLabel: "1 of 2 PRDs processed", progressPercent: 50 },
  master: { label: "No published work" },
  metrics: { publishedFacts: 0, uploadedPrds: 2 },
  name: "Project one",
  projectId: "project-one",
  summary: "A browser-safe card.",
};

test("renders each approved production lifecycle label from the supplied model", () => {
  const expected = {
    "waiting-for-extraction": ["Waiting for extraction", "Waiting", "for extraction"],
    extracting: ["Extracting", "Extracting", ""],
    "needs-attention": ["Needs attention", "Needs", "attention"],
    "ready-for-review": ["Ready for review", "Ready", "for review"],
  };
  for (const [state, [label, value, metricLabel]] of Object.entries(expected)) {
    const presentation = toProductionProjectCardPresentation({ ...base, state });
    assert.deepEqual(presentation.status, { label, tone: state });
    assert.deepEqual(presentation.metrics, [{ label: "published facts", value: 0 }, { label: "PRDs uploaded", value: 2 }, { label: metricLabel, value }]);
  }
});

test("keeps technical failure copy bounded and does not interpret lifecycle facts in the component", async () => {
  const attention = toProductionProjectCardPresentation({ ...base, attentionReason: "Processing needs attention.", state: "needs-attention" });
  assert.equal(attention.attentionReason, "Processing needs attention.");
  assert.equal(toProductionProjectCardPresentation({ ...base, attentionReason: "Processing needs attention.", state: "ready-for-review" }).attentionReason, undefined);

  const [card, presentation] = await Promise.all([
    readFile(new URL("../components/ProductionProjectCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ProjectCardPresentation.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(card, /toProductionProjectCardPresentation\(project\)/);
  assert.doesNotMatch(card, /localStorage|setInterval|fetch\(|href=|Math\.floor/);
  assert.match(presentation, /<article aria-labelledby=/);
  assert.match(presentation, /<progress aria-label=/);
  assert.match(card, /aria-describedby=\{`\$\{project\.id\}-action-hint`\}/);
  assert.match(presentation, /repository-card-notice/);
});
