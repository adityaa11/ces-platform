import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { z } from "zod";

export const SOURCE_INDEX_SCHEMA_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const MarkdownDocumentInputSchema = z
  .object({
    document_id: NonEmptyString,
    path: NonEmptyString,
    content: z.string().min(1),
  })
  .strict();

export const IndexedSourceDocumentSchema = z
  .object({
    document_id: NonEmptyString,
    path: NonEmptyString,
    content_hash: Sha256Schema,
    line_count: z.number().int().positive(),
    content: z.string().min(1),
  })
  .strict();

export const SourceIndexSchema = z
  .object({
    schema_version: z.literal(SOURCE_INDEX_SCHEMA_VERSION),
    documents: z.array(IndexedSourceDocumentSchema).min(1),
  })
  .strict();

export type MarkdownDocumentInput = z.infer<typeof MarkdownDocumentInputSchema>;
export type IndexedSourceDocument = z.infer<typeof IndexedSourceDocumentSchema>;
export type SourceIndex = z.infer<typeof SourceIndexSchema>;

export function ingestMarkdownDocuments(
  inputs: readonly MarkdownDocumentInput[],
): SourceIndex {
  if (inputs.length === 0) throw new Error("At least one Markdown document is required");
  const documents = inputs.map((input) => {
    const parsed = MarkdownDocumentInputSchema.parse(input);
    const path = normalizeSourcePath(parsed.path);
    const content = parsed.content.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
    return IndexedSourceDocumentSchema.parse({
      ...parsed,
      path,
      content,
      content_hash: sha256(content),
      line_count: content.split("\n").length,
    });
  });
  assertUnique(documents.map(({ document_id }) => document_id), "document ID");
  assertUnique(documents.map(({ path }) => path), "document path");
  return SourceIndexSchema.parse({
    schema_version: SOURCE_INDEX_SCHEMA_VERSION,
    documents: documents.sort((left, right) =>
      compareText(left.document_id, right.document_id)),
  });
}

export function sourceContentHash(content: string): string {
  return sha256(content.replaceAll("\r\n", "\n").replaceAll("\r", "\n"));
}

function normalizeSourcePath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  if (
    isAbsolute(path)
    || normalized.startsWith("/")
    || normalized.split("/").includes("..")
  ) {
    throw new Error(`Source path must be workspace-relative: ${path}`);
  }
  if (!normalized.toLowerCase().endsWith(".md")) {
    throw new Error(`Source path must identify a Markdown file: ${path}`);
  }
  return normalized.replace(/^\.\//u, "");
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].sort().join(", ")}`);
  }
}

function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
