import { KnowledgeGapRouteSchema } from "@company/ces-policy-knowledge-orchestration";
import { z } from "zod";
import { executeRegisteredAgent } from "../core/executor.js";
import type { AgentRegistry, ModelRegistry, ProviderRegistry, ToolRegistry } from "../core/registry.js";
type Route = z.infer<typeof KnowledgeGapRouteSchema>;
type Invocation = Parameters<typeof executeRegisteredAgent>[0];
export function createPolicyKnowledgeReplayExecutor(options: {
  resolve_invocation: (route: Route) => Omit<Invocation, "agent_id" | "agent_version">;
}) { return async (route: Route) => {
  route = KnowledgeGapRouteSchema.parse(route);
  const invocation = options.resolve_invocation(route);
  const output: any = await executeRegisteredAgent({ ...invocation, agent_id: route.agent_id,
    agent_version: "1.0.0" });
  if (!output || typeof output.proposal_hash !== "string")
    throw new Error("Registered knowledge agent did not return a content-addressed proposal");
  return { agent_id: route.agent_id, agent_version: "1.0.0",
    support_evidence_hash: route.support_evidence_hash, proposal_hash: output.proposal_hash };
}; }
export type ReplayRegistries = { agents: AgentRegistry; providers: ProviderRegistry;
  models: ModelRegistry; tools: ToolRegistry };
