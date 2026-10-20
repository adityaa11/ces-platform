import { createHash } from "node:crypto";
import { buildStepwiseRelationshipEnvelopeRequest, type StepwiseSourcePacket } from "@atlas/skills";
import { parseRequestResourceEnvelope, type RequestResourceEnvelope } from "./process-workload-catalogue.js";

/** The frozen logical-byte accounting policy for an already composed SEM candidate. */
export const conservativeLogicalRequestBytesVersion = "ConservativeLogicalRequestBytes/v1" as const;

export class CompleteSemCandidateRequestEstimatorError extends Error {
  constructor(message: string) {
    super(`SEM_BATCH_ESTIMATOR_GAP: ${message}`);
  }
}

export type CompleteSemCandidateRequestEstimatorIdentity = Readonly<{
  identity: string;
  version: string;
}>;

/**
 * This is a pinned, caller-supplied BSS-compatible configuration.  The
 * estimator validates it but never reads, registers, or selects BSS policy.
 */
export type CompleteSemCandidateRequestEstimatorConfiguration = Readonly<{
  estimator: CompleteSemCandidateRequestEstimatorIdentity;
  configuration: CompleteSemCandidateRequestEstimatorIdentity;
  inputBytesPerToken: number;
  framingAllowanceBytes: number;
  requestByteSafetyMargin: number;
  inputTokenSafetyMargin: number;
  reservedOutputTokens: number;
  requestResourceEnvelope: Readonly<{
    requestUnits: number;
    dayUnits: number;
    concurrencyUnits: number;
  }>;
}>;

/** Per-selected visual accounting with no image bytes or provider body. */
export type SelectedSemMediaAllowance = Readonly<{
  sourceSlot: string;
  assetSha256: string;
  transportAllowanceBytes: number;
  estimatedImageTokens: number;
}>;

export type CompleteSemCandidateRequestEstimate = Readonly<{
  version: typeof conservativeLogicalRequestBytesVersion;
  requestBytes: number;
  inputTokens: number;
  reservedOutputTokens: number;
  prospectiveTokenDemand: number;
  requestResourceEnvelope: RequestResourceEnvelope;
  components: Readonly<{
    systemPromptBytes: number;
    sourceSpecificationBytes: number;
    schemaAllowanceBytes: number;
    framingAllowanceBytes: number;
    mediaTransportAllowanceBytes: number;
    requestByteSafetyMargin: number;
    textBearingRequestBytes: number;
    estimatedTextTokens: number;
    estimatedImageTokens: number;
    inputTokenSafetyMargin: number;
  }>;
  provenance: Readonly<{
    sourcePacket: Readonly<{ version: string; sourceSpecificationSha256: string }>;
    semRequest: Readonly<{ profile: string; profileSha256: string; systemPromptSha256: string; responseSchemaSha256: string }>;
    estimator: CompleteSemCandidateRequestEstimatorIdentity;
    configuration: Readonly<CompleteSemCandidateRequestEstimatorIdentity & { sha256: string }>;
    selectedMedia: Readonly<{ count: number; sha256: string }>;
  }>;
}>;

const sha256Pattern = /^[a-f0-9]{64}$/;
const utf8 = (value: string) => Buffer.byteLength(value, "utf8");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const safe = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const positive = (value: unknown): value is number => safe(value) && value > 0;
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const stableJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  throw new CompleteSemCandidateRequestEstimatorError("configuration is not JSON-serializable");
};
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
};

function validateConfiguration(configuration: CompleteSemCandidateRequestEstimatorConfiguration): void {
  if (!nonEmpty(configuration.estimator.identity) || !nonEmpty(configuration.estimator.version)
    || !nonEmpty(configuration.configuration.identity) || !nonEmpty(configuration.configuration.version)) {
    throw new CompleteSemCandidateRequestEstimatorError("estimator and configuration identities must be pinned");
  }
  if (!positive(configuration.inputBytesPerToken)
    || !safe(configuration.framingAllowanceBytes)
    || !safe(configuration.requestByteSafetyMargin)
    || !safe(configuration.inputTokenSafetyMargin)
    || !safe(configuration.reservedOutputTokens)
    || !positive(configuration.requestResourceEnvelope.requestUnits)
    || !positive(configuration.requestResourceEnvelope.dayUnits)
    || !positive(configuration.requestResourceEnvelope.concurrencyUnits)) {
    throw new CompleteSemCandidateRequestEstimatorError("configuration contains invalid or overflowing accounting bounds");
  }
}

function selectedMediaAccounting(packet: StepwiseSourcePacket, selectedMedia: readonly SelectedSemMediaAllowance[]) {
  const expected = new Map(packet.sourceSlots
    // Canonical composition preserves both owned and context-only selected
    // visuals.  Their ownership changes semantics upstream, not whether a
    // selected PNG must be conservatively accounted for in this pure request
    // estimate.
    .filter((slot) => slot.locatorType === "visual_region" && slot.assetIdentity)
    .map((slot) => [slot.slot, slot.assetIdentity!]));
  const selected = new Map<string, SelectedSemMediaAllowance>();
  for (const media of selectedMedia) {
    const expectedIdentity = expected.get(media.sourceSlot);
    if (!expectedIdentity || !sha256Pattern.test(media.assetSha256) || media.assetSha256 !== expectedIdentity.sha256
      || !safe(media.transportAllowanceBytes) || !safe(media.estimatedImageTokens) || selected.has(media.sourceSlot)) {
      throw new CompleteSemCandidateRequestEstimatorError("selected-media accounting is missing, foreign, duplicate, or invalid");
    }
    selected.set(media.sourceSlot, media);
  }
  if (selected.size !== expected.size) throw new CompleteSemCandidateRequestEstimatorError("every selected visual requires permitted media accounting");
  const ordered = [...selected.values()].sort((left, right) => left.sourceSlot.localeCompare(right.sourceSlot));
  const mediaTransportAllowanceBytes = ordered.reduce((total, media) => total + media.transportAllowanceBytes, 0);
  const estimatedImageTokens = ordered.reduce((total, media) => total + media.estimatedImageTokens, 0);
  if (!safe(mediaTransportAllowanceBytes) || !safe(estimatedImageTokens)) throw new CompleteSemCandidateRequestEstimatorError("selected-media accounting exceeds safe integer bounds");
  return { mediaTransportAllowanceBytes, estimatedImageTokens, selectedMediaSha256: sha256(stableJson(ordered)) };
}

/**
 * Measures one fully composed, already-selected request.  It is deliberately
 * pure: no BSS reader, persistence, partitioner, provider, or execution seam
 * is reachable from this function.
 */
export function estimateCompleteSemCandidateRequest(input: Readonly<{
  candidatePacket: StepwiseSourcePacket;
  selectedMedia?: readonly SelectedSemMediaAllowance[];
  configuration: CompleteSemCandidateRequestEstimatorConfiguration;
}>): CompleteSemCandidateRequestEstimate {
  validateConfiguration(input.configuration);
  const request = buildStepwiseRelationshipEnvelopeRequest(input.candidatePacket);
  if (sha256(request.sourceSpecification) !== request.sourceSpecificationSha256) {
    throw new CompleteSemCandidateRequestEstimatorError("canonical source specification hash does not match its bytes");
  }
  const media = selectedMediaAccounting(input.candidatePacket, input.selectedMedia ?? []);
  const systemPromptBytes = utf8(request.systemPrompt);
  const sourceSpecificationBytes = utf8(request.sourceSpecification);
  const schemaAllowanceBytes = utf8(stableJson(request.responseSchema));
  const textBearingRequestBytes = systemPromptBytes + sourceSpecificationBytes + schemaAllowanceBytes + input.configuration.framingAllowanceBytes;
  const requestBytes = textBearingRequestBytes + media.mediaTransportAllowanceBytes + input.configuration.requestByteSafetyMargin;
  const estimatedTextTokens = Math.ceil(textBearingRequestBytes / input.configuration.inputBytesPerToken);
  const inputTokens = estimatedTextTokens + media.estimatedImageTokens + input.configuration.inputTokenSafetyMargin;
  const prospectiveTokenDemand = inputTokens + input.configuration.reservedOutputTokens;
  if (![systemPromptBytes, sourceSpecificationBytes, schemaAllowanceBytes, textBearingRequestBytes, requestBytes, estimatedTextTokens, inputTokens, prospectiveTokenDemand].every(safe)) {
    throw new CompleteSemCandidateRequestEstimatorError("request measurement exceeds safe integer bounds");
  }
  const requestResourceEnvelope = parseRequestResourceEnvelope({
    requestUnits: input.configuration.requestResourceEnvelope.requestUnits,
    tokenUnits: prospectiveTokenDemand,
    dayUnits: input.configuration.requestResourceEnvelope.dayUnits,
    concurrencyUnits: input.configuration.requestResourceEnvelope.concurrencyUnits,
  });
  const configurationSha256 = sha256(stableJson(input.configuration));
  return freeze({
    version: conservativeLogicalRequestBytesVersion,
    requestBytes,
    inputTokens,
    reservedOutputTokens: input.configuration.reservedOutputTokens,
    prospectiveTokenDemand,
    requestResourceEnvelope,
    components: {
      systemPromptBytes,
      sourceSpecificationBytes,
      schemaAllowanceBytes,
      framingAllowanceBytes: input.configuration.framingAllowanceBytes,
      mediaTransportAllowanceBytes: media.mediaTransportAllowanceBytes,
      requestByteSafetyMargin: input.configuration.requestByteSafetyMargin,
      textBearingRequestBytes,
      estimatedTextTokens,
      estimatedImageTokens: media.estimatedImageTokens,
      inputTokenSafetyMargin: input.configuration.inputTokenSafetyMargin,
    },
    provenance: {
      sourcePacket: { version: input.candidatePacket.version, sourceSpecificationSha256: request.sourceSpecificationSha256 },
      semRequest: { profile: request.profile, profileSha256: request.profileSha256, systemPromptSha256: sha256(request.systemPrompt), responseSchemaSha256: sha256(stableJson(request.responseSchema)) },
      estimator: { ...input.configuration.estimator },
      configuration: { ...input.configuration.configuration, sha256: configurationSha256 },
      selectedMedia: { count: input.selectedMedia?.length ?? 0, sha256: media.selectedMediaSha256 },
    },
  });
}
