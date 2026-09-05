import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const prdDirectory = path.join(root, "docs", "PRD");
const outputDirectory = path.join(root, "packages", "atlas-fixtures", "generated");
const outputFile = path.join(outputDirectory, "safara-golden-bundle.json");
const files = [
  ["artifact-safara-01", "Safara/Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf"],
  ["artifact-safara-02", "Safara/Safara_Incremental_PRD_02_Payment_Documents_Readiness.pdf"],
  ["artifact-safara-03", "Safara/Safara_Incremental_PRD_03_Manifest_Reporting_Audit.pdf"],
];

const provenance = (skillId) => ({ skillId, skillVersion: "1.1.0", mode: process.env.SKILLS_MODE ?? "codex" });
const execution = (stage, input, output) => ({ stage, input, output, executionProvenance: provenance(stage === "extract" ? "atlas.prd-extraction" : `atlas.fixture-${stage}`) });

async function extractArtifact([artifactId, relativePath]) {
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
  const artifacts = await Promise.all(files.map(extractArtifact));
  const p1 = evidence(artifacts, "artifact-safara-01", 1, "manifest, dan laporan belum menjadi ruang lingkup increment ini.");
  const p2 = evidence(artifacts, "artifact-safara-02", 3, "Semua alasan yang menghambat kesiapan harus ditampilkan bersamaan.");
  const p3 = evidence(artifacts, "artifact-safara-03", 2, "Hanya jemaah berstatus Siap yang dapat dimasukkan ke manifest final.");
  const p3Snapshot = evidence(artifacts, "artifact-safara-03", 2, "Setelah difinalisasi, isi manifest tidak berubah otomatis walaupun data jemaah kemudian diperbarui.");
  const assertions = [
    { assertionId: "ast-manifest-out-of-scope", semanticKey: "manifest.eligibility", value: { status: "out_of_scope" }, evidence: p1, status: "accepted" },
    { assertionId: "ast-readiness-blockers", semanticKey: "readiness.blocker-display", value: { mode: "all_blockers" }, evidence: p2, status: "accepted" },
    { assertionId: "ast-manifest-ready-only", semanticKey: "manifest.eligibility", value: { allowedReadiness: "Siap" }, evidence: p3, status: "accepted", supersedesAssertionId: "ast-manifest-out-of-scope" },
    { assertionId: "ast-manifest-snapshot", semanticKey: "manifest.finalization", value: { snapshot: true }, evidence: p3Snapshot, status: "accepted" },
  ];
  const repository = {
    projectId: "safara", schemaVersion: "1.0", artifacts: artifacts.map(compactArtifact), assertions,
    revisions: [
      { revisionId: "rev-safara-master-001", parentRevisionIds: [], acceptedAssertionIds: ["ast-manifest-out-of-scope", "ast-readiness-blockers"], executionProvenance: provenance("atlas.fixture-repository") },
      { revisionId: "rev-safara-increment-003", parentRevisionIds: ["rev-safara-master-001"], acceptedAssertionIds: ["ast-manifest-ready-only", "ast-manifest-snapshot"], executionProvenance: provenance("atlas.fixture-repository") },
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
  const bundle = { bundleVersion: "1.0", generatedAt: "2026-09-05T00:00:00.000Z", executionMode: process.env.SKILLS_MODE ?? "codex", pipeline: [execution("extract", { sourceDirectory: "docs/PRD" }, { artifactCount: artifacts.length }), execution("repository", { artifactCount: artifacts.length }, { revisionCount: repository.revisions.length }), execution("changes", { branchId: "branch-increment-003" }, { proposalId: repository.changeProposals[0].proposalId }), execution("projections", { branches: repository.branches.map((entry) => entry.branchId) }, { projectionCount: projections.length }), execution("verification", { repository: "safara" }, { status: "pass" })], repository, projections };
  validate(bundle);
  await mkdir(outputDirectory, { recursive: true });
  const temporaryFile = `${outputFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(bundle, null, 2)}\n`);
  await rename(temporaryFile, outputFile);
  console.log(`Generated and validated ${path.relative(root, outputFile)}`);
};
main().catch((error) => { console.error(error); process.exitCode = 1; });
