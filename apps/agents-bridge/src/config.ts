export type BridgeConfig = {
  readonly host: string;
  readonly port: number;
  readonly version: string;
  readonly mistral: {
    readonly apiKey?: string;
    readonly baseUrl: string;
    readonly structuredModel: string;
    readonly chatModel: string;
    readonly ocrModel: string;
    readonly maxDocumentBytes: number;
    readonly zeroDataRetentionApproved: boolean;
  };
};

function boundedPositiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

export function loadBridgeConfig(environment: NodeJS.ProcessEnv = process.env): BridgeConfig {
  const port = Number(environment.AGENTS_BRIDGE_PORT ?? "3002");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("AGENTS_BRIDGE_PORT must be a valid TCP port.");
  const baseUrl = environment.MISTRAL_API_BASE_URL ?? "https://api.mistral.ai";
  if (!/^https:\/\/[^\s]+$/u.test(baseUrl)) throw new Error("MISTRAL_API_BASE_URL must be an HTTPS URL.");
  return {
    host: environment.AGENTS_BRIDGE_HOST ?? "0.0.0.0",
    port,
    version: environment.AGENTS_BRIDGE_VERSION ?? "0.1.0",
    mistral: {
      apiKey: environment.MISTRAL_API_KEY || undefined,
      baseUrl: baseUrl.replace(/\/$/u, ""),
      structuredModel: environment.MISTRAL_STRUCTURED_MODEL ?? "mistral-large-3-25-12",
      chatModel: environment.MISTRAL_CHAT_MODEL ?? "mistral-small-4-0-26-03",
      ocrModel: environment.MISTRAL_OCR_MODEL ?? "mistral-ocr-4-1",
      maxDocumentBytes: boundedPositiveInteger(environment.MISTRAL_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "MISTRAL_MAX_DOCUMENT_BYTES"),
      zeroDataRetentionApproved: environment.MISTRAL_ZDR_APPROVED === "true",
    },
  };
}
