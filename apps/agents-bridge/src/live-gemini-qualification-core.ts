import { normalizePerceptionResult } from "@atlas/core";
import { parseSemanticExtractionResult, parseSemanticReconciliationResult, semanticExtractionResultSchema, semanticReconciliationResultSchema } from "@atlas/contracts";
import { type BridgeConfig } from "./config.js";
import { BridgeProviderError, type DocumentPerceptionProvider, type ProviderProvenance, type StreamingChatProvider, type StructuredReasoningProvider } from "./provider-capabilities.js";

type GeminiCapabilities = StructuredReasoningProvider & DocumentPerceptionProvider & StreamingChatProvider;
type Observation = { readonly model: string; readonly endpoint: string; readonly latencyMilliseconds: number; readonly usagePresent: boolean };
type Failure = { readonly errorCode: string };

export type GeminiLiveQualificationRecord = {
  readonly qualification: "bss-v2-004";
  readonly outcome: "success" | "failure";
  readonly credentialPresent: boolean;
  readonly configured: {
    readonly provider: "gemini";
    readonly baseUrlOrigin: string;
    readonly structuredModel: string;
    readonly chatModel: string;
    readonly perceptionModel: string;
    readonly zeroDataRetentionApproved: boolean;
  };
  readonly observations?: {
    readonly minimalInference?: Observation;
    readonly extraction?: Observation;
    readonly reconciliation?: Observation;
    readonly perception?: Observation;
    readonly rateLimit: "not_observed";
    readonly evaluationPrivacy: "not_zero_retention_approved" | "zero_retention_approved";
  };
  readonly errorCode?: string;
  readonly failedStep?: "minimalInference" | "extraction" | "reconciliation" | "perception";
};

function observation(provenance: ProviderProvenance): Observation {
  return { model: provenance.model, endpoint: provenance.endpoint, latencyMilliseconds: provenance.latencyMilliseconds, usagePresent: provenance.usage !== undefined };
}

export function configuredGeminiQualificationRecord(config: BridgeConfig): GeminiLiveQualificationRecord["configured"] {
  return {
    provider: "gemini",
    baseUrlOrigin: new URL(config.gemini.baseUrl).origin,
    structuredModel: config.gemini.structuredModel,
    chatModel: config.gemini.chatModel,
    perceptionModel: config.gemini.perceptionModel,
    zeroDataRetentionApproved: config.gemini.zeroDataRetentionApproved,
  };
}

// This is a public-domain, one-page synthetic PDF. Its only content is the
// qualification sentence below; no customer or Atlas source material is sent.
const syntheticPdf = new TextEncoder().encode("%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 78>>stream\nBT /F1 14 Tf 72 720 Td (Synthetic qualification: approval threshold is 40.) Tj ET\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF");

const minimalSchema = { type: "object", additionalProperties: false, required: ["qualified"], properties: { qualified: { type: "boolean" } } } as const;
const messages = (instruction: string) => [{ role: "system" as const, content: "Return only JSON matching the provided Atlas schema." }, { role: "user" as const, content: instruction }];

function errorCode(error: unknown): string {
  // Cross-module test runners can duplicate the error class; retain only the
  // stable code, never a provider-supplied message or body.
  return error instanceof BridgeProviderError || (typeof error === "object" && error !== null && typeof (error as { readonly code?: unknown }).code === "string")
    ? (error as { readonly code: string }).code
    : "unknown";
}

/**
 * Runs the exact configured adapter against only synthetic content. The record
 * intentionally omits source bytes, prompts, response bodies, credentials,
 * headers, and provider account details so it can be retained as evidence.
 */
export async function qualifyLiveGemini(config: BridgeConfig, provider: GeminiCapabilities): Promise<GeminiLiveQualificationRecord> {
  const base = { qualification: "bss-v2-004" as const, credentialPresent: Boolean(config.gemini.apiKey), configured: configuredGeminiQualificationRecord(config) };
  if (!config.gemini.apiKey) return { ...base, outcome: "failure", errorCode: "authentication" };
  const observations: { minimalInference?: Observation; extraction?: Observation; reconciliation?: Observation; perception?: Observation; rateLimit: "not_observed"; evaluationPrivacy: "not_zero_retention_approved" | "zero_retention_approved" } = { rateLimit: "not_observed", evaluationPrivacy: config.gemini.zeroDataRetentionApproved ? "zero_retention_approved" : "not_zero_retention_approved" };
  let failedStep: NonNullable<GeminiLiveQualificationRecord["failedStep"]> = "minimalInference";
  try {
    const minimal = await provider.structured({ messages: messages("Set qualified to true."), schema: minimalSchema, signal: AbortSignal.timeout(config.gemini.timeoutMilliseconds) });
    observations.minimalInference = observation(minimal.provenance);
    failedStep = "extraction";
    const extraction = await provider.structured({ messages: messages("Extract the one synthetic approval rule."), schema: semanticExtractionResultSchema, signal: AbortSignal.timeout(config.gemini.timeoutMilliseconds) });
    parseSemanticExtractionResult(extraction.value);
    observations.extraction = observation(extraction.provenance);
    failedStep = "reconciliation";
    const reconciliation = await provider.structured({ messages: messages("Reconcile the synthetic candidate as a new relationship."), schema: semanticReconciliationResultSchema, signal: AbortSignal.timeout(config.gemini.timeoutMilliseconds) });
    parseSemanticReconciliationResult(reconciliation.value);
    observations.reconciliation = observation(reconciliation.provenance);
    failedStep = "perception";
    const perception = await provider.perceive({ bytes: syntheticPdf, mimeType: "application/pdf" }, AbortSignal.timeout(config.gemini.timeoutMilliseconds));
    normalizePerceptionResult({ executionId: "bss-v2-004-live", artifactId: "synthetic-public-pdf", sourceSha256: "a".repeat(64), provider: { provider: perception.provenance.provider, processor: perception.provenance.model, executionId: "bss-v2-004-live", processedAt: "2026-10-02T00:00:00.000Z" }, result: perception.providerResult as { pages: readonly unknown[] } });
    observations.perception = observation(perception.provenance);
    return { ...base, outcome: "success", observations };
  } catch (error) {
    return { ...base, outcome: "failure", observations, failedStep, errorCode: errorCode(error) };
  }
}
