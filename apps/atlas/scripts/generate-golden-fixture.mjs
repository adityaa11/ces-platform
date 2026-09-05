import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { resolveFixtureAuthoringExecutor } from "@atlas/fixtures";

const root = path.resolve(import.meta.dirname, "../../..");
const prdDirectory = path.join(root, "docs", "PRD");
const outputDirectory = path.join(root, "packages", "atlas-fixtures", "generated");
const outputFile = path.join(outputDirectory, "safara-golden-bundle.json");
const skillDirectory = path.join(root, ".agents", "skills");

const provenance = (skillId, mode) => ({ skillId, skillVersion: "1.1.0", mode });

async function discoverPdfs(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) return discoverPdfs(path.join(directory, entry.name), relativePath);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".pdf") ? [relativePath] : [];
  }));
  return discovered.flat().sort((left, right) => left.localeCompare(right));
}

async function extractArtifact(relativePath) {
  const artifactId = `artifact-${relativePath.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase()}`;
  const filePath = path.join(prdDirectory, relativePath);
  const bytes = new Uint8Array(await readFile(filePath));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const document = await pdfjs.getDocument({ data: bytes, useWorker: false }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({ page: pageNumber, text: content.items.map((item) => item.str).join(" ") });
  }
  return { artifactId, type: "prd", name: path.basename(relativePath), relativePath, sha256, pages };
}

async function loadSkill(skillId) {
  const folder = skillId.replace("atlas.", "atlas-").replaceAll(".", "-");
  return JSON.parse(await readFile(path.join(skillDirectory, folder, "atlas-skill.json"), "utf8"));
}

async function invokeSkill(skillId, input, execute, context) {
  const manifest = await loadSkill(skillId);
  const validateInput = context.ajv.compile(manifest.inputSchema);
  if (!validateInput(input)) throw new Error(`${skillId} rejected input: ${context.ajv.errorsText(validateInput.errors)}`);
  const response = execute(manifest);
  if (process.env.GOLDEN_FIXTURE_TEST_FAIL_SCHEMA === skillId) delete response.skillId;
  const validateOutput = context.ajv.compile(manifest.outputSchema);
  if (!validateOutput(response)) throw new Error(`${skillId} rejected output: ${context.ajv.errorsText(validateOutput.errors)}`);
  context.pipeline.push({ skillId, input, response });
  return response;
}

const evidence = (artifacts, artifactId, page, quote) => {
  const artifact = artifacts.find((entry) => entry.artifactId === artifactId);
  const pageText = artifact?.pages.find((entry) => entry.page === page)?.text ?? "";
  const normalized = (value) => value.replace(/\s+/g, " ").trim();
  if (!normalized(pageText).includes(normalized(quote))) throw new Error(`Evidence quote not found: ${artifactId} p.${page}`);
  return { artifactId, page, quote };
};

function validate(bundle) {
  const { repository, projections } = bundle;
  const revisions = new Map(repository.revisions.map((entry) => [entry.revisionId, entry]));
  const assertions = new Map(repository.assertions.map((entry) => [entry.assertionId, entry]));
  for (const branch of repository.branches) {
    if (!revisions.has(branch.headRevisionId)) throw new Error(`${branch.branchId} HEAD is unresolved`);
    const state = repository.materializedStates.find((entry) => entry.branchId === branch.branchId && entry.headRevisionId === branch.headRevisionId);
    if (!state) throw new Error(`${branch.branchId} has no HEAD-keyed materialized state`);
    for (const assertionId of state.state.assertionIds) if (!assertions.has(assertionId)) throw new Error(`Unresolved assertion ${assertionId}`);
  }
  for (const revision of repository.revisions) for (const parentId of revision.parentRevisionIds) if (!revisions.has(parentId)) throw new Error(`Unresolved parent ${parentId}`);
  for (const proposal of repository.changeProposals) {
    if (!revisions.has(proposal.baseRevisionId)) throw new Error(`Unresolved proposal base ${proposal.baseRevisionId}`);
    const branch = repository.branches.find((entry) => entry.branchId === proposal.branchId);
    if (proposal.status === "staged" && branch.headRevisionId !== proposal.baseRevisionId) throw new Error("Staged proposal silently changed HEAD");
  }
  for (const projection of projections) {
    const branch = repository.branches.find((entry) => entry.branchId === projection.branchId);
    if (!branch || branch.headRevisionId !== projection.headRevisionId) throw new Error(`Projection ${projection.branchId} is not keyed to its HEAD`);
    for (const surface of projection.surfaces) if (surface.branchId !== projection.branchId || surface.headRevisionId !== projection.headRevisionId) throw new Error(`Surface ${surface.surface} cross-contaminates branch state`);
  }
}

const compactArtifact = ({ pages, ...artifact }) => ({ ...artifact, pageCount: pages.length });
const main = async () => {
  const mode = resolveFixtureAuthoringExecutor(process.env);
  const context = { ajv: new Ajv({ strict: false }), pipeline: [] };
  const artifacts = await Promise.all((await discoverPdfs(prdDirectory)).map(extractArtifact));
  const artifactId = (name) => artifacts.find((artifact) => artifact.name === name)?.artifactId ?? (() => { throw new Error(`Missing discovered PRD ${name}`); })();
  const p1 = evidence(artifacts, artifactId("Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf"), 1, "manifest, dan laporan belum menjadi ruang lingkup increment ini.");
  const p2 = evidence(artifacts, artifactId("Safara_Incremental_PRD_02_Payment_Documents_Readiness.pdf"), 3, "Semua alasan yang menghambat kesiapan harus ditampilkan bersamaan.");
  const p3 = evidence(artifacts, artifactId("Safara_Incremental_PRD_03_Manifest_Reporting_Audit.pdf"), 2, "Hanya jemaah berstatus Siap yang dapat dimasukkan ke manifest final.");
  const p3Snapshot = evidence(artifacts, artifactId("Safara_Incremental_PRD_03_Manifest_Reporting_Audit.pdf"), 2, "Setelah difinalisasi, isi manifest tidak berubah otomatis walaupun data jemaah kemudian diperbarui.");
  const assertions = [
    { assertionId: "ast-manifest-out-of-scope", semanticKey: "manifest.eligibility", value: { status: "out_of_scope" }, evidence: p1, status: "accepted" },
    { assertionId: "ast-readiness-blockers", semanticKey: "readiness.blocker-display", value: { mode: "all_blockers" }, evidence: p2, status: "accepted" },
    { assertionId: "ast-manifest-ready-only", semanticKey: "manifest.eligibility", value: { allowedReadiness: "Siap" }, evidence: p3, status: "accepted", supersedesAssertionId: "ast-manifest-out-of-scope" },
    { assertionId: "ast-manifest-snapshot", semanticKey: "manifest.finalization", value: { snapshot: true }, evidence: p3Snapshot, status: "accepted" },
  ];
  const repository = {
    projectId: "safara", schemaVersion: "1.0", artifacts: artifacts.map(compactArtifact), assertions,
    revisions: [
      { revisionId: "rev-safara-master-001", parentRevisionIds: [], acceptedAssertionIds: ["ast-manifest-out-of-scope", "ast-readiness-blockers"], executionProvenance: provenance("atlas.fixture-repository", mode) },
      { revisionId: "rev-safara-increment-003", parentRevisionIds: ["rev-safara-master-001"], acceptedAssertionIds: ["ast-manifest-ready-only", "ast-manifest-snapshot"], executionProvenance: provenance("atlas.fixture-repository", mode) },
    ],
    branches: [
      { branchId: "branch-master", label: "Master", headRevisionId: "rev-safara-master-001" },
      { branchId: "branch-increment-003", label: "Increment 03", headRevisionId: "rev-safara-increment-003" },
    ],
    materializedStates: [
      { branchId: "branch-master", headRevisionId: "rev-safara-master-001", state: { assertionIds: ["ast-manifest-out-of-scope", "ast-readiness-blockers"], resolvedFacts: [{ semanticKey: "manifest.eligibility", assertionId: "ast-manifest-out-of-scope", value: { status: "out_of_scope" } }] } },
      { branchId: "branch-increment-003", headRevisionId: "rev-safara-increment-003", state: { assertionIds: ["ast-manifest-ready-only", "ast-manifest-snapshot", "ast-readiness-blockers"], resolvedFacts: [{ semanticKey: "manifest.eligibility", assertionId: "ast-manifest-ready-only", value: { allowedReadiness: "Siap" } }] } },
    ],
    changeProposals: [{ proposalId: "proposal-manifest-staged-correction", branchId: "branch-increment-003", baseRevisionId: "rev-safara-increment-003", targetSemanticKey: "manifest.eligibility", beforeValue: { allowedReadiness: "Siap" }, proposedValue: { allowedReadiness: "Siap", exception: "manual_override" }, provenance: p3, status: "staged", resolution: null }],
    dependencies: [{ fromId: "ast-manifest-ready-only", toId: "workflow-manifest" }, { fromId: "ast-manifest-ready-only", toId: "ces-manifest" }, { fromId: "ast-manifest-ready-only", toId: "chatbot-manifest" }],
  };
  const projectionFor = (branchId) => {
    const state = repository.materializedStates.find((entry) => entry.branchId === branchId);
    const eligibility = state.state.resolvedFacts.find((entry) => entry.semanticKey === "manifest.eligibility");
    return { branchId, headRevisionId: state.headRevisionId, surfaces: ["workflow", "facts", "ces", "chatbot_context"].map((surface) => ({ surface, branchId, headRevisionId: state.headRevisionId, records: [{ recordId: `${surface}-manifest`, assertionIds: [eligibility.assertionId], dependencyIds: repository.dependencies.filter((entry) => entry.fromId === eligibility.assertionId).map((entry) => entry.toId), resolvedValue: eligibility.value }] })) };
  };
  const projections = repository.branches.map((branch) => projectionFor(branch.branchId));
  const extractionResponses = await Promise.all(artifacts.map((artifact) => invokeSkill("atlas.prd-extraction", { artifact: { artifactId: artifact.artifactId, type: "prd", name: artifact.name }, pages: artifact.pages }, () => ({ skillId: "atlas.prd-extraction", skillVersion: "1.1.0", executionProvenance: provenance("atlas.prd-extraction", mode), status: "complete", candidateAssertions: assertions.filter((assertion) => assertion.evidence.artifactId === artifact.artifactId).map((assertion) => ({ candidateId: `candidate-${assertion.assertionId}`, kind: "constraint", semanticKey: assertion.semanticKey, payload: assertion.value, possibleAffectedSemanticKey: assertion.semanticKey, evidence: assertion.evidence })), unaccountedStatements: [], questions: [] }), context)));
  const repositoryResponse = await invokeSkill("atlas.fixture-repository", { projectId: "safara", sourceArtifacts: artifacts.map(compactArtifact), requestedScenario: "Master and Increment 03 manifest truth" }, () => ({ skillId: "atlas.fixture-repository", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-repository", mode), status: "complete", repositoryCandidate: repository, issues: [] }), context);
  const proposal = repository.changeProposals[0];
  const changesResponse = await invokeSkill("atlas.fixture-changes", { inputKind: "user_correction", branch: { branchId: proposal.branchId, headRevisionId: proposal.baseRevisionId }, baseRevision: { revisionId: proposal.baseRevisionId }, currentState: repository.materializedStates.find((state) => state.branchId === proposal.branchId), incomingInformation: proposal.proposedValue, sourceArtifacts: artifacts.map(compactArtifact) }, () => ({ skillId: "atlas.fixture-changes", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-changes", mode), status: "complete", changeProposal: proposal, questions: [] }), context);
  const projectionResponses = await Promise.all(projections.map((projection) => invokeSkill("atlas.fixture-projections", { branch: { branchId: projection.branchId, headRevisionId: projection.headRevisionId }, headRevision: { revisionId: projection.headRevisionId }, resolvedFacts: repository.materializedStates.find((state) => state.branchId === projection.branchId).state.resolvedFacts, dependencies: repository.dependencies, requestedSurfaces: ["workflow", "facts", "ces", "chatbot_context"] }, () => ({ skillId: "atlas.fixture-projections", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-projections", mode), status: "complete", projectionCandidate: projection, issues: [] }), context)));
  validate({ repository, projections });
  await invokeSkill("atlas.fixture-verification", { repository, projections: projections[0], checks: ["topology", "provenance", "branch-isolation"] }, () => ({ skillId: "atlas.fixture-verification", skillVersion: "1.1.0", executionProvenance: provenance("atlas.fixture-verification", mode), status: "pass", checks: [{ checkId: "deterministic-gates", status: "pass", detail: "Evidence, topology, provenance, and branch isolation resolve.", evidence: [{ kind: "deterministic-validation", reference: "validate(bundle)" }] }] }), context);
  const bundle = { bundleVersion: "1.0", generatedAt: "2026-09-05T00:00:00.000Z", executionMode: mode, pipeline: context.pipeline, skillResponses: { extractionResponses, repositoryResponse, changesResponse, projectionResponses }, repository, projections };
  validate(bundle);
  await mkdir(outputDirectory, { recursive: true });
  const temporaryFile = `${outputFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(bundle, null, 2)}\n`);
  await rename(temporaryFile, outputFile);
  console.log(`Generated and validated ${path.relative(root, outputFile)}`);
};
main().catch((error) => { console.error(error); process.exitCode = 1; });
