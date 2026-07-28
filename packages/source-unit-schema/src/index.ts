import { createHash } from "node:crypto";
import { z } from "zod";

export const SOURCE_UNIT_SCHEMA_VERSION = "1.1.0" as const;
const Text = z.string().trim().min(1);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const SourceKind = z.enum(["markdown_text", "pdf_text", "pdf_ocr"]);

export const NormalizedBoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
}).strict().refine(
  ({ x, y, width, height }) => x + width <= 1 && y + height <= 1,
  "Bounding box exceeds normalized page bounds",
);

export const SourceLocationSchema = z.object({
  line_start: z.number().int().positive(),
  line_end: z.number().int().positive(),
  page_start: z.number().int().positive().optional(),
  page_end: z.number().int().positive().optional(),
}).strict().refine((value) => value.line_end >= value.line_start, "Invalid line range");

export const SourceUnitSchema = z.object({
  schema_version: z.literal(SOURCE_UNIT_SCHEMA_VERSION),
  id: Id,
  document_revision_id: Id,
  kind: z.enum(["heading", "paragraph", "bullet", "numbered_item", "table_row", "caption"]),
  text: Text,
  exact_text: Text,
  location: SourceLocationSchema,
  section_path: z.array(Text),
  parent_id: Id.optional(),
  order: z.number().int().nonnegative(),
  content_hash: Hash,
  exact_content_hash: Hash,
  revision_hash: Hash,
  source_kind: SourceKind,
  ocr_confidence: z.number().min(0).max(1).optional(),
  bounding_box: NormalizedBoundingBoxSchema.optional(),
}).strict();

export const DocumentRevisionSchema = z.object({
  schema_version: z.literal(SOURCE_UNIT_SCHEMA_VERSION),
  id: Id,
  document_id: Id,
  path: Text,
  content_hash: Hash,
  original_content_hash: Hash.optional(),
  revision_hash: Hash,
  parser_id: Id,
  parser_version: Text,
  parser_configuration_hash: Hash,
  line_count: z.number().int().positive(),
}).strict();

export const DocumentStructureSchema = z.object({
  schema_version: z.literal(SOURCE_UNIT_SCHEMA_VERSION),
  document_revision_id: Id,
  roots: z.array(Id),
  children: z.record(Id, z.array(Id)),
}).strict();

export const SectionIndexSchema = z.object({
  schema_version: z.literal(SOURCE_UNIT_SCHEMA_VERSION),
  document_revision_id: Id,
  sections: z.array(z.object({
    heading_unit_id: Id,
    path: z.array(Text).min(1),
    first_unit_order: z.number().int().nonnegative(),
    last_unit_order: z.number().int().nonnegative(),
  }).strict()),
}).strict();

export interface SourceDocumentInput {
  readonly document_id: string;
  readonly path: string;
  readonly content: string;
  readonly original_content_hash?: string;
  readonly parser?: {
    readonly id: string;
    readonly version: string;
    readonly configuration_hash: string;
  };
  readonly source_spans?: readonly {
    readonly line_start: number;
    readonly line_end: number;
    readonly source_kind: z.infer<typeof SourceKind>;
    readonly ocr_confidence?: number;
    readonly bounding_box?: z.input<typeof NormalizedBoundingBoxSchema>;
  }[];
}

export interface SourceArtifacts {
  readonly document_revision: z.infer<typeof DocumentRevisionSchema>;
  readonly document_structure: z.infer<typeof DocumentStructureSchema>;
  readonly section_index: z.infer<typeof SectionIndexSchema>;
  readonly source_units: readonly z.infer<typeof SourceUnitSchema>[];
}

export interface PdfPageSourceProvenance {
  readonly line_start: number;
  readonly line_end: number;
  readonly extraction_method: "native_text" | "ocr";
  readonly confidence?: number;
}

interface Block {
  kind: z.infer<typeof SourceUnitSchema>["kind"];
  text: string;
  exactText: string;
  lineStart: number;
  lineEnd: number;
  headingLevel?: number;
  page?: number;
}

export function sourceSpansFromPdfPages(
  pages: readonly PdfPageSourceProvenance[],
): NonNullable<SourceDocumentInput["source_spans"]> {
  return pages.map((page) => ({
    line_start: page.line_start,
    line_end: page.line_end,
    source_kind: page.extraction_method === "ocr" ? "pdf_ocr" : "pdf_text",
    ...(page.confidence === undefined ? {} : { ocr_confidence: page.confidence }),
  }));
}

export function buildSourceArtifacts(input: SourceDocumentInput): SourceArtifacts {
  const documentId = Id.parse(input.document_id);
  const content = normalizeNewlines(input.content);
  if (content.trim().length === 0) throw new Error("Document content cannot be empty");
  const contentHash = sha256(content);
  const originalContentHash = input.original_content_hash
    ? Hash.parse(input.original_content_hash)
    : undefined;
  const parser = {
    id: Id.parse(input.parser?.id ?? "source-unit-mechanical"),
    version: Text.parse(input.parser?.version ?? "1.0.0"),
    configuration_hash: Hash.parse(
      input.parser?.configuration_hash ?? sha256("default"),
    ),
  };
  const revisionHash = sha256(stableJson({
    content_hash: contentHash,
    original_content_hash: originalContentHash ?? null,
    parser,
  }));
  const revisionId = `${documentId}.rev.${revisionHash.slice(7, 19)}`;
  const blocks = mechanicalBlocks(content);
  if (blocks.length === 0) throw new Error("Document segmentation produced no source units");
  const sourceSpans = parseSourceSpans(input.source_spans ?? [], content.split("\n").length);

  const headings: { level: number; text: string; id: string }[] = [];
  const units = blocks.map((block, order) => {
    if (block.kind === "heading") {
      const level = block.headingLevel ?? 1;
      while (headings.length > 0 && headings.at(-1)!.level >= level) headings.pop();
    }
    const sectionPath = headings.map(({ text }) => text);
    const provenance = provenanceFor(block, sourceSpans);
    const unitRevisionHash = sha256(stableJson({
      document_revision_hash: revisionHash,
      kind: block.kind,
      text: block.text,
      exact_text: block.exactText,
      line_start: block.lineStart,
      line_end: block.lineEnd,
      section_path: block.kind === "heading" ? [...sectionPath, block.text] : sectionPath,
      source_kind: provenance.source_kind,
      ocr_confidence: provenance.ocr_confidence ?? null,
      bounding_box: provenance.bounding_box ?? null,
    }));
    const id = `${documentId}.unit.${String(order + 1).padStart(5, "0")}.${unitRevisionHash.slice(7, 15)}`;
    const parentId = headings.at(-1)?.id;
    const unit = SourceUnitSchema.parse({
      schema_version: SOURCE_UNIT_SCHEMA_VERSION,
      id,
      document_revision_id: revisionId,
      kind: block.kind,
      text: block.text,
      exact_text: block.exactText,
      location: {
        line_start: block.lineStart,
        line_end: block.lineEnd,
        ...(block.page ? { page_start: block.page, page_end: block.page } : {}),
      },
      section_path: block.kind === "heading" ? [...sectionPath, block.text] : sectionPath,
      ...(parentId ? { parent_id: parentId } : {}),
      order,
      content_hash: sha256(block.text),
      exact_content_hash: sha256(block.exactText),
      revision_hash: unitRevisionHash,
      ...provenance,
    });
    if (block.kind === "heading") {
      headings.push({ level: block.headingLevel ?? 1, text: block.text, id });
    }
    return unit;
  });

  validateCoverage(content, blocks);
  const unitIds = new Set(units.map(({ id }) => id));
  for (const unit of units) {
    if (unit.parent_id && !unitIds.has(unit.parent_id)) throw new Error(`Dangling parent: ${unit.id}`);
  }
  const children: Record<string, string[]> = {};
  for (const unit of units) {
    if (!unit.parent_id) continue;
    (children[unit.parent_id] ??= []).push(unit.id);
  }
  const sections = units.filter(({ kind }) => kind === "heading").map((heading) => {
    const descendants = units.filter((unit) =>
      unit.order >= heading.order
      && unit.section_path.slice(0, heading.section_path.length).join("\u0000")
        === heading.section_path.join("\u0000"));
    return {
      heading_unit_id: heading.id,
      path: heading.section_path,
      first_unit_order: heading.order,
      last_unit_order: descendants.at(-1)?.order ?? heading.order,
    };
  });
  return deepFreeze({
    document_revision: DocumentRevisionSchema.parse({
      schema_version: SOURCE_UNIT_SCHEMA_VERSION,
      id: revisionId,
      document_id: documentId,
      path: input.path.replaceAll("\\", "/"),
      content_hash: contentHash,
      ...(originalContentHash ? { original_content_hash: originalContentHash } : {}),
      revision_hash: revisionHash,
      parser_id: parser.id,
      parser_version: parser.version,
      parser_configuration_hash: parser.configuration_hash,
      line_count: content.split("\n").length,
    }),
    document_structure: DocumentStructureSchema.parse({
      schema_version: SOURCE_UNIT_SCHEMA_VERSION,
      document_revision_id: revisionId,
      roots: units.filter(({ parent_id }) => !parent_id).map(({ id }) => id),
      children,
    }),
    section_index: SectionIndexSchema.parse({
      schema_version: SOURCE_UNIT_SCHEMA_VERSION,
      document_revision_id: revisionId,
      sections,
    }),
    source_units: units,
  });
}

type SourceSpan = {
  line_start: number;
  line_end: number;
  source_kind: z.infer<typeof SourceKind>;
  ocr_confidence?: number;
  bounding_box?: z.output<typeof NormalizedBoundingBoxSchema>;
};

function parseSourceSpans(
  spans: NonNullable<SourceDocumentInput["source_spans"]>,
  lineCount: number,
): SourceSpan[] {
  const parsed = spans.map((span) => {
    const result: SourceSpan = {
      line_start: z.number().int().positive().parse(span.line_start),
      line_end: z.number().int().positive().parse(span.line_end),
      source_kind: SourceKind.parse(span.source_kind),
      ...(span.ocr_confidence === undefined
        ? {}
        : { ocr_confidence: z.number().min(0).max(1).parse(span.ocr_confidence) }),
      ...(span.bounding_box
        ? { bounding_box: NormalizedBoundingBoxSchema.parse(span.bounding_box) }
        : {}),
    };
    if (result.line_end < result.line_start || result.line_end > lineCount) {
      throw new Error("Invalid source span line range");
    }
    if (result.source_kind !== "pdf_ocr" && result.ocr_confidence !== undefined) {
      throw new Error("OCR confidence requires pdf_ocr source kind");
    }
    return result;
  }).sort((left, right) => left.line_start - right.line_start);
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index]!.line_start <= parsed[index - 1]!.line_end) {
      throw new Error("Source spans must not overlap");
    }
  }
  return parsed;
}

function provenanceFor(block: Block, spans: readonly SourceSpan[]): {
  source_kind: z.infer<typeof SourceKind>;
  ocr_confidence?: number;
  bounding_box?: z.output<typeof NormalizedBoundingBoxSchema>;
} {
  const span = spans.find(({ line_start, line_end }) =>
    block.lineStart >= line_start && block.lineEnd <= line_end);
  if (!span) return { source_kind: "markdown_text" };
  return {
    source_kind: span.source_kind,
    ...(span.ocr_confidence === undefined ? {} : { ocr_confidence: span.ocr_confidence }),
    ...(span.bounding_box ? { bounding_box: span.bounding_box } : {}),
  };
}

function mechanicalBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let page: number | undefined;
  let paragraph: { lines: string[]; exactLines: string[]; start: number } | undefined;
  const flush = (end: number): void => {
    if (!paragraph) return;
    blocks.push({
      kind: "paragraph",
      text: paragraph.lines.join(" "),
      exactText: paragraph.exactLines.join("\n"),
      lineStart: paragraph.start,
      lineEnd: end,
      ...(page ? { page } : {}),
    });
    paragraph = undefined;
  };
  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const line = raw.trim();
    if (line.length === 0) {
      flush(lineNumber - 1);
      return;
    }
    const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
    const bullet = /^[-*+•]\s+(.+)$/u.exec(line);
    const numbered = /^(\d+)[.)]\s+(.+)$/u.exec(line);
    const table = /^\|.*\|$/u.test(line);
    const caption = /^(?:figure|table|gambar|tabel)\s+\d+\s*[:.-]\s*(.+)$/iu.exec(line);
    if (heading || bullet || numbered || table || caption) {
      flush(lineNumber - 1);
      if (heading) {
        const pageMatch = /^PDF page (\d+)$/iu.exec(heading[2]!);
        if (pageMatch) page = Number(pageMatch[1]);
        blocks.push({ kind: "heading", text: heading[2]!, exactText: raw,
          lineStart: lineNumber,
          lineEnd: lineNumber, headingLevel: heading[1]!.length, ...(page ? { page } : {}) });
      } else {
        blocks.push({
          kind: bullet ? "bullet" : numbered ? "numbered_item" : table ? "table_row" : "caption",
          text: bullet?.[1] ?? numbered?.[2] ?? caption?.[1] ?? line,
          exactText: raw,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          ...(page ? { page } : {}),
        });
      }
    } else {
      paragraph ??= { lines: [], exactLines: [], start: lineNumber };
      paragraph.lines.push(line);
      paragraph.exactLines.push(raw);
    }
  });
  flush(lines.length);
  return blocks;
}

function validateCoverage(content: string, blocks: readonly Block[]): void {
  const expected = content.split("\n").map((line) => line.trim()).filter(Boolean)
    .map(stripMechanicalMarker).join(" ").replace(/\s+/gu, " ");
  const actual = blocks.map(({ text }) => text).join(" ").replace(/\s+/gu, " ");
  if (actual !== expected) throw new Error("Source-unit text coverage mismatch");
}

function stripMechanicalMarker(line: string): string {
  return line.replace(/^#{1,6}\s+/u, "").replace(/^[-*+•]\s+/u, "")
    .replace(/^\d+[.)]\s+/u, "").replace(/^(?:figure|table|gambar|tabel)\s+\d+\s*[:.-]\s*/iu, "");
}

function normalizeNewlines(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, child) => {
    if (child === null || typeof child !== "object" || Array.isArray(child)) return child;
    return Object.fromEntries(Object.entries(child).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0));
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
