import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { expectedWorkflowStages, sourceArtifacts, sourceStatementInventory } from "./safara-source-catalog.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const output = path.join(root, "packages", "atlas-fixtures", "generated", "safara-golden-bundle.json");
const reportOutput = path.join(root, "packages", "atlas-fixtures", "generated", "safara-reconciliation.md");
const surfaces = ["workflow", "facts", "ces", "chatbot_context"];

function fail(message) { throw new Error(message); }
function normalize(value) { return value.replace(/\s+/g, " ").replace(/\s+([.,:;])/g, "$1").toLocaleLowerCase(); }
async function loadArtifact(source) {
  const bytes = new Uint8Array(await readFile(path.join(root, source.relativePath)));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== source.sha256) fail("Source checksum mismatch: " + source.name);
  const pdf = await pdfjs.getDocument({ data: bytes, useWorker: false }).promise;
  if (pdf.numPages !== source.pageCount) fail("Unexpected source page count: " + source.name);
  const pages = [];
  for (let page = 1; page <= pdf.numPages; page += 1) {
    const content = await (await pdf.getPage(page)).getTextContent();
    pages.push({ page, text: content.items.map((item) => item.str).join(" ") });
  }
  return { artifactId: "artifact-safara-" + source.name.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/g, "").toLowerCase(), type: "prd", name: source.name, relativePath: source.relativePath, sha256, pages };
}
function evidence(artifacts, entry) {
  const artifact = artifacts.find((item) => item.name === entry.artifactName);
  const text = artifact && artifact.pages.find((item) => item.page === entry.page);
  if (!text || !normalize(text.text).includes(normalize(entry.quote))) fail("Evidence quote not found: " + entry.inventoryId);
  return { artifactId: artifact.artifactId, page: entry.page, quote: entry.quote, inventoryId: entry.inventoryId };
}
function assertions(artifacts) {
  const latest = new Map();
  return sourceStatementInventory.filter((entry) => entry.destination.type === "candidate_assertion").map((entry, index) => {
    const semanticKey = entry.semanticKey === "inc01.exclusions" ? "manifest.eligibility" : entry.semanticKey;
    const value = entry.semanticKey === "inc01.exclusions" ? { status: "out_of_scope" } : entry.value;
    const assertion = { assertionId: "ast-" + String(index + 1).padStart(3, "0") + "-" + semanticKey.replace(/[^a-z0-9]+/gi, "-"), candidateId: entry.destination.candidateId, inventoryId: entry.inventoryId, semanticKey, value, evidence: evidence(artifacts, entry), status: "accepted", workflowStage: entry.workflowStage, phase: entry.phase };
    if (latest.has(semanticKey)) assertion.supersedesAssertionId = latest.get(semanticKey);
    latest.set(semanticKey, assertion.assertionId);
    return assertion;
  });
}
function current(all, phases) {
  const active = all.filter((item) => phases.includes(item.phase));
  const superseded = new Set(active.map((item) => item.supersedesAssertionId).filter(Boolean));
  return active.filter((item) => !superseded.has(item.assertionId));
}
function records(surface, all) {
  if (surface === "workflow") return expectedWorkflowStages.map((stage) => {
    const items = all.filter((item) => item.workflowStage === stage);
    return { recordId: "workflow-" + stage, assertionIds: items.map((item) => item.assertionId), candidateIds: items.map((item) => item.candidateId), inventoryIds: items.map((item) => item.inventoryId), resolvedValue: Object.fromEntries(items.map((item) => [item.semanticKey, item.value])) };
  }).filter((item) => item.assertionIds.length);
  return all.map((item) => ({ recordId: surface + "-" + item.semanticKey, assertionIds: [item.assertionId], candidateIds: [item.candidateId], inventoryIds: [item.inventoryId], resolvedValue: item.value }));
}
function projection(branchId, headRevisionId, all) {
  return { branchId, headRevisionId, surfaces: surfaces.map((surface) => ({ surface, branchId, headRevisionId, records: records(surface, all) })) };
}
function validate(bundle, artifacts) {
  if (artifacts.length !== 3 || artifacts.reduce((total, item) => total + item.pages.length, 0) !== 11) fail("Authoritative source set must be exactly three artifacts and eleven pages");
  if (bundle.repository.artifacts.some((item) => /buyer/i.test(item.name + " " + item.relativePath))) fail("Disallowed source artifact");
  const inventory = bundle.sourceStatementInventory;
  if (inventory.length !== new Set(inventory.map((entry) => entry.inventoryId)).size) fail("Duplicate inventory ID");
  for (const artifact of artifacts) for (let page = 1; page <= artifact.pages.length; page += 1) if (!inventory.some((entry) => entry.artifactName === artifact.name && entry.page === page)) fail("Inventory omitted page: " + artifact.name + " p." + page);
  for (const entry of inventory) {
    if (!entry.destination || !["candidate_assertion", "non_fact"].includes(entry.destination.type)) fail("Unresolved inventory destination: " + entry.inventoryId);
    if (entry.destination.type === "non_fact" && (entry.statementClass !== "non_fact" || entry.destination.reason !== "Heading only; it has no independently meaningful requirement.")) fail("Disallowed non-fact classification: " + entry.inventoryId);
  }
  const byAssertion = new Map(bundle.repository.assertions.map((item) => [item.assertionId, item]));
  const candidates = inventory.filter((item) => item.destination.type === "candidate_assertion");
  if (byAssertion.size !== bundle.repository.assertions.length || candidates.length !== bundle.repository.assertions.length) fail("Assertions do not map one-to-one with inventory candidates");
  if (new Set(bundle.repository.assertions.map((item) => item.candidateId)).size !== bundle.repository.assertions.length) fail("Duplicate assertion candidate");
  for (const entry of inventory.filter((item) => item.destination.type === "candidate_assertion")) {
    const matches = bundle.repository.assertions.filter((item) => item.inventoryId === entry.inventoryId);
    const assertion = matches[0];
    if (matches.length !== 1 || !assertion || assertion.candidateId !== entry.destination.candidateId || assertion.evidence.artifactId !== artifacts.find((item) => item.name === entry.artifactName).artifactId || assertion.evidence.page !== entry.page || assertion.evidence.quote !== entry.quote) fail("Candidate provenance failed: " + entry.inventoryId);
  }
  for (const state of bundle.repository.materializedStates) for (const fact of state.state.resolvedFacts) {
    const assertion = byAssertion.get(fact.assertionId);
    if (!assertion || fact.inventoryId !== assertion.inventoryId || fact.candidateId !== assertion.candidateId) fail("Materialized fact provenance failed: " + fact.assertionId);
  }
  for (const item of bundle.projections) for (const surface of item.surfaces) for (const record of surface.records) {
    if (record.assertionIds.length !== record.inventoryIds.length || record.assertionIds.length !== record.candidateIds.length) fail("Projection provenance cardinality failed: " + record.recordId);
    for (let index = 0; index < record.assertionIds.length; index += 1) {
      const assertion = byAssertion.get(record.assertionIds[index]);
      if (!assertion || record.inventoryIds[index] !== assertion.inventoryId || record.candidateIds[index] !== assertion.candidateId) fail("Projection provenance failed: " + record.recordId);
    }
  }
  const increment = bundle.projections.find((item) => item.branchId === "branch-increment-003");
  const stages = increment.surfaces.find((item) => item.surface === "workflow").records.map((item) => item.recordId.replace("workflow-", ""));
  for (const stage of expectedWorkflowStages) if (!stages.includes(stage)) fail("Missing workflow stage: " + stage);
}
function report(bundle) {
  const sourcePageCount = bundle.repository.artifacts.reduce((total, artifact) => total + artifact.pageCount, 0);
  const unresolvedQuestionCount = bundle.sourceStatementInventory.filter((entry) => entry.normalizedInterpretation && entry.normalizedInterpretation.kind === "unresolved_question").length;
  const lines = ["# Safara GLF-003-02 reconciliation", "", "- Source pages: " + sourcePageCount, "- Inventory statements: " + bundle.sourceStatementInventory.length, "- Candidate assertions: " + bundle.repository.assertions.length, "- Non-fact classifications: " + bundle.sourceStatementInventory.filter((entry) => entry.destination.type === "non_fact").length, "- Duplicate links: " + bundle.sourceStatementInventory.filter((entry) => entry.destination.duplicateOf).length, "- Unresolved questions: " + unresolvedQuestionCount, "", "| PDF | Page | Candidates | Non-facts |", "|---|---:|---:|---:|"];
  for (const artifact of bundle.repository.artifacts) for (let page = 1; page <= artifact.pageCount; page += 1) {
    const entries = bundle.sourceStatementInventory.filter((entry) => entry.artifactName === artifact.name && entry.page === page);
    lines.push("| " + artifact.name + " | " + page + " | " + entries.filter((entry) => entry.destination.type === "candidate_assertion").length + " | " + entries.filter((entry) => entry.destination.type === "non_fact").length + " |");
  }
  lines.push("", "- Current materialized facts: " + bundle.repository.materializedStates.reduce((n, state) => n + state.state.resolvedFacts.length, 0));
  lines.push("- Projected records: " + bundle.projections.reduce((n, item) => n + item.surfaces.reduce((sum, surface) => sum + surface.records.length, 0), 0));
  return lines.join("\n") + "\n";
}
async function main() {
  if ((process.env.SKILLS_MODE || "codex") !== "codex") fail("The deterministic reference executor supports codex only.");
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "add-unresolved-question") {
    const primary = sourceStatementInventory.find((entry) => entry.destination.type === "candidate_assertion");
    sourceStatementInventory.push({ ...primary, inventoryId: "INV-TEST-QUESTION-001", semanticKey: "test.unresolved-question", value: { question: "Fixture-only unresolved question" }, normalizedInterpretation: { kind: "unresolved_question", question: "Fixture-only unresolved question" }, destination: { type: "candidate_assertion", candidateId: "candidate-inv-test-question-001" } });
  }
  const artifacts = await Promise.all(sourceArtifacts.map(loadArtifact));
  const all = assertions(artifacts);
  const master = current(all, ["base"]);
  const increment = current(all, ["base", "increment-03"]);
  const repository = { projectId: "safara", schemaVersion: "1.2", artifacts: artifacts.map(({ pages, ...artifact }) => ({ ...artifact, pageCount: pages.length })), assertions: all, revisions: [{ revisionId: "rev-safara-master-002", parentRevisionIds: [], acceptedAssertionIds: master.map((item) => item.assertionId) }, { revisionId: "rev-safara-increment-003", parentRevisionIds: ["rev-safara-master-002"], acceptedAssertionIds: increment.filter((item) => item.phase === "increment-03").map((item) => item.assertionId) }], branches: [{ branchId: "branch-master", label: "Master - Increment 02", headRevisionId: "rev-safara-master-002" }, { branchId: "branch-increment-003", label: "Increment 03", headRevisionId: "rev-safara-increment-003" }], materializedStates: [], changeProposals: [] };
  repository.materializedStates = [{ branchId: "branch-master", headRevisionId: "rev-safara-master-002", state: { assertionIds: master.map((item) => item.assertionId), resolvedFacts: master.map((item) => ({ semanticKey: item.semanticKey, assertionId: item.assertionId, candidateId: item.candidateId, inventoryId: item.inventoryId, value: item.value })) } }, { branchId: "branch-increment-003", headRevisionId: "rev-safara-increment-003", state: { assertionIds: increment.map((item) => item.assertionId), resolvedFacts: increment.map((item) => ({ semanticKey: item.semanticKey, assertionId: item.assertionId, candidateId: item.candidateId, inventoryId: item.inventoryId, value: item.value })) } }];
  const proposal = { proposalId: "proposal-manifest-staged-correction", branchId: "branch-increment-003", baseRevisionId: "rev-safara-increment-003", targetSemanticKey: "manifest.eligibility", status: "staged" };
  repository.changeProposals.push(proposal);
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "remove-fact") repository.assertions.pop();
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "corrupt-page") repository.assertions[0].evidence.page = 99;
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "buyer-artifact") repository.artifacts.push({ name: "Buyer PRD.pdf", relativePath: "docs/PRD/Safara/Buyer.pdf", pageCount: 1 });
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "duplicate-assertion") repository.assertions.push({ ...repository.assertions[0], assertionId: "ast-duplicate" });
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "corrupt-fact-provenance") repository.materializedStates[0].state.resolvedFacts[0].candidateId = "candidate-corrupt";
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "material-non-fact") {
    const entry = sourceStatementInventory.find((item) => item.statementClass === "material");
    entry.destination = { type: "non_fact", reason: "arbitrary classification" };
  }
  const projections = [projection("branch-master", "rev-safara-master-002", master), projection("branch-increment-003", "rev-safara-increment-003", increment)];
  if (process.env.GOLDEN_FIXTURE_TEST_MUTATION === "corrupt-projection-provenance") projections[0].surfaces[0].records[0].inventoryIds[0] = "INV-corrupt";
  const bundle = { bundleVersion: "1.2", generatedAt: "2026-09-05T00:00:00.000Z", executionMode: "codex", sourceCoverage: { expectedArtifactCount: 3, expectedPageCount: 11, candidateAssertionCount: all.length, expectedWorkflowStages }, sourceStatementInventory, repository, projections, skillResponses: { extractionResponses: artifacts.map((artifact) => ({ input: { artifact: { artifactId: artifact.artifactId, name: artifact.name } }, response: { candidateAssertions: all.filter((item) => item.evidence.artifactId === artifact.artifactId).map((item) => ({ candidateId: item.candidateId, inventoryId: item.inventoryId, evidence: item.evidence })), unaccountedStatements: [] } })) } };
  validate(bundle, artifacts);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output + ".tmp", JSON.stringify(bundle, null, 2) + "\n");
  await writeFile(reportOutput + ".tmp", report(bundle));
  await rename(output + ".tmp", output);
  await rename(reportOutput + ".tmp", reportOutput);
  console.log("Generated and validated " + path.relative(root, output));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
