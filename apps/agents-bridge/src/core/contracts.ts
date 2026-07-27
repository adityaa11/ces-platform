import { z } from "zod";

export const AGENTS_BRIDGE_CONTRACT_VERSION = "1.0.0" as const;
export const CANONICAL_AGENT_ROUTE = "/v1/agents/:agentId/execute" as const;
export const ATLAS_COMPATIBILITY_ROUTE = "/v1/atlas/analyze" as const;

export const BridgeIdentifierSchema = z.string().trim()
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u);
export const BridgeVersionSchema = z.string().trim().regex(/^\d+\.\d+\.\d+$/u);
const PositiveIntegerSchema = z.number().int().positive();

export const AgentExecutionModeSchema = z.enum([
  "structured-generation",
  "tool-assisted",
  "remote-agent",
  "deterministic",
]);

export const StructuredGenerationPolicySchema = z.object({
  allowed_providers: z.array(BridgeIdentifierSchema).min(1),
  allowed_model_aliases: z.array(BridgeIdentifierSchema).min(1),
  allowed_tools: z.array(BridgeIdentifierSchema).default([]),
  timeout_ms: PositiveIntegerSchema,
  max_attempts: PositiveIntegerSchema,
  max_input_bytes: PositiveIntegerSchema,
  max_output_bytes: PositiveIntegerSchema,
  max_output_tokens: PositiveIntegerSchema,
  requires_structured_output: z.literal(true),
  requires_human_review: z.boolean(),
}).strict();

export const ServiceExecutionCeilingsSchema = z.object({
  max_request_bytes: PositiveIntegerSchema,
  max_source_documents: PositiveIntegerSchema,
  max_total_source_characters: PositiveIntegerSchema,
  max_single_source_characters: PositiveIntegerSchema,
  max_provider_response_bytes: PositiveIntegerSchema,
  max_output_tokens: PositiveIntegerSchema,
  max_provider_attempts: PositiveIntegerSchema,
  max_timeout_ms: PositiveIntegerSchema,
}).strict();

export const ModelAliasSchema = z.object({
  alias: BridgeIdentifierSchema,
  provider_id: BridgeIdentifierSchema,
  physical_model: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u),
  capabilities: z.array(BridgeIdentifierSchema).min(1),
}).strict();

export const AgentMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
}).strict();

export const StructuredGenerationRequestSchema = z.object({
  system_instructions: z.string().min(1),
  messages: z.array(AgentMessageSchema).min(1),
  response_json_schema: z.record(z.string(), z.unknown()),
  model_alias: BridgeIdentifierSchema,
  max_output_tokens: PositiveIntegerSchema,
}).strict();

export const GenericAgentExecutionRequestSchema = z.object({
  agent_version: BridgeVersionSchema,
  input: z.unknown().refine((value) => value !== undefined, "Agent input is required"),
  correlation: z.object({
    request_id: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/u),
  }).strict().optional(),
}).strict();

export const AuthenticatedClientSchema = z.object({
  client_id: BridgeIdentifierSchema,
  audit_identity: z.string().trim().min(1).max(256),
  allowed_agents: z.array(BridgeIdentifierSchema).min(1),
  allowed_routes: z.array(z.string().startsWith("/")).min(1),
  max_concurrency: PositiveIntegerSchema,
  requests_per_minute: PositiveIntegerSchema,
}).strict();

export const ExecutionContextSchema = z.object({
  request_id: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/u),
  client_id: BridgeIdentifierSchema,
  agent_id: BridgeIdentifierSchema,
  agent_version: BridgeVersionSchema,
  model_alias: BridgeIdentifierSchema,
}).strict();

export const BridgeErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "INVALID_ATLAS_REQUEST",
  "AUTHENTICATION_REQUIRED",
  "AUTHENTICATION_FAILED",
  "AGENT_NOT_AUTHORIZED",
  "AGENT_NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "AGENT_VERSION_UNSUPPORTED",
  "REQUEST_TOO_LARGE",
  "INVALID_AGENT_RESULT",
  "BRIDGE_RATE_LIMITED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_REQUEST_FAILED",
  "PROVIDER_RESPONSE_INVALID",
  "PROVIDER_TIMEOUT",
  "INTERNAL_ERROR",
  "BRIDGE_NOT_READY",
]);

export const BridgeErrorEnvelopeSchema = z.object({
  error: z.object({
    code: BridgeErrorCodeSchema,
    message: z.string().trim().min(1).max(256),
    request_id: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/u).optional(),
  }).strict(),
}).strict();

export type StructuredGenerationPolicy = z.infer<typeof StructuredGenerationPolicySchema>;
export type ServiceExecutionCeilings = z.infer<typeof ServiceExecutionCeilingsSchema>;
export type ModelAlias = z.infer<typeof ModelAliasSchema>;
export type StructuredGenerationRequest = z.infer<typeof StructuredGenerationRequestSchema>;
export type AuthenticatedClient = z.infer<typeof AuthenticatedClientSchema>;
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

export function assertPolicyWithinCeilings(
  policyValue: unknown,
  ceilingValue: unknown,
): StructuredGenerationPolicy {
  const policy = StructuredGenerationPolicySchema.parse(policyValue);
  const ceilings = ServiceExecutionCeilingsSchema.parse(ceilingValue);
  const checks = [
    [policy.max_input_bytes, ceilings.max_request_bytes, "max_input_bytes"],
    [policy.max_output_bytes, ceilings.max_provider_response_bytes, "max_output_bytes"],
    [policy.max_output_tokens, ceilings.max_output_tokens, "max_output_tokens"],
    [policy.max_attempts, ceilings.max_provider_attempts, "max_attempts"],
    [policy.timeout_ms, ceilings.max_timeout_ms, "timeout_ms"],
  ] as const;
  for (const [actual, maximum, name] of checks) {
    if (actual > maximum) throw new Error(`Agent policy ${name} exceeds the service ceiling`);
  }
  return policy;
}

export function authorizeAgent(
  clientValue: unknown,
  agentId: string,
  route: string,
): AuthenticatedClient {
  const client = AuthenticatedClientSchema.parse(clientValue);
  if (!client.allowed_agents.includes(agentId)) {
    throw new Error(`Client ${client.client_id} is not authorized for agent ${agentId}`);
  }
  if (!client.allowed_routes.includes(route)) {
    throw new Error(`Client ${client.client_id} is not authorized for route ${route}`);
  }
  return client;
}
