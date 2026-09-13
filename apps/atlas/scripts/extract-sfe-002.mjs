import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "../../..");
const argument = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const projectId = argument("project-id");
const workspaceId = argument("workspace-id");
const fileName = argument("file-name");
const responsePath = argument("response");
const repositoryResponsePath = argument("repository-response");
const verificationResponsePath = argument("verification-response");
const outputPath = argument("output");
if (![projectId, workspaceId, fileName, responsePath, repositoryResponsePath, verificationResponsePath].every((value) => typeof value === "string" && value.length)) {
  throw new Error("Usage: extract-sfe-002.mjs --project-id <id> --workspace-id <id> --file-name <uploaded.pdf> --response <atlas.prd-extraction-response.json> --repository-response <atlas.fixture-repository-response.json> --verification-response <atlas.fixture-verification-response.json> [--output <pipeline.json>]");
}

const sourcePath = path.join(root, "docs", "PRD", projectId, workspaceId, fileName);
const bytes = new Uint8Array(await readFile(sourcePath));
const sha256 = createHash("sha256").update(bytes).digest("hex");
const { getDocument } = await import(pathToFileURL(path.join(root, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
const task = getDocument({ data: bytes });
const pdf = await task.promise;
const pages = [];
for (let page = 1; page <= pdf.numPages; page += 1) {
  const content = await pdf.getPage(page).then((item) => item.getTextContent());
  pages.push({ page, text: content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim() });
}
await task.destroy();

const response = JSON.parse(await readFile(path.resolve(root, responsePath), "utf8"));
const repositoryResponse = JSON.parse(await readFile(path.resolve(root, repositoryResponsePath), "utf8"));
const verification = JSON.parse(await readFile(path.resolve(root, verificationResponsePath), "utf8"));
const extractionContract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-prd-extraction", "atlas-skill.json"), "utf8"));
const repositoryContract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-fixture-repository", "atlas-skill.json"), "utf8"));
const verificationContract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-fixture-verification", "atlas-skill.json"), "utf8"));
const ajv = new Ajv({ strict: false });
const validateExtraction = ajv.compile(extractionContract.outputSchema);
if (!validateExtraction(response)) throw new Error(`Extraction response violates atlas.prd-extraction: ${ajv.errorsText(validateExtraction.errors)}`);

const expectedPath = `docs/PRD/${projectId}/${workspaceId}/${fileName}`;
if (response.status !== "complete" || !["codex", "agents_bridge"].includes(response.mode) || response.executionProvenance?.mode !== response.mode) throw new Error("A completed extraction response with declared execution provenance is required.");
if (response.artifact?.workspaceId !== workspaceId || response.artifact?.name !== fileName || response.artifact?.relativePath !== expectedPath || response.artifact?.sha256?.toLowerCase() !== sha256 || response.artifact?.verifiedSha256?.toLowerCase() !== sha256) throw new Error("Extraction response artifact does not identify the exact stored workspace PDF.");
if (response.pages.length !== pages.length || response.pages.some((page, index) => page.page !== index + 1)) throw new Error("Extraction response does not account for every stored PDF page.");
const normalized = (value) => value.replace(/\s+/g, " ").trim();
const pageText = new Map(pages.map((page) => [page.page, normalized(page.text)]));
for (const record of [...response.candidateAssertions, ...response.sourceStatementInventory]) {
  const evidence = "evidence" in record ? record.evidence : record;
  if (evidence.quote && !pageText.get(evidence.page)?.includes(normalized(evidence.quote))) throw new Error(`Extraction response record ${record.candidateId ?? record.inventoryId} is not grounded in stored PDF page ${evidence.page}.`);
}

const repositoryInput = {
  projectId,
  sourceArtifacts: [response.artifact],
  requestedScenario: "initial-draft-extraction",
  scenarioKind: "extraction_backed",
  extractionResults: [{
    workspaceId,
    artifact: response.artifact,
    candidateAssertions: response.candidateAssertions,
    sourceStatementInventory: response.sourceStatementInventory,
  }],
};
const validateRepositoryInput = ajv.compile(repositoryContract.inputSchema);
if (!validateRepositoryInput(repositoryInput)) throw new Error(`Repository handoff violates atlas.fixture-repository: ${ajv.errorsText(validateRepositoryInput.errors)}`);
const validateRepositoryResponse = ajv.compile(repositoryContract.outputSchema);
if (!validateRepositoryResponse(repositoryResponse)) throw new Error(`Repository response violates atlas.fixture-repository: ${ajv.errorsText(validateRepositoryResponse.errors)}`);
if (repositoryResponse.status !== "complete" || repositoryResponse.executionProvenance?.mode !== response.mode) throw new Error("A completed repository response with matching execution provenance is required.");

const repository = repositoryResponse.repositoryCandidate;
const candidateWorkspace = repository.candidateWorkspace;
const candidateIds = response.candidateAssertions.map((candidate) => candidate.candidateId);
const inventoryIds = response.sourceStatementInventory.map((entry) => entry.inventoryId);
if (candidateWorkspace?.workspaceId !== workspaceId || candidateWorkspace.extractionExecutionId !== response.executionId || candidateWorkspace.status !== "awaiting_review" || JSON.stringify(candidateWorkspace.candidateAssertionIds) !== JSON.stringify(candidateIds) || JSON.stringify(candidateWorkspace.sourceStatementInventoryIds) !== JSON.stringify(inventoryIds)) throw new Error("Repository response does not preserve the validated extraction handoff.");
const master = repository.branches?.filter((branch) => branch.label === "Master");
if (master?.length !== 1) throw new Error("Repository response must contain exactly one Master branch.");
const masterRevision = repository.revisions?.find((revision) => revision.revisionId === master[0].headRevisionId);
const masterState = repository.materializedStates?.find((state) => state.branchId === master[0].branchId && state.headRevisionId === master[0].headRevisionId);
if (!masterRevision || masterRevision.parentRevisionIds.length || masterRevision.acceptedAssertionIds?.length || !masterState || masterState.state.assertionIds.length) throw new Error("Repository response must preserve an empty Master branch.");

const verificationInput = { repository, projections: { branchId: master[0].branchId, headRevisionId: master[0].headRevisionId, surfaces: [] } };
const validateVerificationInput = ajv.compile(verificationContract.inputSchema);
const validateVerification = ajv.compile(verificationContract.outputSchema);
if (!validateVerificationInput(verificationInput)) throw new Error(`Verification input violates atlas.fixture-verification: ${ajv.errorsText(validateVerificationInput.errors)}`);
if (!validateVerification(verification)) throw new Error(`Verification response violates atlas.fixture-verification: ${ajv.errorsText(validateVerification.errors)}`);
if (verification.status !== "pass" || verification.executionProvenance?.mode !== response.mode || verification.checks.some((check) => check.status !== "pass")) throw new Error("A passing verification response with matching execution provenance is required.");

const pipeline = { extractionResponse: response, repositoryInput, repositoryResponse, verificationInput, verification };
if (outputPath) await writeFile(path.resolve(root, outputPath), `${JSON.stringify(pipeline, null, 2)}\n`);
console.log(`Validated ${response.candidateAssertions.length} extraction candidates plus supplied repository and verification responses for ${workspaceId}.`);
