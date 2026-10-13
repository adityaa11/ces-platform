import { createHash } from "node:crypto";
import { parseNormalizedDocument, type NormalizedDocument } from "@atlas/contracts";
import { atlasProviderExtractionProposalV1JsonSchema, compileExtractionPrompt, stepwiseMultimodalSemanticExtractionProfileId } from "./semantic-prompt.js";
import { provisionalRelationshipPacketExtensionV1Schema, type ProvisionalRelationshipPacketExtensionV1 } from "./provisional-relationship-packet.js";
import { semanticSourcePacketLimits, type SourceLocatorType } from "./semantic-source-packet.js";

/** Additive, offline-only source ownership boundary for the stepwise successor. */
export const stepwiseSourcePacketVersion = "atlas.semantic.stepwise-source-packet/v1" as const;

const sha256Pattern = /^[a-f0-9]{64}$/;
const relationshipRoles = ["title", "legend", "scope", "interpretation"] as const;
const relationshipNecessities = ["essential", "optional"] as const;
const relationshipDispositions = ["proposed", "unresolved"] as const;

export type StepwiseSourceSnapshot = {
  readonly executionId: string;
  readonly artifactId: string;
  readonly sourceSha256: string;
};

export type StepwiseSourceLocator = {
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
};

export type StepwiseSourceAssetIdentity = {
  readonly pageNumber: number;
  readonly locatorId: string;
  readonly assetRef: string;
  readonly sha256: string;
  readonly sourceSha256: string;
};

/** A proposed or unresolved revision; it never carries accepted authority. */
export type StepwiseProvisionalRelationship = {
  readonly relationshipLineageId: string;
  readonly revisionHash: string;
  readonly normalizedDocument: StepwiseSourceSnapshot;
  readonly ownedSource: StepwiseSourceLocator;
  readonly contextSource: StepwiseSourceLocator;
  readonly contextualRole: (typeof relationshipRoles)[number];
  readonly necessity: (typeof relationshipNecessities)[number];
  readonly uncertainty: "low" | "medium" | "high" | "unknown";
  readonly disposition: (typeof relationshipDispositions)[number];
  readonly authorization: null;
  readonly expiresAt?: string;
};

export type StepwiseSourceRelationshipRequirement = {
  readonly ownedSource: StepwiseSourceLocator;
  readonly contextSource: StepwiseSourceLocator;
  readonly contextualRole: (typeof relationshipRoles)[number];
  readonly necessity: (typeof relationshipNecessities)[number];
};

export type StepwiseSourceSlot = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: SourceLocatorType;
  readonly locatorId: string;
  readonly ownership: "independently_owned" | "context_only_reference";
  readonly role: "owned_source" | "context_only_reference" | "pending_authorized_media";
  readonly status: "ready" | "pending_unexamined_visual";
  readonly content?: string;
  readonly assetIdentity?: { readonly assetRef: string; readonly sha256: string; readonly sourceSha256: string };
  readonly pendingReason?: "visual_not_examined" | "visual_asset_unavailable";
};

export type StepwiseUnresolvedRelationshipRequirement = {
  readonly ownedSourceSlot: string;
  readonly contextSourceSlot: string;
  readonly contextualRole: StepwiseSourceRelationshipRequirement["contextualRole"];
  readonly necessity: StepwiseSourceRelationshipRequirement["necessity"];
  readonly trustedUse: "blocked";
  readonly dependentInterpretation: "provisional";
};

export type StepwiseSourcePacket = {
  readonly version: typeof stepwiseSourcePacketVersion;
  readonly semanticProfile: typeof stepwiseMultimodalSemanticExtractionProfileId;
  readonly systemPrompt: string;
  readonly providerProposalJsonSchema: Readonly<Record<string, unknown>>;
  readonly sourceSnapshot: StepwiseSourceSnapshot;
  readonly sourceSlots: readonly StepwiseSourceSlot[];
  readonly provisionalRelationships: ProvisionalRelationshipPacketExtensionV1;
  readonly unresolvedRelationshipRequirements: readonly StepwiseUnresolvedRelationshipRequirement[];
  readonly pendingVisuals: readonly { readonly sourceSlot: string; readonly pageNumber: number; readonly locatorId: string; readonly assetIdentity?: StepwiseSourceSlot["assetIdentity"]; readonly reason: "visual_not_examined" | "visual_asset_unavailable" }[];
  readonly sourceSpecification: string;
  readonly sourceSpecificationSha256: string;
};

export type StepwiseSourcePacketInput = {
  readonly document: NormalizedDocument;
  readonly assetIdentities?: readonly StepwiseSourceAssetIdentity[];
  readonly provisionalRelationships?: readonly StepwiseProvisionalRelationship[];
  readonly relationshipRequirements?: readonly StepwiseSourceRelationshipRequirement[];
  /** Explicitly rejected at this boundary; trusted context belongs to the accepted builder. */
  readonly acceptedRelationships?: readonly unknown[];
  /** Injectable clock makes expiry checks deterministic in offline qualification. */
  readonly now?: string;
};

const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  }
  throw new Error("Stepwise source packet must be JSON-serializable.");
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const sourceKey = (source: StepwiseSourceLocator) => `${source.pageNumber}\u0000${source.locatorType}\u0000${source.locatorId}`;
const reject = (message: string): never => { throw new Error(`SOURCE_RELATIONSHIP_BLOCKED: ${message}`); };

function validateAssetIdentities(document: NormalizedDocument, identities: readonly StepwiseSourceAssetIdentity[]) {
  const assets = new Map<string, StepwiseSourceAssetIdentity>();
  for (const identity of identities) {
    if (!Number.isSafeInteger(identity.pageNumber) || identity.pageNumber < 1 || !identity.locatorId || !identity.assetRef || !sha256Pattern.test(identity.sha256) || identity.sourceSha256 !== document.sourceSha256) reject("asset identity is foreign or malformed.");
    const key = sourceKey({ pageNumber: identity.pageNumber, locatorType: "visual_region", locatorId: identity.locatorId });
    if (assets.has(key)) reject("duplicate visual asset identity.");
    assets.set(key, identity);
  }
  const visualKeys = new Set<string>();
  for (const page of document.pages) for (const visual of page.visualRegions) {
    const locator = { pageNumber: page.number, locatorType: "visual_region" as const, locatorId: visual.id };
    const key = sourceKey(locator);
    visualKeys.add(key);
    const identity = assets.get(key);
    if (visual.assetRef !== undefined && (!identity || identity.assetRef !== visual.assetRef)) reject(`visual asset identity does not match ${visual.id}.`);
    if (visual.assetRef === undefined && identity !== undefined) reject(`asset identity is not bound to visual ${visual.id}.`);
  }
  for (const key of assets.keys()) if (!visualKeys.has(key)) reject("asset identity references a foreign visual locator.");
  return assets;
}

function validateSnapshot(document: NormalizedDocument): StepwiseSourceSnapshot {
  if (!sha256Pattern.test(document.sourceSha256)) reject("normalized document source SHA-256 is malformed.");
  return { executionId: document.executionId, artifactId: document.artifactId, sourceSha256: document.sourceSha256 };
}

function validateRelationshipShape(relationship: StepwiseProvisionalRelationship, snapshot: StepwiseSourceSnapshot, available: ReadonlyMap<string, StepwiseSourceSlot>, now: string) {
  if (!sha256Pattern.test(relationship.relationshipLineageId) || !sha256Pattern.test(relationship.revisionHash)) reject("relationship lineage or revision hash is malformed.");
  if (stableJson(relationship.normalizedDocument) !== stableJson(snapshot)) reject("relationship revision is foreign or stale for the source snapshot.");
  if (relationship.authorization !== null) reject("accepted relationship authority is not allowed in a provisional packet.");
  if (!relationship.ownedSource.locatorId || !relationship.contextSource.locatorId) reject("relationship locator is malformed.");
  const owned = available.get(sourceKey(relationship.ownedSource));
  const context = available.get(sourceKey(relationship.contextSource));
  if (!owned || !context || owned.slot === context.slot) reject("relationship references a missing, foreign, or self source locator.");
  const ownedSlot = owned as StepwiseSourceSlot;
  const contextSlot = context as StepwiseSourceSlot;
  if (relationship.expiresAt !== undefined) {
    const expiresAt = Date.parse(relationship.expiresAt);
    const current = Date.parse(now);
    if (!Number.isFinite(expiresAt) || !Number.isFinite(current) || expiresAt <= current) reject("relationship revision is expired.");
  }
  return { owned: ownedSlot, context: contextSlot };
}

/**
 * Builds only the deterministic source boundary. It carries source bytes/labels
 * as evidence and references verified assets by identity; it never hydrates
 * media, calls a provider, creates a job, or grants trusted context.
 */
export function buildStepwiseSourcePacket(input: StepwiseSourcePacketInput): StepwiseSourcePacket {
  const document = parseNormalizedDocument(input.document);
  if (input.acceptedRelationships?.length) reject("accepted context must be supplied through the accepted-relationship builder.");
  const snapshot = validateSnapshot(document);
  const assets = validateAssetIdentities(document, input.assetIdentities ?? []);
  const allSources: { locator: StepwiseSourceLocator; content?: string; assetIdentity?: StepwiseSourceSlot["assetIdentity"] }[] = [];
  const seen = new Set<string>();
  for (const page of [...document.pages].sort((left, right) => left.number - right.number)) {
    for (const block of [...page.textBlocks].sort((left, right) => left.id.localeCompare(right.id))) allSources.push({ locator: { pageNumber: page.number, locatorType: "text_block", locatorId: block.id }, content: block.text });
    for (const table of [...page.tables].sort((left, right) => left.id.localeCompare(right.id))) allSources.push({ locator: { pageNumber: page.number, locatorType: "table", locatorId: table.id }, content: table.content });
    for (const visual of [...page.visualRegions].sort((left, right) => left.id.localeCompare(right.id))) {
      const locator = { pageNumber: page.number, locatorType: "visual_region" as const, locatorId: visual.id };
      const identity = assets.get(sourceKey(locator));
      allSources.push({ locator, ...(visual.label === undefined || visual.label.trim().length === 0 ? {} : { content: visual.label }), ...(identity === undefined ? {} : { assetIdentity: { assetRef: identity.assetRef, sha256: identity.sha256, sourceSha256: identity.sourceSha256 } }) });
    }
  }
  if (allSources.length > semanticSourcePacketLimits.maxSourceUnits) throw new Error(`Stepwise source packet exceeds ${semanticSourcePacketLimits.maxSourceUnits} source units.`);
  for (const source of allSources) {
    const key = sourceKey(source.locator);
    if (seen.has(key)) throw new Error(`Duplicate normalized source locator: ${source.locator.locatorType}/${source.locator.locatorId} on page ${source.locator.pageNumber}.`);
    seen.add(key);
  }
  const provisionalRelationships = [...input.provisionalRelationships ?? []].sort((left, right) => `${left.relationshipLineageId}\u0000${left.revisionHash}`.localeCompare(`${right.relationshipLineageId}\u0000${right.revisionHash}`));
  const requirements = [...input.relationshipRequirements ?? []].sort((left, right) => sourceKey(left.ownedSource).localeCompare(sourceKey(right.ownedSource)) || sourceKey(left.contextSource).localeCompare(sourceKey(right.contextSource)) || left.contextualRole.localeCompare(right.contextualRole));
  const baseSlots = allSources.map((source, index) => ({ slot: `slot-${String(index + 1).padStart(6, "0")}`, ...source.locator, ownership: "independently_owned" as const, role: source.locator.locatorType === "visual_region" && source.assetIdentity ? "pending_authorized_media" as const : "owned_source" as const, status: source.locator.locatorType === "visual_region" ? "pending_unexamined_visual" as const : "ready" as const, ...(source.content === undefined ? {} : { content: source.content }), ...(source.assetIdentity === undefined ? {} : { assetIdentity: source.assetIdentity }), ...(source.locator.locatorType === "visual_region" ? { pendingReason: source.assetIdentity === undefined ? "visual_asset_unavailable" as const : "visual_not_examined" as const } : {}) }));
  const available = new Map(baseSlots.map((slot) => [sourceKey(slot), slot]));
  const relationshipKeys = new Set<string>();
  const contextSlotKeys = new Set<string>();
  const ownedSlotKeys = new Set<string>();
  const normalizedRelationships = provisionalRelationships.map((relationship) => {
    const { owned, context } = validateRelationshipShape(relationship, snapshot, available, input.now ?? new Date().toISOString());
    const key = `${owned.slot}\u0000${context.slot}\u0000${relationship.contextualRole}`;
    const revisionKey = `${relationship.relationshipLineageId}\u0000${relationship.revisionHash}`;
    if (relationshipKeys.has(revisionKey) || relationshipKeys.has(key)) reject("duplicate or over-bound relationship revision.");
    relationshipKeys.add(revisionKey); relationshipKeys.add(key); contextSlotKeys.add(context.slot); ownedSlotKeys.add(owned.slot);
    return { ownedSourceSlot: owned.slot, contextSourceSlot: context.slot, relationshipLineageId: relationship.relationshipLineageId, revisionHash: relationship.revisionHash, contextualRole: relationship.contextualRole, necessity: relationship.necessity, uncertainty: relationship.uncertainty, disposition: relationship.disposition, source_evidence_slots: [owned.slot, context.slot] as [string, string] };
  });
  for (const key of contextSlotKeys) if (ownedSlotKeys.has(key)) reject("a provisional context source cannot also be an independently owned source in this packet.");
  const requirementKeys = new Set<string>();
  const unresolvedRelationshipRequirements = requirements.map((requirement) => {
    const owned = available.get(sourceKey(requirement.ownedSource));
    const context = available.get(sourceKey(requirement.contextSource));
    if (!owned || !context || owned.slot === context.slot) reject("relationship requirement references a missing, foreign, or self source locator.");
    const ownedSlot = owned as StepwiseSourceSlot;
    const contextSlot = context as StepwiseSourceSlot;
    const key = `${ownedSlot.slot}\u0000${contextSlot.slot}\u0000${requirement.contextualRole}`;
    if (requirementKeys.has(key)) reject("duplicate relationship requirement.");
    requirementKeys.add(key);
    const supplied = normalizedRelationships.find((relationship) => relationship.ownedSourceSlot === ownedSlot.slot && relationship.contextSourceSlot === contextSlot.slot && relationship.contextualRole === requirement.contextualRole);
    if (supplied && supplied.necessity !== requirement.necessity) reject("provisional relationship necessity does not match its requirement.");
    return { ownedSourceSlot: ownedSlot.slot, contextSourceSlot: contextSlot.slot, contextualRole: requirement.contextualRole, necessity: requirement.necessity, trustedUse: "blocked" as const, dependentInterpretation: "provisional" as const };
  }).filter((requirement) => !normalizedRelationships.some((relationship) => relationship.ownedSourceSlot === requirement.ownedSourceSlot && relationship.contextSourceSlot === requirement.contextSourceSlot && relationship.contextualRole === requirement.contextualRole && relationship.necessity === requirement.necessity));
  const sourceSlots = baseSlots.map((slot) => contextSlotKeys.has(slot.slot) ? { ...slot, ownership: "context_only_reference" as const, role: "context_only_reference" as const } : slot);
  const pendingVisuals = sourceSlots.filter((slot) => slot.locatorType === "visual_region").map((slot) => ({ sourceSlot: slot.slot, pageNumber: slot.pageNumber, locatorId: slot.locatorId, ...(slot.assetIdentity === undefined ? {} : { assetIdentity: slot.assetIdentity }), reason: slot.pendingReason ?? "visual_not_examined" as const }));
  const relationshipExtension = provisionalRelationshipPacketExtensionV1Schema.parse({ contract_version: "atlas.relationship-packet-extension/v1", relationships: normalizedRelationships.map(({ ownedSourceSlot, contextSourceSlot, relationshipLineageId, revisionHash, contextualRole, necessity, uncertainty, disposition, source_evidence_slots }) => ({ relationship_lineage_id: relationshipLineageId, revision_hash: revisionHash, owned_source_slot: ownedSourceSlot, context_source_slot: contextSourceSlot, contextual_role: contextualRole, necessity, uncertainty, disposition, source_evidence_slots })) });
  const sourceSpecification = stableJson({ version: stepwiseSourcePacketVersion, source_snapshot: snapshot, source_slots: sourceSlots, provisional_relationships: relationshipExtension, unresolved_relationship_requirements: unresolvedRelationshipRequirements, pending_visuals: pendingVisuals });
  if (Buffer.byteLength(sourceSpecification, "utf8") > semanticSourcePacketLimits.maxUserPromptBytes) throw new Error(`Stepwise source packet exceeds ${semanticSourcePacketLimits.maxUserPromptBytes} UTF-8 bytes.`);
  const compiled = compileExtractionPrompt(stepwiseMultimodalSemanticExtractionProfileId);
  return { version: stepwiseSourcePacketVersion, semanticProfile: stepwiseMultimodalSemanticExtractionProfileId, systemPrompt: compiled.prompt, providerProposalJsonSchema: atlasProviderExtractionProposalV1JsonSchema, sourceSnapshot: snapshot, sourceSlots, provisionalRelationships: relationshipExtension, unresolvedRelationshipRequirements, pendingVisuals, sourceSpecification, sourceSpecificationSha256: sha256(sourceSpecification) };
}
