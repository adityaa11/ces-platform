import { parseDeploymentProfile, parseQualifiedRoutes, type DeploymentProfile, type QualifiedRoute } from "./route-registry.js";
import { doclingOptionProfile, doclingServeVersion, doclingSlimVersion, type DoclingProviderConfig } from "./providers/docling.js";
import { loadGenericHandoffHttpTransportConfig, type GenericHandoffHttpTransportConfig } from "./ghr/http-transport-config.js";

export type BridgeConfig = {
  readonly host: string;
  readonly port: number;
  readonly version: string;
  readonly deploymentProfile: DeploymentProfile;
  readonly qualifiedRoutes: readonly QualifiedRoute[];
  /** Isolated qualification may exercise a gated route without enabling it for normal admission. */
  readonly qualificationOnly: boolean;
  readonly docling: DoclingProviderConfig;
  /** Deployment-owned internal GHR delivery transport configuration. */
  readonly genericHandoffHttpTransport?: GenericHandoffHttpTransportConfig;
};

function boundedPositiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

export function loadBridgeConfig(environment: NodeJS.ProcessEnv = process.env): BridgeConfig {
  const port = Number(environment.AGENTS_BRIDGE_PORT ?? "3002");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("AGENTS_BRIDGE_PORT must be a valid TCP port.");
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
    docling: { baseUrl: doclingBaseUrl.replace(/\/$/u, ""), timeoutMilliseconds: boundedPositiveInteger(environment.DOCLING_TIMEOUT_MS, 20_000, "DOCLING_TIMEOUT_MS"), maxDocumentBytes: boundedPositiveInteger(environment.DOCLING_MAX_DOCUMENT_BYTES, 20 * 1024 * 1024, "DOCLING_MAX_DOCUMENT_BYTES"), maxResponseBytes: boundedPositiveInteger(environment.DOCLING_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, "DOCLING_MAX_RESPONSE_BYTES"), serviceVersion: environment.DOCLING_SERVE_VERSION ?? doclingServeVersion, doclingSlimVersion: environment.DOCLING_SLIM_VERSION ?? doclingSlimVersion, optionProfile: environment.DOCLING_OPTION_PROFILE ?? doclingOptionProfile },
    genericHandoffHttpTransport: loadGenericHandoffHttpTransportConfig(environment),
  };
}
