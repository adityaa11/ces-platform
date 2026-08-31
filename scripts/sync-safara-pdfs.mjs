import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(workspaceRoot, "docs", "PRD", "Safara");
const publicDirectory = path.join(workspaceRoot, "apps", "atlas", "public", "source-pdfs", "Safara");
const generatedDirectory = path.join(workspaceRoot, "apps", "atlas", "generated");
const generatedFile = path.join(generatedDirectory, "safaraDocuments.ts");
const pdfModulePath = path.join(workspaceRoot, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs");
const workerSource = path.join(workspaceRoot, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
const workerDestination = path.join(workspaceRoot, "apps", "atlas", "public", "pdfjs", "pdf.worker.mjs");

const { getDocument } = await import(pathToFileURL(pdfModulePath).href);
const directoryEntries = await readdir(sourceDirectory, { withFileTypes: true });
const sourceFiles = directoryEntries.filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf");

if (!sourceFiles.length) throw new Error(`No PDF files found in ${sourceDirectory}`);

const documents = await Promise.all(sourceFiles.map(async ({ name }) => {
  const sourcePath = path.join(sourceDirectory, name);
  const details = await stat(sourcePath);
  const bytes = new Uint8Array(await readFile(sourcePath));
  const loadingTask = getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  await loadingTask.destroy();
  return {
    fileName: name,
    lastModified: details.mtime.toISOString(),
    pageCount,
    url: `/source-pdfs/Safara/${encodeURIComponent(name)}`,
  };
}));

documents.sort((left, right) => left.lastModified.localeCompare(right.lastModified) || left.fileName.localeCompare(right.fileName));

await rm(publicDirectory, { force: true, recursive: true });
await mkdir(publicDirectory, { recursive: true });
await Promise.all(documents.map(({ fileName }) => copyFile(path.join(sourceDirectory, fileName), path.join(publicDirectory, fileName))));
await mkdir(path.dirname(workerDestination), { recursive: true });
await copyFile(workerSource, workerDestination);

await mkdir(generatedDirectory, { recursive: true });
await writeFile(generatedFile, `/* Generated from docs/PRD/Safara by scripts/sync-safara-pdfs.mjs. Do not edit manually. */\n\nexport type SafaraSourceDocument = { fileName: string; lastModified: string; pageCount: number; url: string };\n\nexport const safaraSourceDocuments: SafaraSourceDocument[] = ${JSON.stringify(documents, null, 2)};\n`);
