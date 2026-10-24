import { parseDeploymentProfile, parseQualifiedRoutes, type DeploymentProfile, type QualifiedRoute } from "./route-registry.js";
import { doclingOptionProfile, doclingServeVersion, doclingSlimVersion, type DoclingProviderConfig } from "./providers/docling.js";
import type { AnomanProviderConfig } from "./providers/anoman.js";
import type { RuntimeCapacityConstraintPrincipal } from "./runtime-capacity-constraint.js";
import type { CapacityPlanningSnapshotPrincipal } from "./capacity-planning-snapshot.js";
import { loadGenericHandoffHttpTransportConfig, type GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";
import type { CompleteSemCandidateRequestEstimatorConfiguration } from "./complete-sem-candidate-request-estimator.js";

export type RuntimeCapacityConstraintBinding = RuntimeCapacityConstraintPrincipal & Readonly<{
  credential: string;
}>;
export type CapacityPlanningSnapshotBinding = CapacityPlanningSnapshotPrincipal & Readonly<{ credential: string }>;

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
  readonly anoman: AnomanProviderConfig;
  readonly docling: DoclingProviderConfig;
  /** Deployment-owned internal GHR delivery transport configuration. */
  readonly genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig;
  /** Optional server-owned registrations for the versioned runtime read API. */
  readonly runtimeCapacityConstraint?: Readonly<{
    databaseUrl: string;
    bindings: readonly RuntimeCapacityConstraintBinding[];
  }>;
  /** Server-owned registrations for the BSS-V2-005 planning-only read API. */
  readonly capacityPlanningSnapshot?: Readonly<{ databaseUrl: string; bindings: readonly CapacityPlanningSnapshotBinding[] }>;
  readonly semanticBatchPlanPlanning?: Readonly<{ databaseUrl: string; estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration }>;
};

function boundedPositiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function runtimeCapacityConstraintBindings(value: string | undefined): readonly RuntimeCapacityConstraintBinding[] | undefined {
  if (value === undefined || value === "") return undefined;
  let input: unknown;
  try { input = JSON.parse(value); } catch { throw new Error("AGENTS_BRIDGE_RUNTIME_CAPACITY_CONSTRAINT_PRINCIPALS must be valid JSON."); }
  if (!Array.isArray(input) || input.length === 0) throw new Error("AGENTS_BRIDGE_RUNTIME_CAPACITY_CONSTRAINT_PRINCIPALS must be a non-empty array.");
  const credentials = new Set<string>();
  return input.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error(`Runtime capacity constraint principal ${index} must be an object.`);
    const value = candidate as Record<string, unknown>;
    const fields = ["credential", "principalId", "quotaDomainId", "processId", "processProfileVersion", "routeId"] as const;
    for (const field of fields) if (typeof value[field] !== "string" || value[field].length === 0) throw new Error(`Runtime capacity constraint principal ${index} has an invalid ${field}.`);
    if (value.serviceClass !== "background" && value.serviceClass !== "interactive") throw new Error(`Runtime capacity constraint principal ${index} has an invalid serviceClass.`);
    const credential = value.credential as string;
    if (credentials.has(credential)) throw new Error("Runtime capacity constraint credentials must be unique.");
    credentials.add(credential);
    return { credential, principalId: value.principalId as string, quotaDomainId: value.quotaDomainId as string, processId: value.processId as string, processProfileVersion: value.processProfileVersion as string, routeId: value.routeId as string, serviceClass: value.serviceClass };
  });
}

function capacityPlanningSnapshotBindings(value: string | undefined): readonly CapacityPlanningSnapshotBinding[] | undefined {
  if (value === undefined || value === "") return undefined;
  let input: unknown;
  try { input = JSON.parse(value); } catch { throw new Error("AGENTS_BRIDGE_CAPACITY_PLANNING_SNAPSHOT_PRINCIPALS must be valid JSON."); }
  if (!Array.isArray(input) || input.length === 0) throw new Error("AGENTS_BRIDGE_CAPACITY_PLANNING_SNAPSHOT_PRINCIPALS must be a non-empty array.");
  const credentials = new Set<string>();
  return input.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error(`Capacity planning snapshot principal ${index} must be an object.`);
    const principal = candidate as Record<string, unknown>;
    const fields = ["credential", "principalId", "quotaDomainId", "processId", "processProfileVersion", "routeId"] as const;
    for (const field of fields) if (typeof principal[field] !== "string" || principal[field].length === 0) throw new Error(`Capacity planning snapshot principal ${index} has an invalid ${field}.`);
    if (principal.serviceClass !== "background" && principal.serviceClass !== "interactive") throw new Error(`Capacity planning snapshot principal ${index} has an invalid serviceClass.`);
    if (principal.prospective !== undefined && typeof principal.prospective !== "boolean") throw new Error(`Capacity planning snapshot principal ${index} has an invalid prospective flag.`);
    if (principal.qualificationVersion !== undefined && principal.qualificationVersion !== "v2") throw new Error(`Capacity planning snapshot principal ${index} has an invalid qualificationVersion.`);
    const credential = principal.credential as string;
    if (credentials.has(credential)) throw new Error("Capacity planning snapshot credentials must be unique.");
    credentials.add(credential);
    return { credential, principalId: principal.principalId as string, quotaDomainId: principal.quotaDomainId as string, processId: principal.processId as string, processProfileVersion: principal.processProfileVersion as string, routeId: principal.routeId as string, serviceClass: principal.serviceClass, prospective: principal.prospective === true, qualificationVersion: principal.qualificationVersion as "v2" | undefined };
  });
}

function semanticBatchPlanEstimator(value: string | undefined): CompleteSemCandidateRequestEstimatorConfiguration | undefined {
  if (value === undefined || value === "") return undefined;
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR must be valid JSON."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR must be an object.");
  const config = parsed as Record<string, unknown>;
  const identity = (value: unknown, label: string) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
    const item = value as Record<string, unknown>;
    if (typeof item.identity !== "string" || item.identity.length === 0 || typeof item.version !== "string" || item.version.length === 0) throw new Error(`${label} requires identity and version.`);
    return { identity: item.identity, version: item.version };
  };
  const integer = (name: string) => {
    if (!Number.isSafeInteger(config[name]) || (config[name] as number) < 0) throw new Error(`AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR ${name} must be a non-negative safe integer.`);
    return config[name] as number;
  };
  const envelope = config.requestResourceEnvelope;
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw new Error("AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR requestResourceEnvelope must be an object.");
  const resources = envelope as Record<string, unknown>;
  for (const name of ["requestUnits", "dayUnits", "concurrencyUnits"] as const) if (!Number.isSafeInteger(resources[name]) || (resources[name] as number) < 0) throw new Error(`AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR requestResourceEnvelope.${name} must be a non-negative safe integer.`);
  return { estimator: identity(config.estimator, "estimator"), configuration: identity(config.configuration, "configuration"), inputBytesPerToken: integer("inputBytesPerToken"), framingAllowanceBytes: integer("framingAllowanceBytes"), requestByteSafetyMargin: integer("requestByteSafetyMargin"), inputTokenSafetyMargin: integer("inputTokenSafetyMargin"), reservedOutputTokens: integer("reservedOutputTokens"), requestResourceEnvelope: { requestUnits: resources.requestUnits as number, dayUnits: resources.dayUnits as number, concurrencyUnits: resources.concurrencyUnits as number } };
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
  const runtimeConstraintBindings = runtimeCapacityConstraintBindings(environment.AGENTS_BRIDGE_RUNTIME_CAPACITY_CONSTRAINT_PRINCIPALS);
  const planningSnapshotBindings = capacityPlanningSnapshotBindings(environment.AGENTS_BRIDGE_CAPACITY_PLANNING_SNAPSHOT_PRINCIPALS);
  const runtimeConstraintDatabaseUrl = environment.AGENTS_BRIDGE_DATABASE_URL;
  const genericHandoffHttpTransport = loadGenericHandoffHttpTransportConfig(environment);
  const estimatorConfiguration = semanticBatchPlanEstimator(environment.AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR);
  if ((runtimeConstraintBindings || planningSnapshotBindings || genericHandoffHttpTransport) && !runtimeConstraintDatabaseUrl) throw new Error("AGENTS_BRIDGE_DATABASE_URL is required when capacity-read principals or GHR delivery are configured.");
  if (genericHandoffHttpTransport && (!estimatorConfiguration || !planningSnapshotBindings || planningSnapshotBindings.filter((binding) => binding.prospective === false && binding.qualificationVersion === "v2").length !== 1)) throw new Error("GHR async batch planning requires one non-prospective CapacityPlanningSnapshot/v2 principal and AGENTS_BRIDGE_SEMANTIC_BATCH_PLANNER_ESTIMATOR.");
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
    anoman: {
      apiKey: environment.ANOMAN_API_KEY || undefined,
      baseUrl: "https://api.anoman.io",
      structuredModel: "gemini-2.5-flash",
      maxRequestBytes: boundedPositiveInteger(environment.ANOMAN_MAX_REQUEST_BYTES, 2 * 1024 * 1024, "ANOMAN_MAX_REQUEST_BYTES"),
      maxResponseBytes: boundedPositiveInteger(environment.ANOMAN_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "ANOMAN_MAX_RESPONSE_BYTES"),
      timeoutMilliseconds: boundedPositiveInteger(environment.ANOMAN_TIMEOUT_MS, 30_000, "ANOMAN_TIMEOUT_MS"),
      zeroDataRetentionApproved: environment.ANOMAN_ZDR_APPROVED === "true",
    },
    docling: { baseUrl: doclingBaseUrl.replace(/\/$/u, ""), timeoutMilliseconds: boundedPositiveInteger(environment.DOCLING_TIMEOUT_MS, 20_000, "DOCLING_TIMEOUT_MS"), maxDocumentBytes: boundedPositiveInteger(environment.DOCLING_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "DOCLING_MAX_DOCUMENT_BYTES"), maxResponseBytes: boundedPositiveInteger(environment.DOCLING_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "DOCLING_MAX_RESPONSE_BYTES"), serviceVersion: environment.DOCLING_SERVE_VERSION ?? doclingServeVersion, doclingSlimVersion: environment.DOCLING_SLIM_VERSION ?? doclingSlimVersion, optionProfile: environment.DOCLING_OPTION_PROFILE ?? doclingOptionProfile },
    genericHandoffHttpTransport,
    runtimeCapacityConstraint: runtimeConstraintBindings && runtimeConstraintDatabaseUrl ? { databaseUrl: runtimeConstraintDatabaseUrl, bindings: runtimeConstraintBindings } : undefined,
    capacityPlanningSnapshot: planningSnapshotBindings && runtimeConstraintDatabaseUrl ? { databaseUrl: runtimeConstraintDatabaseUrl, bindings: planningSnapshotBindings } : undefined,
    semanticBatchPlanPlanning: genericHandoffHttpTransport && runtimeConstraintDatabaseUrl && estimatorConfiguration ? { databaseUrl: runtimeConstraintDatabaseUrl, estimatorConfiguration } : undefined,
  };
}
