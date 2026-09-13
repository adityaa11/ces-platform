import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const statements = pages.flatMap(({ page, text }) => text.split(/(?<=[.!?])\s+/).map((quote) => quote.trim()).filter(Boolean).map((quote, index) => ({ page, quote, index })));
const candidateAssertions = statements.map(({ page, quote, index }) => {
  const candidateId = `candidate-${workspaceId}-p${String(page).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`;
  const workflow = page === 2 && index === 0;
  return { candidateId, kind: workflow ? "workflow" : "requirement", semanticKey: workflow ? "safara.increment-01.registration-flow" : `safara.increment-01.page-${page}.statement-${index + 1}`, payload: workflow ? { actors: ["Admin", "System"], triggers: ["Operational registration work begins"], orderedSteps: statements.filter((item) => item.page === 2).slice(0, 6).map((item) => item.quote), conditions: ["The selected departure remains open."], branches: ["Registration is unavailable when the schedule is closed or capacity is full."], inputs: ["package", "departure schedule", "pilgrim record"], outputs: ["registration", "agreed registration price", "remaining quota"], dependencies: ["package and departure maintenance", "pilgrim data"], stateTransitions: ["draft data to active registration"], exceptions: ["closed departure", "full quota"], sourceStatement: quote } : { sourceStatement: quote, interpretation: "Candidate proposal extracted from the uploaded PRD; not accepted project truth." }, relationships: workflow ? statements.filter((item) => item.page === 2).slice(1, 6).map((item) => `candidate-${workspaceId}-p02-${String(item.index + 1).padStart(3, "0")}`) : [], evidence: { artifactId, page, quote } };
});
const sourceStatementInventory = statements.map(({ page, quote, index }, position) => ({ inventoryId: `inventory-${workspaceId}-${String(position + 1).padStart(3, "0")}`, artifactId, page, quote, classification: "material", normalizedInterpretation: { sourceStatement: quote }, destination: { type: "candidate_assertion", candidateId: candidateAssertions[position].candidateId } }));
const result = { executionId: `exec-${workspaceId}-prd-01`, mode: "codex", artifact, pages, candidateAssertions, sourceStatementInventory, questions: [] };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted ${candidateAssertions.length} candidate assertions from ${pages.length} pages to ${outputPath}`);
