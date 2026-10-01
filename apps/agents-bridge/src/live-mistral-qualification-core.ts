import { type BridgeConfig } from "./config.js";
import { type ProviderProvenance } from "./providers/mistral.js";

type StructuredProvider = {
  structured(input: {
    readonly messages: readonly { readonly role: "system" | "user" | "assistant" | "tool"; readonly content: string }[];
    readonly schema: Readonly<Record<string, unknown>>;
    readonly signal: AbortSignal;
  }): Promise<{ readonly value: unknown; readonly provenance: ProviderProvenance }>;
};

export type LiveQualificationRecord = {
  readonly qualification: "idser-011-01";
  readonly outcome: "success" | "failure";
  readonly credentialPresent: boolean;
  readonly configured: {
    readonly provider: "mistral";
    readonly baseUrlOrigin: string;
    readonly structuredModel: string;
    readonly chatModel: string;
    readonly ocrModel: string;
    readonly zeroDataRetentionApproved: boolean;
    readonly limits: Readonly<Record<string, number>>;
    readonly retry: Readonly<Record<string, number>>;
  };
  readonly actual?: Pick<ProviderProvenance, "provider" | "model" | "endpoint" | "attempt">;
  readonly errorCode?: string;
};

export function configuredQualificationRecord(config: BridgeConfig): LiveQualificationRecord["configured"] {
  return {
    provider: "mistral",
    // URL.origin deliberately excludes any user-info that an accidental local
    // configuration might contain; this command must be safe to archive.
    baseUrlOrigin: new URL(config.mistral.baseUrl).origin,
    structuredModel: config.mistral.structuredModel,
    chatModel: config.mistral.chatModel,
    ocrModel: config.mistral.ocrModel,
    zeroDataRetentionApproved: config.mistral.zeroDataRetentionApproved,
    limits: {
      maxDocumentBytes: config.mistral.maxDocumentBytes,
      maxRequestBytes: config.mistral.maxRequestBytes,
      maxResponseBytes: config.mistral.maxResponseBytes,
      maxStreamBytes: config.mistral.maxStreamBytes,
      timeoutMilliseconds: config.mistral.timeoutMilliseconds,
    },
    retry: {
      maxAttempts: config.mistral.retryMaxAttempts,
      delayMilliseconds: config.mistral.retryDelayMilliseconds,
    },
  };
}

/** Runs one content-free structured call through the exact configured Mistral adapter. */
export async function qualifyLiveMistral(config: BridgeConfig, provider: StructuredProvider): Promise<LiveQualificationRecord> {
  const base = {
    qualification: "idser-011-01" as const,
    credentialPresent: Boolean(config.mistral.apiKey),
    configured: configuredQualificationRecord(config),
  };
  try {
    const result = await provider.structured({
      messages: [{ role: "user", content: "Return the requested JSON object." }],
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { qualified: { type: "boolean" } },
        required: ["qualified"],
      },
      signal: AbortSignal.timeout(config.mistral.timeoutMilliseconds),
    });
    return {
      ...base,
      outcome: "success",
      actual: {
        provider: result.provenance.provider,
        model: result.provenance.model,
        endpoint: result.provenance.endpoint,
        attempt: result.provenance.attempt,
      },
    };
  } catch (error) {
    return {
      ...base,
      outcome: "failure",
      errorCode: error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "unknown",
    };
  }
}
