import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "..");
const sourceRoot = path.join(workspaceRoot, "docs", "PRD");
const publicRoot = path.join(workspaceRoot, "apps", "atlas", "public", "source-pdfs");
const generatedFile = path.join(workspaceRoot, "apps", "atlas", "generated", "sourceDocuments.ts");
const pdfModulePath = path.join(workspaceRoot, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs");
const workerSource = path.join(workspaceRoot, "apps", "atlas", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
const workerDestination = path.join(workspaceRoot, "apps", "atlas", "public", "pdfjs", "pdf.worker.mjs");
const { getDocument } = await import(pathToFileURL(pdfModulePath).href);

async function pdfFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  return (await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pdfFiles(filePath);
    return entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf" ? [filePath] : [];
  }))).flat();
}

const documents = await Promise.all((await pdfFiles(sourceRoot)).map(async (sourcePath) => {
  const relativePath = path.relative(sourceRoot, sourcePath).split(path.sep).join("/");
  const bytes = new Uint8Array(await readFile(sourcePath));
  const task = getDocument({ data: bytes });
  const pdf = await task.promise;
  const pageCount = pdf.numPages;
  await task.destroy();
  return { fileName: path.basename(sourcePath), relativePath, lastModified: (await stat(sourcePath)).mtime.toISOString(), pageCount, url: `/source-pdfs/${relativePath.split("/").map(encodeURIComponent).join("/")}` };
}));
documents.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

await rm(publicRoot, { force: true, recursive: true });
await mkdir(publicRoot, { recursive: true });
await Promise.all(documents.map(async (document) => { const target = path.join(publicRoot, ...document.relativePath.split("/")); await mkdir(path.dirname(target), { recursive: true }); await copyFile(path.join(sourceRoot, ...document.relativePath.split("/")), target); }));
await mkdir(path.dirname(workerDestination), { recursive: true });
await copyFile(workerSource, workerDestination);
await mkdir(path.dirname(generatedFile), { recursive: true });
await writeFile(generatedFile, `/* Generated from docs/PRD by scripts/sync-prd-pdfs.mjs. Do not edit manually. */\n\nexport type SourceDocument = { fileName: string; relativePath: string; lastModified: string; pageCount: number; url: string };\n\nexport const sourceDocuments: SourceDocument[] = ${JSON.stringify(documents, null, 2)};\n`);
