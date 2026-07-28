import { z } from "zod";
import {
  AuthenticatedClientSchema,
  ServiceExecutionCeilingsSchema,
  type AuthenticatedClient,
  type ServiceExecutionCeilings,
} from "../core/contracts.js";

const RuntimeClientSchema = z.object({
  identity: AuthenticatedClientSchema,
  credentials: z.array(z.string().min(16)).min(1),
}).strict();

const RuntimeConfigSchema = z.object({
  host: z.string().trim().min(1),
  port: z.number().int().min(0).max(65535),
  request_timeout_ms: z.number().int().positive(),
  ceilings: ServiceExecutionCeilingsSchema,
  clients: z.array(RuntimeClientSchema).min(1),
  provider_max_concurrency: z.number().int().positive().default(16),
  atlas: z.object({
    legacy_model: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u),
    agent_version: z.literal("1.0.0"),
  }).strict().optional(),
}).strict();

export interface RuntimeClient {
  readonly identity: AuthenticatedClient;
  readonly credentials: readonly string[];
}

export interface BridgeRuntimeConfig {
  readonly host: string;
  readonly port: number;
  readonly request_timeout_ms: number;
  readonly ceilings: ServiceExecutionCeilings;
  readonly clients: readonly RuntimeClient[];
  readonly provider_max_concurrency: number;
  readonly atlas?: {
    readonly legacy_model: string;
    readonly agent_version: "1.0.0";
  };
}

export function parseRuntimeConfig(value: unknown): BridgeRuntimeConfig {
  const config = RuntimeConfigSchema.parse(value);
  const allCredentials = config.clients.flatMap(({ credentials }) => credentials);
  const credentials = new Set(allCredentials);
  const clientIds = new Set(config.clients.map(({ identity }) => identity.client_id));
  if (credentials.size !== allCredentials.length) throw new Error("Duplicate bridge credential");
  if (clientIds.size !== config.clients.length) throw new Error("Duplicate bridge client ID");
  if (config.request_timeout_ms > config.ceilings.max_timeout_ms) {
    throw new Error("Request timeout exceeds the service ceiling");
  }
  if (config.ceilings.max_single_source_characters > config.ceilings.max_total_source_characters) {
    throw new Error("Single-source character limit exceeds the aggregate limit");
  }
  return {
    host: config.host,
    port: config.port,
    request_timeout_ms: config.request_timeout_ms,
    ceilings: config.ceilings,
    clients: config.clients,
    provider_max_concurrency: config.provider_max_concurrency,
    ...(config.atlas ? { atlas: config.atlas } : {}),
  };
}

export function runtimeConfigFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): BridgeRuntimeConfig {
  const configuredClients = environment.AGENTS_BRIDGE_CLIENTS_JSON
    ? JSON.parse(environment.AGENTS_BRIDGE_CLIENTS_JSON) as unknown
    : [{
      credentials: [required(environment, "AGENTS_BRIDGE_API_KEY")],
      identity: {
        client_id: "atlas-cli",
        audit_identity: "Atlas CLI",
        allowed_agents: ["atlas.requirement-extractor", "atlas.structure-classifier"],
        allowed_routes: ["/v1/atlas/analyze", "/v1/agents/:agentId/execute"],
        max_concurrency: integer(environment.CLIENT_MAX_CONCURRENCY, 4),
        requests_per_minute: integer(environment.CLIENT_REQUESTS_PER_MINUTE, 60),
      },
    }];
  return parseRuntimeConfig({
    host: environment.HOST ?? "0.0.0.0",
    port: integer(environment.PORT, 8787),
    request_timeout_ms: integer(environment.REQUEST_TIMEOUT_MS, 90_000),
    ceilings: {
      max_request_bytes: integer(environment.MAX_REQUEST_BYTES, 10_485_760),
      max_source_documents: integer(environment.MAX_SOURCE_DOCUMENTS, 20),
      max_total_source_characters: integer(environment.MAX_TOTAL_SOURCE_CHARACTERS, 5_000_000),
      max_single_source_characters: integer(environment.MAX_SINGLE_SOURCE_CHARACTERS, 1_000_000),
      max_provider_response_bytes: integer(environment.MAX_PROVIDER_RESPONSE_BYTES, 4_194_304),
      max_output_tokens: integer(environment.MAX_OUTPUT_TOKENS, 32_768),
      max_provider_attempts: integer(environment.MAX_PROVIDER_ATTEMPTS, 3),
      max_timeout_ms: integer(environment.MAX_TIMEOUT_MS, 90_000),
    },
    clients: configuredClients,
    provider_max_concurrency: integer(environment.PROVIDER_MAX_CONCURRENCY, 16),
    atlas: {
      legacy_model: environment.GEMINI_MODEL ?? "gemini-2.5-flash",
      agent_version: "1.0.0",
    },
  });
}

function required(environment: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = environment[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integer(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/u.test(value)) throw new Error(`Invalid integer environment value: ${value}`);
  return Number(value);
}
