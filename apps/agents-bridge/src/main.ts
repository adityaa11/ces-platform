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
import { createAtlasSemanticFactExtractor } from "./agents/atlas-semantic-fact-extractor/agent.js";
import { createAtlasProjectRelationshipExtractor } from
  "./agents/atlas-project-relationship-extractor/agent.js";
import { createPolicyTaxonomyAgent } from "./agents/policy-taxonomy-agent/agent.js";
import { resolveAcceptedPolicyTaxonomyKnowledge } from
  "./agents/policy-taxonomy-agent/governed-knowledge.js";
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
  agents.register(createAtlasSemanticFactExtractor({
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
  agents.register(createAtlasProjectRelationshipExtractor({
    model_alias: environment.ATLAS_MODEL_ALIAS ?? "atlas-default",
    provider_id: provider.provider_id,
    policy: { timeout_ms: config.ceilings.max_timeout_ms,
      max_attempts: config.ceilings.max_provider_attempts,
      max_input_bytes: config.ceilings.max_request_bytes,
      max_output_bytes: config.ceilings.max_provider_response_bytes,
      max_output_tokens: config.ceilings.max_output_tokens },
  }));
  agents.register(createPolicyTaxonomyAgent({
    model_alias: environment.POLICY_MODEL_ALIAS ?? environment.ATLAS_MODEL_ALIAS ?? "atlas-default",
    provider_id: provider.provider_id,
    resolve_governed_knowledge: resolveAcceptedPolicyTaxonomyKnowledge,
    policy: { timeout_ms: config.ceilings.max_timeout_ms,
      max_attempts: config.ceilings.max_provider_attempts,
      max_input_bytes: config.ceilings.max_request_bytes,
      max_output_bytes: config.ceilings.max_provider_response_bytes,
      max_output_tokens: config.ceilings.max_output_tokens },
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
  const policyAlias = environment.POLICY_MODEL_ALIAS ?? alias;
  if (policyAlias !== alias) {
    const policyPhysicalModel = geminiConfig.models[policyAlias];
    if (!policyPhysicalModel) {
      throw new Error(`Gemini model alias is not configured: ${policyAlias}`);
    }
    models.register({ alias: policyAlias, provider_id: provider.provider_id,
      physical_model: policyPhysicalModel, capabilities: ["structured-output"] });
  }
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
