import { documentPerceptionContractVersion, parseNormalizedDocument, type NormalizedDocument } from "@atlas/contracts";

export type PerceptionProvenance = { readonly provider: string; readonly processor: string; readonly executionId: string; readonly processedAt: string };
export type PerceptionProviderResult = { readonly pages: readonly unknown[] };

const record = (value: unknown): Record<string, unknown> | undefined => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const string = (value: unknown): string | undefined => typeof value === "string" && value.length > 0 ? value : undefined;
const number = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : [];

function box(value: unknown): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | undefined {
  if (Array.isArray(value) && value.length === 4) {
    const [left, top, right, bottom] = value.map(number);
    return left !== undefined && top !== undefined && right !== undefined && bottom !== undefined && left >= 0 && top >= 0 && right > left && bottom > top
      ? { x: left, y: top, width: right - left, height: bottom - top }
      : undefined;
  }
  const candidate = record(value);
  const x = number(candidate?.x ?? candidate?.left);
  const y = number(candidate?.y ?? candidate?.top);
  const width = number(candidate?.width);
  const height = number(candidate?.height);
  return x !== undefined && y !== undefined && width !== undefined && height !== undefined && x >= 0 && y >= 0 && width > 0 && height > 0 ? { x, y, width, height } : undefined;
}

/**
 * Converts the bounded provider perception shape into Atlas's canonical,
 * provider-neutral operational document. It deliberately carries regions and
 * text only; interpretation belongs to the later semantic-extraction stage.
 */
export function normalizePerceptionResult(input: { readonly executionId: string; readonly artifactId: string; readonly sourceSha256: string; readonly provider: PerceptionProvenance; readonly result: PerceptionProviderResult }): NormalizedDocument {
  const pages = input.result.pages.map((rawPage, offset) => {
    const page = record(rawPage) ?? {};
    const dimensions = record(page.dimensions);
    const textBlocks = array(page.blocks).map((rawBlock, index) => {
      const block = record(rawBlock) ?? {};
      const confidenceScores = record(block.confidence_scores);
      const confidence = number(block.confidence) ?? number(confidenceScores?.average_content_confidence_score);
      return { id: string(block.id) ?? `page-${offset + 1}-block-${index + 1}`, text: string(block.text ?? block.markdown) ?? "", ...(string(block.type) ? { kind: string(block.type)! } : {}), ...(box(block.bbox ?? block.bounding_box) ? { boundingBox: box(block.bbox ?? block.bounding_box)! } : {}), ...(confidence !== undefined ? { confidence } : {}) };
    }).filter((block) => block.text.length > 0);
    if (!textBlocks.length && string(page.markdown)) textBlocks.push({ id: `page-${offset + 1}-markdown`, text: string(page.markdown)! });
    const tables = array(page.tables).map((rawTable, index) => {
      const table = record(rawTable) ?? {};
      return { id: string(table.id) ?? `page-${offset + 1}-table-${index + 1}`, content: string(table.markdown ?? table.content) ?? "", ...(box(table.bbox ?? table.bounding_box) ? { boundingBox: box(table.bbox ?? table.bounding_box)! } : {}) };
    });
    const visualRegions = array(page.images ?? page.visual_regions).map((rawRegion, index) => {
      const region = record(rawRegion) ?? {};
      return { id: string(region.id) ?? `page-${offset + 1}-visual-${index + 1}`, ...(string(region.label) ? { label: string(region.label)! } : {}), ...(box(region.bbox ?? region.bounding_box) ? { boundingBox: box(region.bbox ?? region.bounding_box)! } : {}), ...(string(region.assetRef) ? { assetRef: string(region.assetRef)! } : {}) };
    });
    const explicitPageNumber = number(page.page_number);
    const providerIndex = number(page.index);
    return { number: explicitPageNumber ?? (providerIndex !== undefined ? providerIndex + 1 : offset + 1), ...(number(dimensions?.width ?? page.width) !== undefined ? { width: number(dimensions?.width ?? page.width)! } : {}), ...(number(dimensions?.height ?? page.height) !== undefined ? { height: number(dimensions?.height ?? page.height)! } : {}), textBlocks, tables, visualRegions };
  });
  return parseNormalizedDocument({ version: documentPerceptionContractVersion, executionId: input.executionId, artifactId: input.artifactId, sourceSha256: input.sourceSha256, perception: { capability: "atlas.document.perceive", contractVersion: documentPerceptionContractVersion }, provider: { name: input.provider.provider, processor: input.provider.processor, executionId: input.provider.executionId, processedAt: input.provider.processedAt }, pages });
}
