import { CES_POLICY_APPROVED_TAXONOMY_V1_3 } from "@company/ces-policy-taxonomy/final-publication";
import { createPolicyContractRegistry } from "./index.js";

const publication = CES_POLICY_APPROVED_TAXONOMY_V1_3;
const policies = publication.artifact.policies.map(({ policy_id, policy_version, title, obligation, lifecycle }) => ({
  policy_id, policy_version, title, obligation, lifecycle: lifecycle as "approved",
  taxonomy_id: publication.artifact.taxonomy_id as "ces-policy-taxonomy.representative-v1-1",
  taxonomy_revision: publication.artifact.taxonomy_revision as "1.3.0",
  final_publication_id: publication.publication_id, final_publication_hash: publication.publication_hash,
}));

export const CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1 = createPolicyContractRegistry({
  schema_version: "1.0.0", registry_id: "ces-policy-contract.representative-v1",
  registry_revision: "1.0.0", predecessor_revision: null, lifecycle: "candidate",
  approved_taxonomy: { taxonomy_revision: "1.3.0", publication_id: publication.publication_id,
    publication_hash: publication.publication_hash }, policies,
  concerns: [{ concern_id: "concern.object-authorization-bypass", concern_version: "1.0.0",
    title: "Object authorization bypass",
    definition: "A subject may access a resource when object-level authorization is not enforced.",
    lifecycle: "candidate", provenance: { canonical_concept_id: "ces.object-authorization-bypass",
      canonical_vocabulary_revision: "1.5.0" } }],
  capability_needs: [{ capability_need_id: "capability-need.resource-authorization-enforcement",
    capability_need_version: "1.0.0", title: "Resource authorization enforcement",
    required_outcome: "The eventual solution must be capable of enforcing approved authorization for each protected resource access.",
    lifecycle: "candidate", provenance: { authority_id: "ces-policies.frozen-context-v1-1",
      concern_id: "concern.object-authorization-bypass" } }],
  relationships: [
    { relationship_id: "relationship.access-authorization.object-bypass",
      relationship_kind: "policy_addresses_concern", policy_id: "policy.access-authorization",
      concern_id: "concern.object-authorization-bypass",
      rationale: "Unauthorized object access is a reusable violation concern under the approved access-authorization obligation." },
    { relationship_id: "relationship.object-bypass.resource-authorization",
      relationship_kind: "concern_requires_capability", concern_id: "concern.object-authorization-bypass",
      capability_need_id: "capability-need.resource-authorization-enforcement",
      rationale: "Addressing object-authorization bypass requires the eventual solution to enforce approved authorization at resource access." },
  ],
});
