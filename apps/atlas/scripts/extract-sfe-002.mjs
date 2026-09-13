import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "../../..");
const projectId = "safara-project-01";
const workspaceId = "saf-24aysgyw4su6";
const fileName = "Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf";
const sourcePath = path.join(root, "docs", "PRD", projectId, workspaceId, fileName);
const outputPath = path.join(root, "packages", "atlas-fixtures", "generated", "sfe-002-saf-24aysgyw4su6.json");
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
const statements = pages.flatMap(({ page, text }) => splitStatements(text).map((quote, index) => ({ page, quote, index })));
const candidateAssertions = statements.map(({ page, quote, index }) => {
  const candidateId = `candidate-${workspaceId}-p${String(page).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`;
  const workflow = /admin|jemaah|pendaftaran|keberangkatan|paket/i.test(quote);
  const related = statements.filter((item) => item.page === page && item.index !== index && /admin|jemaah|pendaftaran|keberangkatan|paket/i.test(item.quote)).slice(0, 5);
  const normalized = { sourceStatement: quote, assertionType: workflow ? "workflow_step_or_constraint" : "requirement", actors: /admin/i.test(quote) ? ["Admin"] : [], conditions: /jika|apabila|tidak boleh|hanya/i.test(quote) ? [quote] : [], constraints: /tidak boleh|wajib|harus/i.test(quote) ? [quote] : [], proposalStatus: "candidate_only" };
  return { candidateId, kind: workflow ? "workflow" : "requirement", semanticKey: `safara.increment-01.page-${page}.statement-${index + 1}`, payload: workflow ? { ...normalized, triggers: [], orderedSteps: [quote], branches: [], inputs: [], outputs: [], dependencies: [], stateTransitions: [], exceptions: [] } : normalized, relationships: related.map((item) => `candidate-${workspaceId}-p${String(item.page).padStart(2, "0")}-${String(item.index + 1).padStart(3, "0")}`), evidence: { artifactId, page, quote } };
});
const sourceStatementInventory = [
  ...statements.map(({ page, quote, index }, position) => ({ inventoryId: `inventory-${workspaceId}-${String(position + 1).padStart(3, "0")}`, artifactId, page, quote, classification: "material", normalizedInterpretation: candidateAssertions[position].payload, destination: { type: "candidate_assertion", candidateId: candidateAssertions[position].candidateId } })),
  ...pages.filter((page) => !page.text).map((page) => ({ inventoryId: `inventory-${workspaceId}-empty-${String(page.page).padStart(2, "0")}`, artifactId, page: page.page, quote: "", classification: "empty_page", normalizedInterpretation: { reason: "The source PDF page contains no extractable text." }, destination: { type: "non_fact", reason: "Empty source page." } })),
];
const result = { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", executionProvenance: { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", mode: "codex" }, status: "complete", executionId: `exec-${workspaceId}-prd-01`, mode: "codex", artifact, pages, candidateAssertions, sourceStatementInventory, questions: [] };
const contract = JSON.parse(await readFile(path.join(root, ".agents", "skills", "atlas-prd-extraction", "atlas-skill.json"), "utf8"));
const validate = new Ajv({ strict: false }).compile(contract.outputSchema);
if (!validate(result)) throw new Error(`Extraction result violates atlas.prd-extraction: ${JSON.stringify(validate.errors)}`);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted ${candidateAssertions.length} candidate assertions from ${pages.length} pages to ${outputPath}`);
