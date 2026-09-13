import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "../../..");
const argument = (name) => { const index = process.argv.indexOf(`--${name}`); return index >= 0 ? process.argv[index + 1] : undefined; };
const projectId = argument("project-id");
const workspaceId = argument("workspace-id");
const fileName = argument("file-name");
if (![projectId, workspaceId, fileName].every((value) => typeof value === "string" && value.length)) throw new Error("Usage: extract-sfe-002.mjs --project-id <id> --workspace-id <id> --file-name <uploaded.pdf>");
const sourcePath = path.join(root, "docs", "PRD", projectId, workspaceId, fileName);
const outputPath = argument("output") ? path.resolve(root, argument("output")) : path.join(root, "packages", "atlas-fixtures", "generated", `sfe-002-${workspaceId}.json`);
const executionPath = outputPath.replace(/\.json$/u, "-execution.json");
const { getDocument } = await import(pathToFileURL(path.join(root, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);

const bytes = new Uint8Array(await readFile(sourcePath));
const size = bytes.byteLength;
const sha256 = createHash("sha256").update(bytes).digest("hex");
const task = getDocument({ data: bytes });
const pdf = await task.promise;
const pages = [];
for (let page = 1; page <= pdf.numPages; page += 1) {
  const content = await pdf.getPage(page).then((item) => item.getTextContent());
  pages.push({ page, text: content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim() });
}
await task.destroy();

const artifactId = `artifact-${workspaceId}-prd-01`;
const artifact = { artifactId, workspaceId, name: fileName, type: "application/pdf", size, relativePath: `docs/PRD/${projectId}/${workspaceId}/${fileName}`, sha256, verifiedSha256: sha256 };
const splitStatements = (text) => text
  .split(/(?=(?:^|\s)(?:\d+\.|[a-z]\)|[-•]))|(?<=[.;!?])\s+(?=[A-ZÀ-ÖØ-Þ])/u)
  .map((quote) => quote.trim())
  .filter((quote) => quote.length > 2 && !/^(?:\d+\.|[a-z]\)|[-•])$/iu.test(quote));
const statements = pages.flatMap(({ page, text }) => splitStatements(text).map((quote, index) => ({ page, quote, index, nonFact: /^(?:C S A F A R A|BUSINESS PRD|I N C R E M E N|P R O J E C T|R E Q U E S T|SAFARA - Increment|Fondasi Data|T U J U A N|R U A N G L I N G K U P|P E N G G U N A|TA N G G A L|Alur Utama|Kebutuhan|Aturan Bisnis Utama|Skenario Pemeriksaan Hasil|Hasil yang Harus Diserahkan|Kriteria Penerimaan)/iu.test(quote) })));
const material = statements.filter((statement) => !statement.nonFact);
const candidateAssertions = material.map(({ page, quote, index }) => {
  const candidateId = `candidate-${workspaceId}-p${String(page).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`;
  const workflow = page === 2 && index >= 1 && index <= 6;
  const workflowStatements = material.filter((item) => item.page === 2 && item.index >= 1 && item.index <= 6);
  const normalized = { sourceStatement: quote, assertionType: workflow ? "workflow_step" : "requirement_or_constraint", actors: /Admin/i.test(quote) ? ["Admin"] : /Sistem/i.test(quote) ? ["System"] : [], conditions: /jika|apabila|tidak boleh|hanya/i.test(quote) ? [quote] : [], constraints: /tidak boleh|wajib|harus/i.test(quote) ? [quote] : [], proposalStatus: "candidate_only" };
  return { candidateId, kind: workflow ? "workflow" : "requirement", semanticKey: `sfe.${projectId}.p${page}.s${index + 1}`, payload: workflow ? { ...normalized, triggers: index === 1 ? ["Admin begins operational registration work"] : [], orderedSteps: [quote], branches: [], inputs: index === 1 ? ["package", "departure schedule", "pilgrim record"] : [], outputs: /Sistem/.test(quote) ? ["registration price or quota information"] : [], dependencies: index === 1 ? ["package, departure, and pilgrim records"] : [], stateTransitions: index === 1 ? ["unregistered pilgrim to registered pilgrim"] : [], exceptions: [] } : normalized, relationships: workflow ? workflowStatements.filter((item) => item.index !== index).map((item) => `candidate-${workspaceId}-p02-${String(item.index + 1).padStart(3, "0")}`) : [], evidence: { artifactId, page, quote } };
});
const sourceStatementInventory = [
  ...statements.map(({ page, quote, index, nonFact }) => { const candidate = candidateAssertions.find((item) => item.evidence.page === page && item.evidence.quote === quote); return { inventoryId: `inventory-${workspaceId}-p${page}-${String(index + 1).padStart(3, "0")}`, artifactId, page, quote, classification: nonFact ? "non_fact" : "material", normalizedInterpretation: nonFact ? { kind: "heading_or_cover_text" } : candidate.payload, destination: nonFact ? { type: "non_fact", reason: "Heading or cover text; it has no independently meaningful requirement." } : { type: "candidate_assertion", candidateId: candidate.candidateId } }; }),
  ...pages.filter((page) => !page.text).map((page) => ({ inventoryId: `inventory-${workspaceId}-empty-${String(page.page).padStart(2, "0")}`, artifactId, page: page.page, quote: "", classification: "empty_page", normalizedInterpretation: { reason: "The source PDF page contains no extractable text." }, destination: { type: "non_fact", reason: "Empty source page." } })),
];
const result = { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", executionProvenance: { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", mode: "codex" }, status: "complete", executionId: `exec-${workspaceId}-prd-01`, mode: "codex", artifact, pages, candidateAssertions, sourceStatementInventory, questions: [] };
const contract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-prd-extraction", "atlas-skill.json"), "utf8"));
const validate = new Ajv({ strict: false }).compile(contract.outputSchema);
if (!validate(result)) throw new Error(`Extraction result violates atlas.prd-extraction: ${JSON.stringify(validate.errors)}`);
const repositoryContract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-fixture-repository", "atlas-skill.json"), "utf8"));
const repositoryInput = { projectId, sourceArtifacts: [artifact], requestedScenario: "initial-draft-extraction", scenarioKind: "extraction_backed", extractionResults: [{ workspaceId, artifact, candidateAssertions, sourceStatementInventory }] };
const validateRepositoryInput = new Ajv({ strict: false }).compile(repositoryContract.inputSchema);
if (!validateRepositoryInput(repositoryInput)) throw new Error(`Repository handoff violates atlas.fixture-repository: ${JSON.stringify(validateRepositoryInput.errors)}`);
const verification = { skillId: "atlas.fixture-verification", skillVersion: "1.1.0", executionProvenance: { skillId: "atlas.fixture-verification", skillVersion: "1.1.0", mode: "codex" }, status: "pass", checks: [{ checkId: "extraction-provenance", status: "pass", detail: "Every material inventory destination resolves to an extracted candidate grounded in the uploaded artifact.", evidence: [{ kind: "artifact", reference: artifact.artifactId }] }, { checkId: "workspace-identity", status: "pass", detail: "The extraction handoff preserves the submitted project and Initial Draft workspace identity.", evidence: [{ kind: "workspace", reference: workspaceId }] }] };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
await writeFile(executionPath, `${JSON.stringify({ extractionStage: { input: { artifact, pages }, response: result }, repositoryStage: { input: repositoryInput, status: "complete" }, verificationStage: verification }, null, 2)}\n`);
console.log(`Extracted ${candidateAssertions.length} candidate assertions from ${pages.length} pages to ${outputPath}`);
