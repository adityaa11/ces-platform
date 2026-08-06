import { createHash } from "node:crypto";
import { AtlasKnowledgeBundleSchema } from "@company/ces-atlas-knowledge-contracts";
import { z } from "zod";

const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
export const AtlasReviewDecisionSchema = z.object({
  decision_id: Id, proposal_hash: Hash, proposal_revision: z.number().int().positive(),
  subject_id: Id, decision: z.enum(["accepted", "rejected"]), reviewer_id: Id,
  decided_at: z.string().datetime({ offset: true }),
}).strict();
export const AtlasApprovalInputSchema = z.object({ proposal: AtlasKnowledgeBundleSchema,
  decisions: z.array(AtlasReviewDecisionSchema).min(1) }).strict();

export function atlasProposalHash(value: unknown): string {
  const proposal = AtlasKnowledgeBundleSchema.parse(value);
  return `sha256:${createHash("sha256").update(canonical(proposal)).digest("hex")}`;
}
export function atlasReviewSubjects(value: unknown): string[] {
  const proposal = AtlasKnowledgeBundleSchema.parse(value);
  return [...new Set(proposal.knowledge_nodes.flatMap((node) => [node.knowledge_id,
    ...(node.kind === "visualization" ? node.visualization.edges.map(({ graph_edge_id }) =>
      graph_edge_id) : [])]))].sort();
}
export function approveAtlasKnowledge(value: unknown) {
  const input = AtlasApprovalInputSchema.parse(value);
  if (input.proposal.authority.lifecycle !== "proposed")
    throw new Error("Only a proposed Atlas bundle can be approved");
  const proposalHash = atlasProposalHash(input.proposal);
  const subjects = atlasReviewSubjects(input.proposal);
  const allowed = new Set(subjects);
  const decisions = new Map<string, z.infer<typeof AtlasReviewDecisionSchema>>();
  for (const decision of input.decisions) {
    if (decision.proposal_hash !== proposalHash || decision.proposal_revision !== input.proposal.revision)
      throw new Error(`Stale Atlas review decision: ${decision.decision_id}`);
    if (!allowed.has(decision.subject_id))
      throw new Error(`Unknown Atlas review subject: ${decision.subject_id}`);
    if (decisions.has(decision.subject_id))
      throw new Error(`Duplicate Atlas review decision for ${decision.subject_id}`);
    decisions.set(decision.subject_id, decision);
  }
  const missing = subjects.filter((subject) => !decisions.has(subject));
  if (missing.length) throw new Error(`Missing Atlas review decisions: ${missing.join(", ")}`);
  if ([...decisions.values()].some(({ decision }) => decision === "rejected"))
    throw new Error("Rejected Atlas subjects cannot be approved");
  if (input.proposal.knowledge_nodes.some(({ support_status }) => support_status === "review_required"))
    throw new Error("Review-required knowledge must be resolved before approval");
  const decisionIds = [...decisions.values()].map(({ decision_id }) => decision_id).sort();
  const approved = AtlasKnowledgeBundleSchema.parse({ ...input.proposal,
    authority: { lifecycle: "approved", authority: "authoritative",
      approval_decision_ids: decisionIds } });
  return { schema_version: "2.0.0" as const, proposal_hash: proposalHash,
    approved_bundle: approved, audit_history: [...decisions.values()]
      .sort((a, b) => a.decision_id.localeCompare(b.decision_id)) };
}
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, child) => child !== null && typeof child === "object"
    && !Array.isArray(child) ? Object.fromEntries(Object.entries(child)
      .sort(([a], [b]) => a.localeCompare(b))) : child);
}
