import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { resolveFixtureAuthoringExecutor } from "@atlas/fixtures";
import { expectedWorkflowStages, sourceArtifacts, sourceAssertions } from "./safara-source-catalog.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const output = path.join(root, "packages", "atlas-fixtures", "generated", "safara-golden-bundle.json");
const skillRoot = path.join(root, ".agents", "skills");
const surfaces = ["workflow", "facts", "ces", "chatbot_context"];
const provenance = (skillId, mode) => ({ skillId, skillVersion: "1.1.0", mode });

async function extract(source) {
  const filePath = path.join(root, source.relativePath);
  const bytes = new Uint8Array(await readFile(filePath));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== source.sha256) throw new Error(`Source checksum mismatch: ${source.relativePath}`);
  const pdf = await pdfjs.getDocument({ data: bytes, useWorker: false }).promise;
  const pages = [];
  for (let page = 1; page <= pdf.numPages; page += 1) {
    const content = await (await pdf.getPage(page)).getTextContent();
    pages.push({ page, text: content.items.map((item) => item.str).join(" ") });
  }
  return { artifactId: `artifact-safara-${source.name.replace(/[^a-z0-9]+/gi, "-").replace(/-+$/g, "").toLowerCase()}`, type: "prd", name: source.name, relativePath: source.relativePath, sha256, pages };
}
async function discoverSources() {
  return Promise.all(sourceArtifacts.map(extract));
}
async function manifest(skillId) {
  const folder = skillId.replace("atlas.", "atlas-").replaceAll(".", "-");
  return JSON.parse(await readFile(path.join(skillRoot, folder, "atlas-skill.json"), "utf8"));
}
async function invoke(skillId, input, produce, context) {
  const contract = await manifest(skillId);
  const inputValidator = context.ajv.compile(contract.inputSchema);
  if (!inputValidator(input)) throw new Error(`${skillId} rejected input: ${context.ajv.errorsText(inputValidator.errors)}`);
  const response = produce();
  if (process.env.GOLDEN_FIXTURE_TEST_FAIL_SCHEMA === skillId) delete response.skillId;
  const outputValidator = context.ajv.compile(contract.outputSchema);
  if (!outputValidator(response)) throw new Error(`${skillId} rejected output: ${context.ajv.errorsText(outputValidator.errors)}`);
  context.pipeline.push({ skillId, input, response, executionProvenance: response.executionProvenance });
  return response;
}
function sourceEvidence(artifacts, name, page, quote) {
  const artifact = artifacts.find((item) => item.name === name);
  const text = artifact?.pages.find((item) => item.page === page)?.text ?? "";
  if (!text.replace(/\s+/g, " ").toLocaleLowerCase().includes(quote.replace(/\s+/g, " ").toLocaleLowerCase())) throw new Error(`Evidence quote not found: ${name} p.${page}`);
  return { artifactId: artifact.artifactId, page, quote };
}
function makeAssertions(artifacts) {
  const latest = new Map();
  return sourceAssertions.map((entry, index) => {
    const assertionId = `ast-${String(index + 1).padStart(2, "0")}-${entry.semanticKey.replace(/[^a-z0-9]+/gi, "-")}`;
    const assertion = { assertionId, semanticKey: entry.semanticKey, value: entry.value, evidence: sourceEvidence(artifacts, entry.artifactName, entry.page, entry.quote), status: "accepted", workflowStage: entry.workflowStage, phase: entry.phase };
    if (entry.supersedesSemanticKey) assertion.supersedesAssertionId = latest.get(entry.supersedesSemanticKey);
    latest.set(entry.semanticKey, assertionId);
    return assertion;
  });
}
function current(assertions, phases) {
  const active = assertions.filter((item) => phases.includes(item.phase));
  const superseded = new Set(active.map((item) => item.supersedesAssertionId).filter(Boolean));
  return active.filter((item) => !superseded.has(item.assertionId));
}
function records(surface, assertions) {
  if (surface === "workflow") return expectedWorkflowStages.map((stage) => {
    const items = assertions.filter((item) => item.workflowStage === stage);
    return { recordId: `workflow-${stage}`, assertionIds: items.map((item) => item.assertionId), dependencyIds: items.map((item) => `facts-${item.semanticKey}`), resolvedValue: Object.fromEntries(items.map((item) => [item.semanticKey, item.value])) };
  }).filter((item) => item.assertionIds.length);
  return assertions.map((item) => ({ recordId: `${surface}-${item.semanticKey}`, assertionIds: [item.assertionId], dependencyIds: [`workflow-${item.workflowStage}`], resolvedValue: item.value }));
}
function project(branchId, headRevisionId, assertions) {
  return { branchId, headRevisionId, surfaces: surfaces.map((surface) => ({ surface, branchId, headRevisionId, records: records(surface, assertions) })) };
}
function compact({ pages, ...artifact }) { return { ...artifact, pageCount: pages.length }; }
function validate(bundle, sourceArtifacts) {
  const { repository, projections, sourceCoverage } = bundle;
  const assertions = new Map(repository.assertions.map((item) => [item.assertionId, item]));
  const revisions = new Set(repository.revisions.map((item) => item.revisionId));
  if (sourceCoverage.expectedArtifactCount !== repository.artifacts.length) throw new Error("Incomplete source artifact coverage");
  for (const artifact of sourceArtifacts) if (!repository.artifacts.some((item) => item.artifactId === artifact.artifactId)) throw new Error(`Omitted artifact: ${artifact.name}`);
  for (const assertion of repository.assertions) {
    const source = sourceArtifacts.find((item) => item.artifactId === assertion.evidence.artifactId);
    const pageText = source?.pages.find((page) => page.page === assertion.evidence.page)?.text ?? "";
    if (!pageText.replace(/\s+/g, " ").toLocaleLowerCase().includes(assertion.evidence.quote.replace(/\s+/g, " ").toLocaleLowerCase())) throw new Error(`Unresolved evidence: ${assertion.assertionId}`);
    if (assertion.supersedesAssertionId && !assertions.has(assertion.supersedesAssertionId)) throw new Error(`Unresolved supersession: ${assertion.assertionId}`);
  }
  for (const artifact of repository.artifacts) if (!repository.assertions.some((item) => item.evidence.artifactId === artifact.artifactId)) throw new Error(`No extracted assertion: ${artifact.name}`);
  for (const extraction of bundle.skillResponses.extractionResponses) {
    const count = repository.assertions.filter((item) => item.evidence.artifactId === extraction.input.artifact.artifactId).length;
    if (extraction.response.candidateAssertions.length !== count || extraction.response.unaccountedStatements.length) throw new Error(`Source accounting failed: ${extraction.input.artifact.name}`);
  }
  for (const branch of repository.branches) {
    if (!revisions.has(branch.headRevisionId)) throw new Error(`Unresolved branch HEAD: ${branch.branchId}`);
    const state = repository.materializedStates.find((item) => item.branchId === branch.branchId && item.headRevisionId === branch.headRevisionId);
    if (!state || state.state.assertionIds.length !== state.state.resolvedFacts.length) throw new Error(`Incomplete materialization: ${branch.branchId}`);
    for (const id of state.state.assertionIds) if (!assertions.has(id)) throw new Error(`Unknown state assertion: ${id}`);
  }
  for (const projection of projections) {
    const state = repository.materializedStates.find((item) => item.branchId === projection.branchId && item.headRevisionId === projection.headRevisionId);
    const stages = new Set(projection.surfaces.find((surface) => surface.surface === "workflow").records.map((record) => record.recordId.replace("workflow-", "")));
    const requiredStages = projection.branchId === "branch-increment-003" ? expectedWorkflowStages : expectedWorkflowStages.filter((stage) => !["dashboard-and-reports", "activity-history", "delivery-and-acceptance"].includes(stage));
    for (const stage of requiredStages) if (!stages.has(stage)) throw new Error(`Missing workflow stage ${stage}`);
    for (const surface of projection.surfaces) for (const record of surface.records) for (const id of record.assertionIds) if (!state.state.resolvedFacts.some((fact) => fact.assertionId === id)) throw new Error(`Projection has non-current fact: ${record.recordId}`);
  }
}
async function main() {
  const mode = resolveFixtureAuthoringExecutor(process.env);
  if (mode !== "codex") throw new Error("The deterministic GLF-003-01 reference executor supports codex only.");
  const context = { ajv: new Ajv({ strict: false }), pipeline: [] };
  const artifacts = await discoverSources();
  const assertions = makeAssertions(artifacts);
  const extractionResponses = [];
  for (const artifact of artifacts) {
    const input = { artifact: { artifactId: artifact.artifactId, type: "prd", name: artifact.name }, pages: artifact.pages, extractionVersion: "glf-003-01" };
    const response = await invoke("atlas.prd-extraction", input, () => ({ skillId: "atlas.prd-extraction", skillVersion: "1.1.0", executionProvenance: provenance("atlas.prd-extraction", mode), status: "complete", candidateAssertions: assertions.filter((item) => item.evidence.artifactId === artifact.artifactId).map((item) => ({ candidateId: `candidate-${item.assertionId}`, kind: "constraint", semanticKey: item.semanticKey, payload: item.value, possibleAffectedSemanticKey: item.semanticKey, evidence: item.evidence })), unaccountedStatements: [], questions: [] }), context);
    extractionResponses.push({ input, response });
  }
  const master = current(assertions, ["base"]);
  const increment03 = current(assertions, ["base", "increment-03"]);
  const repository = { projectId: "safara", schemaVersion: "1.1", artifacts: artifacts.map(compact), assertions,
    revisions: [{ revisionId: "rev-safara-master-002", parentRevisionIds: [], acceptedAssertionIds: master.map((item) => item.assertionId), executionProvenance: provenance("atlas.fixture-repository", mode) }, { revisionId: "rev-safara-increment-003", parentRevisionIds: ["rev-safara-master-002"], acceptedAssertionIds: increment03.filter((item) => item.phase === "increment-03").map((item) => item.assertionId), executionProvenance: provenance("atlas.fixture-repository", mode) }],
    branches: [{ branchId: "branch-master", label: "Master - Increment 02", headRevisionId: "rev-safara-master-002" }, { branchId: "branch-increment-003", label: "Increment 03", headRevisionId: "rev-safara-increment-003" }],
    materializedStates: [{ branchId: "branch-master", headRevisionId: "rev-safara-master-002", state: { assertionIds: master.map((item) => item.assertionId), resolvedFacts: master.map((item) => ({ semanticKey: item.semanticKey, assertionId: item.assertionId, value: item.value })) } }, { branchId: "branch-increment-003", headRevisionId: "rev-safara-increment-003", state: { assertionIds: increment03.map((item) => item.assertionId), resolvedFacts: increment03.map((item) => ({ semanticKey: item.semanticKey, assertionId: item.assertionId, value: item.value })) } }],
    changeProposals: [], dependencies: [] };
  const manifestFact = increment03.find((item) => item.semanticKey === "manifest.eligibility");
  const proposal = { proposalId: "proposal-manifest-staged-correction", branchId: "branch-increment-003", baseRevisionId: "rev-safara-increment-003", targetSemanticKey: "manifest.eligibility", beforeValue: manifestFact.value, proposedValue: { ...manifestFact.value, exception: "manual_override" }, provenance: manifestFact.evidence, status: "staged", resolution: null };
  repository.changeProposals.push(proposal);
  const repositoryResponse = await invoke("atlas.fixture-repository", { projectId: "safara", sourceArtifacts: artifacts.map(compact), requestedScenario: "Complete Safara operational facts and Increment 03 branch truth" }, () => ({ skillId: "atlas.fixture-repository", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-repository", mode), status: "complete", repositoryCandidate: repository, issues: [] }), context);
  const changesResponse = await invoke("atlas.fixture-changes", { inputKind: "user_correction", branch: { branchId: proposal.branchId, headRevisionId: proposal.baseRevisionId }, baseRevision: { revisionId: proposal.baseRevisionId }, currentState: repository.materializedStates[1], incomingInformation: proposal.proposedValue, sourceArtifacts: artifacts.map(compact) }, () => ({ skillId: "atlas.fixture-changes", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-changes", mode), status: "complete", changeProposal: proposal, questions: [] }), context);
  const projections = [project("branch-master", "rev-safara-master-002", master), project("branch-increment-003", "rev-safara-increment-003", increment03)];
  const projectionResponses = [];
  for (const projection of projections) projectionResponses.push(await invoke("atlas.fixture-projections", { branch: { branchId: projection.branchId, headRevisionId: projection.headRevisionId }, headRevision: { revisionId: projection.headRevisionId }, resolvedFacts: repository.materializedStates.find((item) => item.branchId === projection.branchId).state.resolvedFacts, dependencies: [], requestedSurfaces: surfaces }, () => ({ skillId: "atlas.fixture-projections", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-projections", mode), status: "complete", projectionCandidate: projection, issues: [] }), context));
  const verificationResponses = [];
  for (const projection of projections) verificationResponses.push(await invoke("atlas.fixture-verification", { repository, projections: projection, checks: ["source-accounting", "workflow-coverage", "topology", "provenance", "evidence", "branch-isolation"] }, () => ({ skillId: "atlas.fixture-verification", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-verification", mode), status: "pass", checks: ["source-accounting", "workflow-coverage", "topology", "provenance", "evidence", "branch-isolation"].map((checkId) => ({ checkId, status: "pass", detail: `${checkId} passed for ${projection.branchId}@${projection.headRevisionId}.`, evidence: [{ kind: "deterministic-validation", reference: "validate(generated bundle)" }] })) }), context));
  const bundle = { bundleVersion: "1.1", generatedAt: "2026-09-05T00:00:00.000Z", executionMode: mode, sourceCoverage: { expectedArtifactCount: artifacts.length, expectedWorkflowStages, candidateAssertionCount: assertions.length }, pipeline: context.pipeline, skillResponses: { extractionResponses, repositoryResponse, changesResponse, projectionResponses, verificationResponses }, repository: repositoryResponse.repositoryCandidate, projections };
  validate(bundle, artifacts);
  if (verificationResponses.some((response) => response.status !== "pass" || response.checks.some((check) => check.status !== "pass"))) throw new Error("Fixture verification failed; publication refused");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(`${output}.tmp`, `${JSON.stringify(bundle, null, 2)}\n`);
  await rename(`${output}.tmp`, output);
  console.log(`Generated and validated ${path.relative(root, output)}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
