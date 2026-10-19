import { parseRequestResourceEnvelope, type RequestResourceEnvelope } from "./process-workload-catalogue.js";
import type { AcceptedDocumentPlannerResultV1 } from "@atlas/db";

export class IdserCorpusDemandEstimatorError extends Error {}

export type CorpusDemandEstimatorIdentity = Readonly<{ identity: string; version: string }>;
export type CorpusDemandEstimatorOverheads = Readonly<{
  systemPromptBytes: number;
  schemaBytes: number;
  contextPlaceholderBytes: number;
  contextPlaceholderTokens: number;
  reservedOutputBytes: number;
  reservedOutputTokens: number;
  mediaMetadataBytes: number;
  mediaInputTokensPerByte: number;
  inputBytesPerToken: number;
  requestByteSafetyMargin: number;
  inputTokenSafetyMargin: number;
}>;

export type CorpusDemandEstimatorConfiguration = Readonly<{
  /** This leaf accepts a pinned BSS identity; it never reads or registers BSS metadata. */
  bssRegisteredEstimator: CorpusDemandEstimatorIdentity;
  estimator: CorpusDemandEstimatorIdentity;
  modelRoute: Readonly<{ model: string; route: string }>;
  overheads: CorpusDemandEstimatorOverheads;
}>;

export type CorpusSourceLocator = Readonly<{
  documentId: string;
  pageNumber: number;
  sourceKind: "text_block" | "table" | "visual_region";
  localId: string;
}>;

export type CorpusDemandUnit = Readonly<{
  locator: CorpusSourceLocator;
  classification: "eligible" | "deferred" | "unexamined";
  reason?: "empty_content" | "unlabeled_visual" | "missing_required_media" | "duplicate_locator";
  demand?: Readonly<{ requestBytes: number; inputTokens: number; envelope: RequestResourceEnvelope }>;
}>;

export type CorpusDemandEstimate = Readonly<{
  disposition: "READY" | "NO_ELIGIBLE_SOURCE" | "SEM_BATCH_ESTIMATOR_GAP";
  estimator: CorpusDemandEstimatorIdentity;
  modelRoute: Readonly<{ model: string; route: string }>;
  units: readonly CorpusDemandUnit[];
  issues: readonly ("estimator_identity_mismatch" | "invalid_estimator_bounds" | "foreign_media" | "invalid_document_binding" | "rel_not_unavailable")[];
}>;

const utf8 = (value: string) => Buffer.byteLength(value, "utf8");
const safe = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
const nonEmpty = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
};

function validConfiguration(configuration: CorpusDemandEstimatorConfiguration): boolean {
  if (!nonEmpty(configuration.estimator.identity) || !nonEmpty(configuration.estimator.version)
    || !nonEmpty(configuration.bssRegisteredEstimator.identity) || !nonEmpty(configuration.bssRegisteredEstimator.version)
    || !nonEmpty(configuration.modelRoute.model) || !nonEmpty(configuration.modelRoute.route)) return false;
  if (configuration.estimator.identity !== configuration.bssRegisteredEstimator.identity || configuration.estimator.version !== configuration.bssRegisteredEstimator.version) return false;
  return Object.values(configuration.overheads).every(safe)
    && configuration.overheads.inputBytesPerToken > 0;
}

function canonicalKey(locator: CorpusSourceLocator): string {
  return `${locator.documentId}\u0000${locator.pageNumber}\u0000${locator.sourceKind}\u0000${locator.localId}`;
}

function sameLocator(left: CorpusSourceLocator, right: Readonly<{ pageNumber: number; locatorId: string }>): boolean {
  return left.pageNumber === right.pageNumber && left.localId === right.locatorId;
}

function demandFor(sourceBytes: number, mediaBytes: number, configuration: CorpusDemandEstimatorConfiguration): Readonly<{ requestBytes: number; inputTokens: number; envelope: RequestResourceEnvelope }> | undefined {
  const overhead = configuration.overheads;
  const requestBytes = sourceBytes + mediaBytes + overhead.systemPromptBytes + overhead.schemaBytes + overhead.contextPlaceholderBytes
    + overhead.reservedOutputBytes + overhead.mediaMetadataBytes + overhead.requestByteSafetyMargin;
  const inputTokens = Math.ceil((sourceBytes + overhead.systemPromptBytes + overhead.schemaBytes + overhead.contextPlaceholderBytes + overhead.mediaMetadataBytes) / overhead.inputBytesPerToken)
    + (mediaBytes * overhead.mediaInputTokensPerByte) + overhead.contextPlaceholderTokens + overhead.reservedOutputTokens + overhead.inputTokenSafetyMargin;
  if (!safe(requestBytes) || !safe(inputTokens)) return undefined;
  try {
    return { requestBytes, inputTokens, envelope: parseRequestResourceEnvelope({ requestUnits: 1, tokenUnits: inputTokens, dayUnits: 1, concurrencyUnits: 1 }) };
  } catch {
    return undefined;
  }
}

/**
 * Pure, deterministic source accounting. This has no BSS reader, storage,
 * queue, provider, prompt, or semantic-acceptance dependency. The caller is
 * responsible for supplying only a previously resolved accepted document and
 * a pinned BSS-owned estimator identity.
 */
export function estimateAcceptedCorpusDemand(input: Readonly<{
  acceptedDocument: AcceptedDocumentPlannerResultV1;
  configuration: CorpusDemandEstimatorConfiguration;
}>): CorpusDemandEstimate {
  const { acceptedDocument, configuration } = input;
  const issues: CorpusDemandEstimate["issues"][number][] = [];
  if (!validConfiguration(configuration)) issues.push(configuration.estimator.identity !== configuration.bssRegisteredEstimator.identity || configuration.estimator.version !== configuration.bssRegisteredEstimator.version ? "estimator_identity_mismatch" : "invalid_estimator_bounds");
  if (acceptedDocument.rel?.state !== "unavailable") issues.push("rel_not_unavailable");
  if (acceptedDocument.normalizedDocument.artifactId !== acceptedDocument.source.documentId
    || acceptedDocument.normalizedDocument.sourceSha256 !== acceptedDocument.source.sourceSha256) issues.push("invalid_document_binding");

  const units: CorpusDemandUnit[] = [];
  const seen = new Set<string>();
  const expectedMedia = new Map<string, Readonly<{ assetRef: string; locatorId: string; pageNumber: number }>>();
  for (const page of acceptedDocument.normalizedDocument.pages) for (const visual of page.visualRegions) {
    if (visual.assetRef) expectedMedia.set(`${page.number}\u0000${visual.id}`, { assetRef: visual.assetRef, locatorId: visual.id, pageNumber: page.number });
  }
  const grantedMedia = new Map<string, AcceptedDocumentPlannerResultV1["media"][number]>();
  for (const media of acceptedDocument.media) {
    const expected = expectedMedia.get(`${media.pageNumber}\u0000${media.locatorId}`);
    if (!expected || expected.assetRef !== media.assetRef || media.mediaType !== "image/png" || !safe(media.byteLength) || media.byteLength <= 0) {
      issues.push("foreign_media");
      continue;
    }
    const key = `${media.pageNumber}\u0000${media.locatorId}`;
    if (grantedMedia.has(key)) issues.push("foreign_media"); else grantedMedia.set(key, media);
  }

  const add = (locator: CorpusSourceLocator, sourceBytes: number, mediaBytes: number, initial: CorpusDemandUnit["classification"], reason?: CorpusDemandUnit["reason"]) => {
    const key = canonicalKey(locator);
    if (seen.has(key)) {
      units.push({ locator, classification: "unexamined", reason: "duplicate_locator" });
      return;
    }
    seen.add(key);
    if (initial !== "eligible") {
      units.push({ locator, classification: initial, ...(reason ? { reason } : {}) });
      return;
    }
    const demand = demandFor(sourceBytes, mediaBytes, configuration);
    units.push(demand ? { locator, classification: "eligible", demand } : { locator, classification: "unexamined", reason: "missing_required_media" });
    if (!demand) issues.push("invalid_estimator_bounds");
  };

  for (const page of [...acceptedDocument.normalizedDocument.pages].sort((left, right) => left.number - right.number)) {
    for (const block of [...page.textBlocks].sort((left, right) => left.id.localeCompare(right.id))) {
      add({ documentId: acceptedDocument.source.documentId, pageNumber: page.number, sourceKind: "text_block", localId: block.id }, utf8(block.text), 0, block.text.trim() ? "eligible" : "deferred", "empty_content");
    }
    for (const table of [...page.tables].sort((left, right) => left.id.localeCompare(right.id))) {
      add({ documentId: acceptedDocument.source.documentId, pageNumber: page.number, sourceKind: "table", localId: table.id }, utf8(table.content), 0, table.content.trim() ? "eligible" : "deferred", "empty_content");
    }
    for (const visual of [...page.visualRegions].sort((left, right) => left.id.localeCompare(right.id))) {
      const locator = { documentId: acceptedDocument.source.documentId, pageNumber: page.number, sourceKind: "visual_region" as const, localId: visual.id };
      const media = grantedMedia.get(`${page.number}\u0000${visual.id}`);
      if (!visual.assetRef || !media) add(locator, 0, 0, "unexamined", "missing_required_media");
      else if (!visual.label?.trim()) add(locator, 0, 0, "unexamined", "unlabeled_visual");
      else add(locator, utf8(visual.label), media.byteLength, "eligible");
    }
  }
  // A resolved visual grant must bind exactly to the matching visual locator;
  // any extra grant is a foreign-media integrity failure, never a new source.
  for (const media of acceptedDocument.media) if (!units.some((unit) => sameLocator(unit.locator, media))) issues.push("foreign_media");

  const uniqueIssues = [...new Set(issues)].sort();
  const eligible = units.filter((unit) => unit.classification === "eligible");
  const hasIntegrityFailure = uniqueIssues.some((issue) => issue !== "invalid_estimator_bounds") || units.some((unit) => unit.reason === "duplicate_locator" || unit.reason === "missing_required_media");
  const disposition = hasIntegrityFailure || uniqueIssues.includes("invalid_estimator_bounds") ? "SEM_BATCH_ESTIMATOR_GAP" : eligible.length === 0 ? "NO_ELIGIBLE_SOURCE" : "READY";
  return freeze({ disposition, estimator: { ...configuration.estimator }, modelRoute: { ...configuration.modelRoute }, units, issues: uniqueIssues });
}
