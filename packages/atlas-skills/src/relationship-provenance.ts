import { createHash } from "node:crypto";

export const relationshipContractVersion = "atlas.context-provenance/v1" as const;

export type RelationshipPacketIdentity = {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
  readonly documentId: string;
  readonly executionId: string;
  readonly artifactId: string;
  readonly sourceSha256: string;
};

/** Atlas-resolved input only. Provider output never supplies these locators or asset identities. */
export type TrustedFinalizationSlot = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: "text_block" | "table" | "visual_region";
  readonly locatorId: string;
  readonly sourceSha256: string;
  readonly role?: "owned_source" | "reference_context" | "pending_authorized_media";
  readonly assetIdentity?: { readonly assetRef: string; readonly sha256: string; readonly sourceSha256: string };
};

/** Provider-transport provenance is evidence of who supplied a proposal, never an authority grant. */
export type ProviderProvenance = {
  readonly provider: string;
  readonly model: string;
  readonly endpoint: string;
  readonly attempt: number;
  readonly runId?: string;
};

export type ContextSourceRelationshipRevisionV1 = {
  readonly contractVersion: typeof relationshipContractVersion;
  readonly relationshipLineageId: string;
  readonly revisionHash: string;
  readonly scope: RelationshipPacketIdentity;
  readonly normalizedDocument: Pick<RelationshipPacketIdentity, "executionId" | "artifactId" | "sourceSha256">;
  readonly ownedSource: RelationshipSourceLocator;
  readonly contextSource: RelationshipSourceLocator;
  readonly relationship: {
    readonly type: "context_qualifies";
    readonly direction: "context_to_owned";
    readonly contextualRole: "title" | "legend" | "scope" | "interpretation";
    readonly necessity: "essential" | "optional";
  };
  readonly disposition: "proposed";
  readonly uncertainty: "low" | "medium" | "high" | "unknown";
  readonly proposedMeaning: string;
  readonly sourceLanguage: string | null;
  readonly candidateRefs: readonly { readonly sourceSlot: string; readonly candidateIndex: number }[];
  readonly proposalProvenance: {
    readonly providerIdentity: string;
    readonly providerRun: string;
    readonly providerRelationshipOrdinal: number;
    readonly confidence: null;
  };
  readonly predecessor: null | { readonly relationshipRevisionHash: string; readonly relation: "refines" | "challenges" | "replaces" };
  readonly authorization: null;
};

export type RelationshipSourceLocator = {
  readonly slot: string;
  readonly pageNumber: number;
  readonly locatorType: TrustedFinalizationSlot["locatorType"];
  readonly locatorId: string;
  readonly sourceSha256: string;
  readonly assetIdentity?: TrustedFinalizationSlot["assetIdentity"];
};

export type ProvisionalRelationshipStageV1 = {
  readonly executionId: string;
  readonly idempotencyKey: string;
  readonly sidecarHash: string;
  readonly revisions: readonly ContextSourceRelationshipRevisionV1[];
};

/** Persistence only: durable adapters and atomic worker composition belong to REL-03. */
export interface ProvisionalRelationshipRepository {
  appendForExecution(input: { readonly executionId: string; readonly sourceSnapshot: RelationshipPacketIdentity; readonly revisions: readonly ContextSourceRelationshipRevisionV1[] }): Promise<readonly ContextSourceRelationshipRevisionV1[]>;
  loadForSnapshot(input: { readonly projectId: string; readonly workspaceId: string; readonly bundleId: string; readonly documentId: string; readonly sourceSha256: string }): Promise<readonly ContextSourceRelationshipRevisionV1[]>;
  stageSidecar(input: ProvisionalRelationshipStageV1): Promise<ProvisionalRelationshipStageV1>;
  loadStagedSidecar(input: { readonly executionId: string; readonly idempotencyKey: string }): Promise<ProvisionalRelationshipStageV1 | undefined>;
}

export type MaterializedRelationshipProposalSet = {
  readonly semanticProposal: unknown;
  readonly revisions: readonly ContextSourceRelationshipRevisionV1[];
};

export const relationshipStableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(relationshipStableJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${relationshipStableJson(record[key])}`).join(",")}}`;
  }
  throw new Error("Relationship provenance must be JSON-serializable.");
};

export const relationshipSha256 = (value: unknown): string => createHash("sha256").update(relationshipStableJson(value)).digest("hex");
