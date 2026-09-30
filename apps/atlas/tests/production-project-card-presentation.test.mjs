import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import jitiFactory from "jiti";

const jiti = jitiFactory(import.meta.url, { interopDefault: true, jsx: { runtime: "automatic" } });
const { toProductionProjectCardPresentation } = await jiti.import("../components/production-project-card-presentation.ts");
const { ProductionProjectCard } = await jiti.import("../components/ProductionProjectCard.tsx");

const base = {
  action: { label: "Workspace unavailable", unavailableReason: "A review workspace is not available yet." },
  documentCount: 2,
  id: "project-1",
  initialDraft: { processedLabel: "1 of 2 PRDs processed", progressPercent: 50 },
  master: { label: "No published work" },
  metrics: { publishedFacts: 0, uploadedPrds: 2 },
  name: "Project one",
  hasSemanticUncertainty: false,
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

test("renders semantic uncertainty only as the bounded, accessible card indication", () => {
  for (const model of [
    { state: "ready-for-review", attentionReason: undefined },
    { state: "needs-attention", attentionReason: "Processing needs attention." },
  ]) {
    const html = renderToStaticMarkup(createElement(ProductionProjectCard, { project: { ...base, ...model, hasSemanticUncertainty: true } }));
    assert.match(html, /<p class="repository-card-semantic-uncertainty">Semantic uncertainty<\/p>/);
    assert.match(html, new RegExp(`repository-status-${model.state}`));
  }
  const falseHtml = renderToStaticMarkup(createElement(ProductionProjectCard, { project: { ...base, state: "extracting", hasSemanticUncertainty: false } }));
  assert.doesNotMatch(falseHtml, /Semantic uncertainty|repository-card-semantic-uncertainty/);
});

test("renders every approved production lifecycle model with its exact card content", () => {
  const models = [
    { state: "waiting-for-extraction", processedLabel: "0 of 2 PRDs processed", progressPercent: 0, uploadedPrds: 2, status: "Waiting for extraction", metric: "Waiting", metricLabel: "for extraction" },
    { state: "extracting", processedLabel: "1 of 2 PRDs processed", progressPercent: 50, uploadedPrds: 2, status: "Extracting", metric: "Extracting", metricLabel: "" },
    { state: "needs-attention", processedLabel: "1 of 3 PRDs processed", progressPercent: 33, uploadedPrds: 3, status: "Needs attention", metric: "Needs", metricLabel: "attention", attentionReason: "Processing needs attention." },
    { state: "ready-for-review", processedLabel: "2 of 2 PRDs processed", progressPercent: 100, uploadedPrds: 2, status: "Ready for review", metric: "Ready", metricLabel: "for review" },
  ];

  const projects = models.map((model) => ({
      ...base,
      ...model,
      id: `project-${model.state}`,
      initialDraft: { processedLabel: model.processedLabel, progressPercent: model.progressPercent },
      metrics: { publishedFacts: 0, uploadedPrds: model.uploadedPrds },
    }));
  const htmlByState = projects.map((project) => renderToStaticMarkup(createElement(ProductionProjectCard, { project })));

  for (const [model, html] of models.map((model, index) => [model, htmlByState[index]])) {
    assert.match(html, new RegExp(`repository-status-${model.state}[^>]*>${model.status}<`));
    assert.match(html, new RegExp(`aria-label="Extraction progress: ${model.processedLabel}"[^>]*value="${model.progressPercent}"`));
    assert.match(html, /aria-label="Master: No published work"/);
    assert.match(html, /<strong>Master<\/strong><span>No published work<\/span>/);
    assert.match(html, new RegExp(`<dd>0</dd><dt>published facts</dt>[\\s\\S]*?<dd>${model.uploadedPrds}</dd><dt>PRDs uploaded</dt>[\\s\\S]*?<dd>${model.metric}</dd><dt>${model.metricLabel}</dt>`));
    if (model.attentionReason) assert.match(html, /<p class="repository-card-notice">Processing needs attention\.<\/p>/);
    else assert.doesNotMatch(html, /repository-card-notice/);
  }
});

test("renders accessible, static unavailable production actions without navigation", () => {
  const html = renderToStaticMarkup(createElement(ProductionProjectCard, { project: { ...base, state: "needs-attention", attentionReason: "Processing needs attention." } }));

  assert.match(html, /<article aria-labelledby="project-1-title"/);
  assert.match(html, /<h2 id="project-1-title"[^>]*>Project one<\/h2>/);
  assert.match(html, /<span class="repository-status repository-status-needs-attention">Needs attention<\/span>/);
  assert.match(html, /<progress aria-label="Extraction progress: 1 of 2 PRDs processed"[^>]*max="100"[^>]*value="50"/);
  assert.match(html, /<button class="button button-primary repository-primary-action" aria-describedby="project-1-action-hint" disabled="" type="button">Workspace unavailable/);
  assert.match(html, /<span class="sr-only" id="project-1-action-hint">A review workspace is not available yet\.<\/span>/);
  assert.match(html, /<button class="button button-primary repository-share-action" aria-label="Sharing unavailable until production sharing is supported" disabled="" type="button">Share<\/button>/);
  assert.doesNotMatch(html, /aria-live|role="status"|<a\b|href=/);
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
