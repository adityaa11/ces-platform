import { createHash } from "node:crypto";
import { z } from "zod";
import { CES_POLICY_APPROVED_TAXONOMY_V1_3 } from "@company/ces-policy-taxonomy/final-publication";

export const POLICY_CONTRACT_SCHEMA_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Revision = z.string().regex(/^[1-9][0-9]*\.[0-9]+\.[0-9]+$/u);
const Hash = z.string().regex(/^[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);
const CandidateLifecycle = z.literal("candidate");

export const PolicyContractReferenceSchema = z.object({
  policy_id: Id, policy_version: Revision, title: Text, obligation: Text,
  lifecycle: z.literal("approved"), taxonomy_id: z.literal("ces-policy-taxonomy.representative-v1-1"),
  taxonomy_revision: z.literal("1.3.0"), final_publication_id: z.literal(
    "ces-policy-taxonomy.final-pol-008.accepted-v1"), final_publication_hash: Hash,
}).strict();
export const ConcernSchema = z.object({ concern_id: Id, concern_version: Revision,
  title: Text, definition: Text, lifecycle: CandidateLifecycle,
  provenance: z.object({ canonical_concept_id: Id,
    canonical_vocabulary_revision: z.literal("1.5.0") }).strict() }).strict();
export const CapabilityNeedSchema = z.object({ capability_need_id: Id, capability_need_version: Revision,
  title: Text, required_outcome: Text, lifecycle: CandidateLifecycle,
  provenance: z.object({ authority_id: z.literal("ces-policies.frozen-context-v1-1"),
    concern_id: Id }).strict() }).strict();
const PolicyConcernRelationshipSchema = z.object({ relationship_id: Id,
  relationship_kind: z.literal("policy_addresses_concern"), policy_id: Id, concern_id: Id,
  rationale: Text }).strict();
const ConcernCapabilityRelationshipSchema = z.object({ relationship_id: Id,
  relationship_kind: z.literal("concern_requires_capability"), concern_id: Id,
  capability_need_id: Id, rationale: Text }).strict();
export const PolicyKnowledgeRelationshipSchema = z.discriminatedUnion("relationship_kind", [
  PolicyConcernRelationshipSchema, ConcernCapabilityRelationshipSchema]);

export const PolicyContractRegistrySchema = z.object({ schema_version: z.literal(POLICY_CONTRACT_SCHEMA_VERSION),
  registry_id: z.literal("ces-policy-contract.representative-v1"), registry_revision: z.literal("1.0.0"),
  predecessor_revision: z.null(), lifecycle: CandidateLifecycle,
  approved_taxonomy: z.object({ taxonomy_revision: z.literal("1.3.0"),
    publication_id: z.literal("ces-policy-taxonomy.final-pol-008.accepted-v1"), publication_hash: Hash }).strict(),
  policies: z.array(PolicyContractReferenceSchema).length(6), concerns: z.array(ConcernSchema).min(1),
  capability_needs: z.array(CapabilityNeedSchema).min(1),
  relationships: z.array(PolicyKnowledgeRelationshipSchema).min(1), content_hash: Hash,
}).strict().superRefine((value, context) => {
  const { content_hash: contentHash, ...body } = value;
  if (stableHash(body) !== contentHash) issue(context, "Registry content hash does not match contents");
  unique(value.policies.map(({ policy_id }) => policy_id), "Policy", context);
  unique(value.concerns.map(({ concern_id }) => concern_id), "Concern", context);
  unique(value.capability_needs.map(({ capability_need_id }) => capability_need_id), "Capability Need", context);
  unique(value.relationships.map(({ relationship_id }) => relationship_id), "Relationship", context);
  const policies = new Set(value.policies.map(({ policy_id }) => policy_id));
  const concerns = new Set(value.concerns.map(({ concern_id }) => concern_id));
  const capabilities = new Set(value.capability_needs.map(({ capability_need_id }) => capability_need_id));
  for (const relationship of value.relationships) {
    if (!concerns.has(relationship.concern_id)) issue(context, "Relationship has unknown Concern endpoint");
    if (relationship.relationship_kind === "policy_addresses_concern" && !policies.has(relationship.policy_id))
      issue(context, "Relationship has unknown Policy endpoint");
    if (relationship.relationship_kind === "concern_requires_capability" &&
        !capabilities.has(relationship.capability_need_id)) issue(context, "Relationship has unknown Capability endpoint");
  }
  const serialized = JSON.stringify({ concerns: value.concerns, capability_needs: value.capability_needs,
    relationships: value.relationships }).toLowerCase();
  if (["safara", "atlas", "react", "laravel", "postgresql", "database", "framework", "ui component"]
    .some((term) => serialized.includes(term))) issue(context, "Registry contains project or implementation terminology");
});

export const ApplicabilitySchema = z.enum(["APPLICABLE", "NOT_APPLICABLE", "UNDETERMINED"]);
const ResolutionBase = z.object({ policy_id: Id, applicability: ApplicabilitySchema }).strict();
export const PolicyResolutionSchema = z.discriminatedUnion("resolution_state", [
  ResolutionBase.extend({ resolution_state: z.literal("DEFINED"),
    existing_information_refs: z.array(Id).min(1), ces_selected_answer: z.literal(false) }).strict(),
  ResolutionBase.extend({ resolution_state: z.literal("AWARENESS_REQUIRED"),
    required_outcome: Text, implementation_status: z.literal("not_decided") }).strict(),
  ResolutionBase.extend({ resolution_state: z.literal("DECISION_REQUIRED"),
    missing_decision_class: z.enum(["business", "legal", "architecture", "organizational"]),
    affected_scope_refs: z.array(Id).min(1), selected_answer: z.null(), downstream_blocking: z.literal(true) }).strict(),
]);

export function createPolicyContractRegistry(input: Omit<z.input<typeof PolicyContractRegistrySchema>, "content_hash">) {
  return validatePolicyContractRegistry({ ...input, content_hash: stableHash(input) });
}
export function validatePolicyContractRegistry(value: unknown) {
  const registry = PolicyContractRegistrySchema.parse(value);
  const publication = CES_POLICY_APPROVED_TAXONOMY_V1_3;
  if (registry.approved_taxonomy.publication_hash !== publication.publication_hash ||
      registry.approved_taxonomy.publication_id !== publication.publication_id ||
      JSON.stringify(registry.policies.map(({ taxonomy_id: _taxonomyId, taxonomy_revision: _taxonomyRevision,
        final_publication_id: _publicationId, final_publication_hash: _publicationHash, ...policy }) => policy)) !==
      JSON.stringify(publication.artifact.policies.map(({ approval: _approval,
        technology_independence: _technologyIndependence, canonical_support: _canonicalSupport, ...policy }) => policy)))
    throw new Error("Policy contract must preserve the exact final POL-008 publication and Policies");
  return registry;
}
export function validatePolicyContractRegistrySuccessor(value: unknown, predecessorValue: unknown) {
  const valueRegistry = validatePolicyContractRegistry(value);
  const predecessor = validatePolicyContractRegistry(predecessorValue);
  if (valueRegistry.registry_id !== predecessor.registry_id) throw new Error("Registry identity must be preserved");
  if (valueRegistry.content_hash !== predecessor.content_hash &&
      valueRegistry.registry_revision === predecessor.registry_revision)
    throw new Error("Registry content mutation requires a new revision");
  return valueRegistry;
}
export function validatePolicyResolution(value: unknown, registryValue: unknown) {
  const registry = validatePolicyContractRegistry(registryValue);
  const resolution = PolicyResolutionSchema.parse(value);
  if (!registry.policies.some(({ policy_id }) => policy_id === resolution.policy_id))
    throw new Error(`Resolution references unknown Policy ${resolution.policy_id}`);
  if (resolution.applicability === "NOT_APPLICABLE" && resolution.resolution_state !== "DEFINED")
    throw new Error("Non-applicability must be explicitly defined by existing information");
  return resolution;
}
function stableHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function unique(values: readonly string[], label: string, context: z.RefinementCtx) {
  if (new Set(values).size !== values.length) issue(context, `${label} identities must be unique`); }
function issue(context: z.RefinementCtx, message: string) { context.addIssue({ code: "custom", message }); }

export type PolicyContractRegistry = z.infer<typeof PolicyContractRegistrySchema>;
export type PolicyResolution = z.infer<typeof PolicyResolutionSchema>;
