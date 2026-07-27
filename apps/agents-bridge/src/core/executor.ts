import { randomUUID } from "node:crypto";
import {
  ExecutionContextSchema,
  StructuredGenerationRequestSchema,
  assertPolicyWithinCeilings,
  type AuthenticatedClient,
  type ServiceExecutionCeilings,
} from "./contracts.js";
import {
  AgentRegistry,
  ModelRegistry,
  ProviderRegistry,
  ToolRegistry,
  type ProviderExecutionContext,
} from "./registry.js";

export class BridgeExecutionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface BridgeRegistries {
  readonly agents: AgentRegistry;
  readonly providers: ProviderRegistry;
  readonly models: ModelRegistry;
  readonly tools: ToolRegistry;
}

export async function executeRegisteredAgent(input: {
  readonly agent_id: string;
  readonly agent_version: string;
  readonly value: unknown;
  readonly request_id?: string;
  readonly client: AuthenticatedClient;
  readonly ceilings: ServiceExecutionCeilings;
  readonly registries: BridgeRegistries;
  readonly signal: AbortSignal;
}): Promise<unknown> {
  const agent = input.registries.agents.get(input.agent_id, input.agent_version);
  if (!agent) {
    if (input.registries.agents.hasId(input.agent_id)) {
      throw new BridgeExecutionError(409, "AGENT_VERSION_UNSUPPORTED", "The agent version is unsupported.");
    }
    throw new BridgeExecutionError(404, "AGENT_NOT_FOUND", "The registered agent was not found.");
  }
  const policy = assertPolicyWithinCeilings(agent.execution_policy, input.ceilings);
  const alias = policy.allowed_model_aliases[0]!;
  const model = input.registries.models.get(alias);
  if (!model) throw new BridgeExecutionError(503, "BRIDGE_NOT_READY", "The bridge is not ready.");
  const provider = input.registries.providers.get(model.provider_id);
  if (!provider) throw new BridgeExecutionError(503, "BRIDGE_NOT_READY", "The bridge is not ready.");
  const context = ExecutionContextSchema.parse({
    request_id: input.request_id ?? randomUUID(),
    client_id: input.client.client_id,
    agent_id: agent.id,
    agent_version: agent.version,
    model_alias: alias,
    provider_id: provider.provider_id,
    resolved_model: model.physical_model,
  });
  let validatedInput: unknown;
  try {
    validatedInput = agent.input_schema.parse(input.value);
  } catch {
    throw new BridgeExecutionError(400, "INVALID_REQUEST", "The registered agent input is invalid.");
  }
  if (Buffer.byteLength(JSON.stringify(validatedInput), "utf8") > policy.max_input_bytes) {
    throw new BridgeExecutionError(413, "REQUEST_TOO_LARGE", "The registered agent input is too large.");
  }
  const request = StructuredGenerationRequestSchema.parse(
    agent.buildExecutionRequest(validatedInput, context),
  );
  if (request.model_alias !== alias || request.max_output_tokens > policy.max_output_tokens) {
    throw new BridgeExecutionError(500, "INTERNAL_ERROR", "The registered agent request violates policy.");
  }
  const providerContext: ProviderExecutionContext = {
    ...context,
    signal: AbortSignal.any([input.signal, AbortSignal.timeout(policy.timeout_ms)]),
    resolved_model: model.physical_model,
    max_attempts: policy.max_attempts,
    max_response_bytes: policy.max_output_bytes,
  };
  const response = await abortable(
    provider.executeStructured(request, agent.intermediate_schema, providerContext),
    providerContext.signal,
  );
  const intermediate = agent.intermediate_schema.parse(response.output);
  try {
    const transformed = await agent.transformResult(intermediate, validatedInput, context);
    return agent.output_schema.parse(transformed);
  } catch (caught) {
    if (caught instanceof BridgeExecutionError) throw caught;
    throw new BridgeExecutionError(422, "INVALID_AGENT_RESULT", "The registered agent result is invalid.");
  }
}

async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    throw new BridgeExecutionError(504, "PROVIDER_TIMEOUT", "The provider request timed out.");
  }
  return await new Promise<T>((resolve, reject) => {
    const aborted = () => reject(
      new BridgeExecutionError(504, "PROVIDER_TIMEOUT", "The provider request timed out."),
    );
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
}
