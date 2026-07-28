import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  validateRegistries,
} from "./core/registry.js";
import { runtimeConfigFromEnvironment } from "./config/environment.js";
import {
  GeminiStructuredGenerationProvider,
  geminiConfigFromEnvironment,
} from "./providers/gemini/index.js";
import { createAtlasRequirementExtractor } from "./agents/atlas-requirement-extractor/agent.js";
import { createAtlasStructureClassifier } from "./agents/atlas-structure-classifier/agent.js";
import { createAtlasCandidateExtractor } from "./agents/atlas-candidate-extractor/agent.js";
import { createJsonTelemetry } from "./operations/telemetry.js";
import { closeBridgeServer, listenBridgeServer, type BridgeRuntime } from "./server.js";

export function createProductionRuntime(
  environment: Readonly<Record<string, string | undefined>>,
  write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
): BridgeRuntime {
  const config = runtimeConfigFromEnvironment(environment);
  const geminiConfig = geminiConfigFromEnvironment(environment);
  const telemetry = createJsonTelemetry(write);
  const provider = new GeminiStructuredGenerationProvider(geminiConfig, {
    fetch,
    sleep: async (milliseconds, signal) => {
      await new Promise<void>((resolveDelay, reject) => {
        const completed = () => {
          signal.removeEventListener("abort", abort);
          resolveDelay();
        };
        const timeout = setTimeout(completed, milliseconds);
        const abort = () => {
          clearTimeout(timeout);
          signal.removeEventListener("abort", abort);
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal.addEventListener("abort", abort, { once: true });
      });
    },
    random: Math.random,
    now: Date.now,
    observe: telemetry.provider,
  });
  const agents = new AgentRegistry();
  agents.register(createAtlasRequirementExtractor({
    model_alias: environment.ATLAS_MODEL_ALIAS ?? "atlas-default",
    provider_id: provider.provider_id,
    policy: {
      timeout_ms: config.ceilings.max_timeout_ms,
      max_attempts: config.ceilings.max_provider_attempts,
      max_input_bytes: config.ceilings.max_request_bytes,
      max_output_bytes: config.ceilings.max_provider_response_bytes,
      max_output_tokens: config.ceilings.max_output_tokens,
    },
    source_limits: {
      max_documents: config.ceilings.max_source_documents,
      max_total_characters: config.ceilings.max_total_source_characters,
      max_single_characters: config.ceilings.max_single_source_characters,
    },
  }));
  agents.register(createAtlasStructureClassifier({
    model_alias: environment.ATLAS_MODEL_ALIAS ?? "atlas-default",
    provider_id: provider.provider_id,
    policy: {
      timeout_ms: config.ceilings.max_timeout_ms,
      max_attempts: config.ceilings.max_provider_attempts,
      max_input_bytes: config.ceilings.max_request_bytes,
      max_output_bytes: config.ceilings.max_provider_response_bytes,
      max_output_tokens: config.ceilings.max_output_tokens,
    },
  }));
  agents.register(createAtlasCandidateExtractor({
    model_alias: environment.ATLAS_MODEL_ALIAS ?? "atlas-default",
    provider_id: provider.provider_id,
    policy: {
      timeout_ms: config.ceilings.max_timeout_ms,
      max_attempts: config.ceilings.max_provider_attempts,
      max_input_bytes: config.ceilings.max_request_bytes,
      max_output_bytes: config.ceilings.max_provider_response_bytes,
      max_output_tokens: config.ceilings.max_output_tokens,
    },
  }));
  const providers = new ProviderRegistry();
  providers.register(provider);
  const models = new ModelRegistry();
  const alias = environment.ATLAS_MODEL_ALIAS ?? "atlas-default";
  const physicalModel = geminiConfig.models[alias];
  if (!physicalModel) throw new Error(`Gemini model alias is not configured: ${alias}`);
  models.register({
    alias,
    provider_id: provider.provider_id,
    physical_model: physicalModel,
    capabilities: ["structured-output"],
  });
  const tools = new ToolRegistry();
  validateRegistries({ agents, providers, models, tools });
  return {
    config,
    registries: { agents, providers, models, tools },
    logger: telemetry.logger,
    metrics: telemetry.metrics,
  };
}

async function main(): Promise<void> {
  const runtime = createProductionRuntime(process.env);
  const server = await listenBridgeServer(runtime);
  const shutdown = () => { void closeBridgeServer(server); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;
if (isMain) await main();
