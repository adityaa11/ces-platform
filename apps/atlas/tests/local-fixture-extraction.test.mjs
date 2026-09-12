import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const records = JSON.parse(await readFile(path.join(root, "packages/atlas-fixtures/generated/local-projects.json"), "utf8"));
const [record] = records.filter((item) => item.project.id === "safara-project-01");

test("SFE-002 turns the existing Initial Draft source into a candidate-only ready-for-review fixture", async () => {
  assert.equal(record.project.status, "ready");
  assert.equal(record.project.repository.state, "ready-for-review");
  assert.equal(record.processingJob.stage, "ready");
  assert.equal(record.processingJob.workspaceId, record.initialDraftWorkspace.workspaceId);
  assert.equal(record.extraction.workspaceId, record.initialDraftWorkspace.workspaceId);
  assert.equal(record.masterWorkspace.status, "empty");
  assert.deepEqual(record.masterWorkspace.prdFiles, []);
  assert.equal(record.extraction.proposalState, "candidate-only");
  assert.deepEqual(record.extraction.executionProvenance, { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", mode: "codex" });
  assert.equal(record.project.repository.action.enabled, false);
  const [source] = record.sourceFiles;
  const bytes = await readFile(path.join(root, source.relativePath));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
  assert.equal(record.extraction.artifact.sha256, source.sha256);
  const candidates = new Set(record.extraction.candidateAssertions.map((candidate) => candidate.candidateId));
  assert.ok([...candidates].every((id) => id.startsWith("candidate-safara-project-01-")));
  assert.deepEqual(new Set(record.extraction.candidateAssertions.map((candidate) => candidate.evidence.page)), new Set([1, 2, 3]));
  assert.ok(record.extraction.sourceStatementInventory.length > 0);
  for (const entry of record.extraction.sourceStatementInventory) {
    assert.equal(entry.artifactId, record.extraction.artifact.artifactId);
    assert.ok(entry.page >= 1);
    if (entry.destination.type === "candidate_assertion") assert.ok(candidates.has(entry.destination.candidateId));
    else assert.equal(entry.statementClass, "non_fact");
  }
  assert.equal(record.extraction.repositoryInput.scenarioKind, "extraction_backed");
  assert.equal(record.extraction.repositoryInput.extractionResults[0].artifactId, record.extraction.artifact.artifactId);
});
