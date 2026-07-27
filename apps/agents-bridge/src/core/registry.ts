import type { ZodType } from "zod";
import {
  BridgeIdentifierSchema,
  BridgeVersionSchema,
  ModelAliasSchema,
  StructuredGenerationPolicySchema,
  type ExecutionContext,
  type ModelAlias,
  type StructuredGenerationPolicy,
  type StructuredGenerationRequest,
} from "./contracts.js";

export interface StructuredGenerationAgentDefinition<TInput, TIntermediate, TOutput> {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly mode: "structured-generation";
  readonly input_schema: ZodType<TInput>;
  readonly intermediate_schema: ZodType<TIntermediate>;
  readonly output_schema: ZodType<TOutput>;
  readonly execution_policy: StructuredGenerationPolicy;
  buildExecutionRequest(
    input: TInput,
    context: ExecutionContext,
  ): StructuredGenerationRequest;
  transformResult(
    result: TIntermediate,
    input: TInput,
    context: ExecutionContext,
  ): Promise<TOutput>;
}

export interface StructuredGenerationResponse<TOutput> {
  readonly output: TOutput;
  readonly provider_id: string;
  readonly requested_model_alias: string;
  readonly resolved_model: string;
  readonly finish_reason: "completed";
  readonly usage?: {
    readonly input_tokens?: number;
    readonly output_tokens?: number;
  };
}

export interface ProviderExecutionContext extends ExecutionContext {
  readonly signal: AbortSignal;
  readonly resolved_model: string;
  readonly max_attempts: number;
  readonly max_response_bytes: number;
}

export interface AgentProvider {
  readonly provider_id: string;
  readonly capabilities: readonly string[];
  executeStructured<TOutput>(
    request: StructuredGenerationRequest,
    outputSchema: ZodType<TOutput>,
    context: ProviderExecutionContext,
  ): Promise<StructuredGenerationResponse<TOutput>>;
}

export interface AgentTool<TInput, TOutput> {
  readonly id: string;
  readonly input_schema: ZodType<TInput>;
  readonly output_schema: ZodType<TOutput>;
  execute(input: TInput, context: ExecutionContext): Promise<TOutput>;
}

type AnyAgent = StructuredGenerationAgentDefinition<unknown, unknown, unknown>;

export class AgentRegistry {
  private readonly definitions = new Map<string, AnyAgent>();

  register<TInput, TIntermediate, TOutput>(
    definition: StructuredGenerationAgentDefinition<TInput, TIntermediate, TOutput>,
  ): void {
    if (definition.mode !== "structured-generation") {
      throw new Error(`Unsupported agent execution mode: ${String(definition.mode)}`);
    }
    BridgeIdentifierSchema.parse(definition.id);
    BridgeVersionSchema.parse(definition.version);
    if (definition.description.trim().length === 0) throw new Error("Agent description is required");
    StructuredGenerationPolicySchema.parse(definition.execution_policy);
    if (
      definition.id === "atlas.requirement-extractor"
      && !definition.execution_policy.requires_human_review
    ) {
      throw new Error("Atlas requirement extraction must require human review");
    }
    const key = agentKey(definition.id, definition.version);
    if (this.definitions.has(key)) throw new Error(`Duplicate agent registration: ${key}`);
    this.definitions.set(key, definition as AnyAgent);
  }

  get(id: string, version: string): AnyAgent | undefined {
    return this.definitions.get(agentKey(id, version));
  }

  hasId(id: string): boolean {
    return this.values().some((definition) => definition.id === id);
  }

  values(): readonly AnyAgent[] {
    return [...this.definitions.values()];
  }
}

export class ProviderRegistry {
  private readonly definitions = new Map<string, AgentProvider>();

  register(provider: AgentProvider): void {
    BridgeIdentifierSchema.parse(provider.provider_id);
    for (const capability of provider.capabilities) BridgeIdentifierSchema.parse(capability);
    if (this.definitions.has(provider.provider_id)) {
      throw new Error(`Duplicate provider registration: ${provider.provider_id}`);
    }
    this.definitions.set(provider.provider_id, provider);
  }

  get(id: string): AgentProvider | undefined {
    return this.definitions.get(id);
  }
}

export class ModelRegistry {
  private readonly definitions = new Map<string, ModelAlias>();

  register(value: unknown): void {
    const definition = ModelAliasSchema.parse(value);
    if (this.definitions.has(definition.alias)) {
      throw new Error(`Duplicate model alias registration: ${definition.alias}`);
    }
    this.definitions.set(definition.alias, definition);
  }

  get(alias: string): ModelAlias | undefined {
    return this.definitions.get(alias);
  }
}

export class ToolRegistry {
  private readonly definitions = new Map<string, AgentTool<unknown, unknown>>();

  register<TInput, TOutput>(tool: AgentTool<TInput, TOutput>): void {
    BridgeIdentifierSchema.parse(tool.id);
    if (this.definitions.has(tool.id)) throw new Error(`Duplicate tool registration: ${tool.id}`);
    this.definitions.set(tool.id, tool as AgentTool<unknown, unknown>);
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }
}

export function validateRegistries(input: {
  readonly agents: AgentRegistry;
  readonly providers: ProviderRegistry;
  readonly models: ModelRegistry;
  readonly tools: ToolRegistry;
}): void {
  for (const agent of input.agents.values()) {
    for (const providerId of agent.execution_policy.allowed_providers) {
      if (!input.providers.get(providerId)) {
        throw new Error(`Agent ${agent.id}@${agent.version} references unavailable provider ${providerId}`);
      }
    }
    for (const alias of agent.execution_policy.allowed_model_aliases) {
      const model = input.models.get(alias);
      if (!model) {
        throw new Error(`Agent ${agent.id}@${agent.version} references unavailable model alias ${alias}`);
      }
      if (!agent.execution_policy.allowed_providers.includes(model.provider_id)) {
        throw new Error(`Model alias ${alias} resolves to disallowed provider ${model.provider_id}`);
      }
      if (!model.capabilities.includes("structured-output")) {
        throw new Error(`Model alias ${alias} lacks structured-output capability`);
      }
      const provider = input.providers.get(model.provider_id);
      if (!provider?.capabilities.includes("structured-output")) {
        throw new Error(`Model alias ${alias} lacks a structured-output provider`);
      }
    }
    for (const toolId of agent.execution_policy.allowed_tools) {
      if (!input.tools.has(toolId)) {
        throw new Error(`Agent ${agent.id}@${agent.version} references unavailable tool ${toolId}`);
      }
    }
  }
}

function agentKey(id: string, version: string): string {
  return `${id}@${version}`;
}
