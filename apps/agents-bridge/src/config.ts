import { parseDeploymentProfile, parseQualifiedRoutes, type DeploymentProfile, type QualifiedRoute } from "./route-registry.js";
import { doclingOptionProfile, doclingServeVersion, doclingSlimVersion, type DoclingProviderConfig } from "./providers/docling.js";

export type BridgeConfig = {
  readonly host: string;
  readonly port: number;
  readonly version: string;
  readonly deploymentProfile: DeploymentProfile;
  readonly qualifiedRoutes: readonly QualifiedRoute[];
  /** Isolated qualification may exercise a gated route without enabling it for normal admission. */
  readonly qualificationOnly: boolean;
  readonly mistral: {
    readonly apiKey?: string;
    readonly baseUrl: string;
    readonly structuredModel: string;
    readonly chatModel: string;
    readonly ocrModel: string;
    readonly maxDocumentBytes: number;
    readonly maxRequestBytes: number;
    readonly maxResponseBytes: number;
    readonly maxStreamBytes: number;
    readonly timeoutMilliseconds: number;
    readonly retryMaxAttempts: number;
    readonly retryDelayMilliseconds: number;
    readonly zeroDataRetentionApproved: boolean;
  };
  readonly gemini: {
    readonly apiKey?: string;
    readonly baseUrl: string;
    readonly structuredModel: string;
    readonly chatModel: string;
    readonly perceptionModel: string;
    readonly maxDocumentBytes: number;
    readonly maxRequestBytes: number;
    readonly maxResponseBytes: number;
    readonly maxStreamBytes: number;
    readonly timeoutMilliseconds: number;
    readonly zeroDataRetentionApproved: boolean;
  };
  readonly docling: DoclingProviderConfig;
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
  const parsedBaseUrl = (() => {
    try { return new URL(baseUrl); } catch { return undefined; }
  })();
  const insecureLocalProvider = environment.MISTRAL_ALLOW_INSECURE_LOCAL === "true"
    && parsedBaseUrl?.protocol === "http:"
    && (parsedBaseUrl.hostname === "localhost" || parsedBaseUrl.hostname === "127.0.0.1" || parsedBaseUrl.hostname === "mistral-mock");
  if (!/^https:\/\/[^\s]+$/u.test(baseUrl) && !insecureLocalProvider) throw new Error("MISTRAL_API_BASE_URL must be an HTTPS URL unless the explicitly test-only local provider is enabled.");
  const geminiBaseUrl = environment.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com";
  let parsedGeminiUrl: URL;
  try { parsedGeminiUrl = new URL(geminiBaseUrl); } catch { throw new Error("GEMINI_API_BASE_URL must be an absolute HTTPS URL."); }
  if (parsedGeminiUrl.protocol !== "https:" || parsedGeminiUrl.username || parsedGeminiUrl.password || parsedGeminiUrl.search || parsedGeminiUrl.hash) throw new Error("GEMINI_API_BASE_URL must be an HTTPS URL without credentials, query parameters, or fragments.");
  const doclingBaseUrl = environment.DOCLING_BASE_URL ?? "http://docling-serve:5001";
  const parsedDoclingUrl = new URL(doclingBaseUrl);
  const testFaultProxy = environment.DOCLING_ALLOW_TEST_FAULT_PROXY === "true" && parsedDoclingUrl.hostname === "docling-fault";
  if (parsedDoclingUrl.protocol !== "http:" || (!testFaultProxy && parsedDoclingUrl.hostname !== "docling-serve") || parsedDoclingUrl.username || parsedDoclingUrl.password || parsedDoclingUrl.search || parsedDoclingUrl.hash) throw new Error("DOCLING_BASE_URL must be the credential-free Compose-private http://docling-serve endpoint.");
  return {
    host: environment.AGENTS_BRIDGE_HOST ?? "0.0.0.0",
    port,
    version: environment.AGENTS_BRIDGE_VERSION ?? "0.1.0",
    deploymentProfile: parseDeploymentProfile(environment.AGENTS_BRIDGE_DEPLOYMENT_PROFILE),
    qualifiedRoutes: parseQualifiedRoutes(environment.AGENTS_BRIDGE_QUALIFIED_ROUTES),
    qualificationOnly: environment.AGENTS_BRIDGE_QUALIFICATION_ONLY === "true",
    mistral: {
      apiKey: environment.MISTRAL_API_KEY || undefined,
      baseUrl: baseUrl.replace(/\/$/u, ""),
      structuredModel: environment.MISTRAL_STRUCTURED_MODEL ?? "mistral-large-3-25-12",
      chatModel: environment.MISTRAL_CHAT_MODEL ?? "mistral-small-4-0-26-03",
      ocrModel: environment.MISTRAL_OCR_MODEL ?? "mistral-ocr-4-1",
      maxDocumentBytes: boundedPositiveInteger(environment.MISTRAL_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "MISTRAL_MAX_DOCUMENT_BYTES"),
      maxRequestBytes: boundedPositiveInteger(environment.MISTRAL_MAX_REQUEST_BYTES, 2 * 1024 * 1024, "MISTRAL_MAX_REQUEST_BYTES"),
      maxResponseBytes: boundedPositiveInteger(environment.MISTRAL_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "MISTRAL_MAX_RESPONSE_BYTES"),
      maxStreamBytes: boundedPositiveInteger(environment.MISTRAL_MAX_STREAM_BYTES, 10 * 1024 * 1024, "MISTRAL_MAX_STREAM_BYTES"),
      timeoutMilliseconds: boundedPositiveInteger(environment.MISTRAL_TIMEOUT_MS, 30_000, "MISTRAL_TIMEOUT_MS"),
      retryMaxAttempts: boundedPositiveInteger(environment.MISTRAL_RETRY_MAX_ATTEMPTS, 2, "MISTRAL_RETRY_MAX_ATTEMPTS"),
      retryDelayMilliseconds: boundedPositiveInteger(environment.MISTRAL_RETRY_DELAY_MS, 250, "MISTRAL_RETRY_DELAY_MS"),
      zeroDataRetentionApproved: environment.MISTRAL_ZDR_APPROVED === "true",
    },
    gemini: {
      apiKey: environment.GEMINI_API_KEY || undefined,
      baseUrl: geminiBaseUrl.replace(/\/$/u, ""),
      structuredModel: environment.GEMINI_STRUCTURED_MODEL ?? "",
      chatModel: environment.GEMINI_CHAT_MODEL ?? "",
      perceptionModel: environment.GEMINI_PERCEPTION_MODEL ?? "",
      maxDocumentBytes: boundedPositiveInteger(environment.GEMINI_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "GEMINI_MAX_DOCUMENT_BYTES"),
      maxRequestBytes: boundedPositiveInteger(environment.GEMINI_MAX_REQUEST_BYTES, 25 * 1024 * 1024, "GEMINI_MAX_REQUEST_BYTES"),
      maxResponseBytes: boundedPositiveInteger(environment.GEMINI_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "GEMINI_MAX_RESPONSE_BYTES"),
      maxStreamBytes: boundedPositiveInteger(environment.GEMINI_MAX_STREAM_BYTES, 10 * 1024 * 1024, "GEMINI_MAX_STREAM_BYTES"),
      timeoutMilliseconds: boundedPositiveInteger(environment.GEMINI_TIMEOUT_MS, 30_000, "GEMINI_TIMEOUT_MS"),
      zeroDataRetentionApproved: environment.GEMINI_ZDR_APPROVED === "true",
    },
    docling: { baseUrl: doclingBaseUrl.replace(/\/$/u, ""), timeoutMilliseconds: boundedPositiveInteger(environment.DOCLING_TIMEOUT_MS, 20_000, "DOCLING_TIMEOUT_MS"), maxDocumentBytes: boundedPositiveInteger(environment.DOCLING_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "DOCLING_MAX_DOCUMENT_BYTES"), maxResponseBytes: boundedPositiveInteger(environment.DOCLING_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "DOCLING_MAX_RESPONSE_BYTES"), serviceVersion: environment.DOCLING_SERVE_VERSION ?? doclingServeVersion, doclingSlimVersion: environment.DOCLING_SLIM_VERSION ?? doclingSlimVersion, optionProfile: environment.DOCLING_OPTION_PROFILE ?? doclingOptionProfile },
  };
}
