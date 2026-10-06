import { parseNormalizedDocument, type NormalizedDocument } from "@atlas/contracts";
import { atlasProviderExtractionProposalV1JsonSchema, compileExtractionPrompt, semanticExtractionProfileId } from "./semantic-prompt.js";

/** Frozen pre-provider bounds for the BSS-V2-004-03-03 source packet. */
export const semanticSourcePacketLimits = {
  maxSourceUnits: 10_000,
  maxUserPromptBytes: 1_000_000,
} as const;

export type SourceLocatorType = "text_block" | "table" | "visual_region";
export type SemanticSourceUnit = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly content: string;
};
export type RejectedSemanticSourceUnit = {
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly reason: "empty_content" | "unlabeled_visual_region";
};
export type SemanticSourcePacket = {
  readonly semanticProfile: typeof semanticExtractionProfileId;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly providerProposalJsonSchema: Readonly<Record<string, unknown>>;
  readonly sourceSlotMap: readonly SemanticSourceUnit[];
  readonly rejectedSourceUnits: readonly RejectedSemanticSourceUnit[];
};

type CandidateSource = Omit<SemanticSourceUnit, "slot">;
const utf8Bytes = (value: string) => Buffer.byteLength(value, "utf8");
const compareId = <T extends { readonly id: string }>(left: T, right: T) => left.id.localeCompare(right.id);
const comparePage = (left: NormalizedDocument["pages"][number], right: NormalizedDocument["pages"][number]) => left.number - right.number;

/**
 * Converts only accepted NormalizedDocument material into temporary provider slots.
 * Slot names are packet-local and never become Atlas semantic identities.
 */
export function buildSemanticSourcePacket(input: NormalizedDocument): SemanticSourcePacket {
  const document = parseNormalizedDocument(input);
  const candidates: CandidateSource[] = [];
  const rejected: RejectedSemanticSourceUnit[] = [];
  const seenLocators = new Set<string>();
  const add = (pageNumber: number, locatorType: SourceLocatorType, locatorId: string, content: string | undefined, reason?: RejectedSemanticSourceUnit["reason"]) => {
    const locatorKey = `${pageNumber}\u0000${locatorType}\u0000${locatorId}`;
    if (seenLocators.has(locatorKey)) throw new Error(`Duplicate normalized source locator: ${locatorType}/${locatorId} on page ${pageNumber}.`);
    seenLocators.add(locatorKey);
    if (content === undefined || content.length === 0) {
      rejected.push({ pageNumber, locatorType, locatorId, reason: reason ?? "empty_content" });
      return;
    }
    candidates.push({ pageNumber, locatorType, locatorId, content });
  };

  for (const page of [...document.pages].sort(comparePage)) {
    for (const block of [...page.textBlocks].sort(compareId)) add(page.number, "text_block", block.id, block.text);
    for (const table of [...page.tables].sort(compareId)) add(page.number, "table", table.id, table.content);
    for (const visual of [...page.visualRegions].sort(compareId)) {
      const originalLabel = visual.label;
      // v1 has no semantic-content field for an unlabeled visual. Do not infer meaning from its derived asset reference.
      add(page.number, "visual_region", visual.id, originalLabel === undefined || originalLabel.trim().length === 0 ? undefined : originalLabel, "unlabeled_visual_region");
    }
  }

  if (candidates.length > semanticSourcePacketLimits.maxSourceUnits) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxSourceUnits} source units.`);
  const sourceSlotMap = candidates.map((source, index) => ({ ...source, slot: `slot-${String(index + 1).padStart(6, "0")}` }));
  const userPayload = {
    version: "v1",
    // The provider receives only a temporary slot and source material. Atlas retains page/locator lineage locally.
    source_slots: sourceSlotMap.map(({ slot, content }) => ({ slot, content })),
  };
  const userPrompt = JSON.stringify(userPayload);
  if (utf8Bytes(userPrompt) > semanticSourcePacketLimits.maxUserPromptBytes) throw new Error(`Semantic source packet exceeds ${semanticSourcePacketLimits.maxUserPromptBytes} UTF-8 bytes.`);

  const compiled = compileExtractionPrompt();
  return {
    semanticProfile: semanticExtractionProfileId,
    systemPrompt: compiled.prompt,
    userPrompt,
    providerProposalJsonSchema: atlasProviderExtractionProposalV1JsonSchema,
    sourceSlotMap,
    rejectedSourceUnits: rejected,
  };
}
