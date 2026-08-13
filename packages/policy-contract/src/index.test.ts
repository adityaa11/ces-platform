import { describe, expect, it } from "vitest";
import { createPolicyContractRegistry, PolicyResolutionSchema,
  validatePolicyContractRegistry,
  validatePolicyContractRegistrySuccessor,
  validatePolicyResolution } from "./index.js";
import { CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1 as registry } from "./representative-registry.js";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("POL-009 Policy contract", () => {
  it("binds all six approved Policies to final POL-008 authority", () => {
    expect(registry.policies).toHaveLength(6);
    expect(new Set(registry.policies.map(({ taxonomy_revision }) => taxonomy_revision))).toEqual(new Set(["1.3.0"]));
    expect(registry.policies.every(({ lifecycle, final_publication_id, final_publication_hash }) =>
      lifecycle === "approved" && final_publication_id === "ces-policy-taxonomy.final-pol-008.accepted-v1" &&
      final_publication_hash === registry.approved_taxonomy.publication_hash)).toBe(true);
    expect(registry.lifecycle).toBe("candidate");
  });
  it("keeps Policies, Concerns, and Capability Needs distinct and reusable", () => {
    expect(registry.concerns[0]).toMatchObject({ concern_id: "concern.object-authorization-bypass",
      provenance: { canonical_concept_id: "ces.object-authorization-bypass" } });
    expect(registry.capability_needs[0]?.required_outcome).toContain("eventual solution");
    expect(registry.relationships.map(({ relationship_kind }) => relationship_kind)).toEqual([
      "policy_addresses_concern", "concern_requires_capability"]);
    expect(JSON.stringify(registry).toLowerCase()).not.toMatch(/safara|atlas|react|laravel|postgresql/u);
  });
  it("models applicability independently from exactly three resolution states", () => {
    const defined = validatePolicyResolution({ policy_id: "policy.access-authorization",
      applicability: "APPLICABLE", resolution_state: "DEFINED",
      existing_information_refs: ["fact.access-rule"], ces_selected_answer: false }, registry);
    const awareness = validatePolicyResolution({ policy_id: "policy.transaction-integrity",
      applicability: "APPLICABLE", resolution_state: "AWARENESS_REQUIRED",
      required_outcome: "The eventual solution must preserve complete-or-restore behavior.",
      implementation_status: "not_decided" }, registry);
    const decision = validatePolicyResolution({ policy_id: "policy.sensitive-data-protection",
      applicability: "UNDETERMINED", resolution_state: "DECISION_REQUIRED",
      missing_decision_class: "legal", affected_scope_refs: ["scope.data-retention"],
      selected_answer: null, downstream_blocking: true }, registry);
    expect([defined.resolution_state, awareness.resolution_state, decision.resolution_state]).toEqual([
      "DEFINED", "AWARENESS_REQUIRED", "DECISION_REQUIRED"]);
    expect(() => PolicyResolutionSchema.parse({ ...defined, applicability: defined.resolution_state })).toThrow();
    expect(() => PolicyResolutionSchema.parse({ ...defined, resolution_state: "resolved" })).toThrow();
  });
  it("fails incomplete state evidence, invented decisions, and unknown Policies", () => {
    expect(() => PolicyResolutionSchema.parse({ policy_id: "policy.access-authorization",
      applicability: "APPLICABLE", resolution_state: "DEFINED", existing_information_refs: [] ,
      ces_selected_answer: false })).toThrow();
    expect(() => PolicyResolutionSchema.parse({ policy_id: "policy.access-authorization",
      applicability: "UNDETERMINED", resolution_state: "DECISION_REQUIRED",
      missing_decision_class: "business", affected_scope_refs: ["scope.one"],
      selected_answer: "invented", downstream_blocking: true })).toThrow();
    expect(() => validatePolicyResolution({ policy_id: "policy.unknown", applicability: "APPLICABLE",
      resolution_state: "AWARENESS_REQUIRED", required_outcome: "Account for it.",
      implementation_status: "not_decided" }, registry)).toThrow(/unknown Policy/u);
  });
  it("fails stale authority, duplicates, dangling links, mutation, and forbidden terminology", () => {
    const cases: any[] = [];
    const stale: any = clone(registry); stale.policies[0].taxonomy_revision = "1.2.0"; cases.push(stale);
    const duplicate: any = clone(registry); duplicate.concerns.push(duplicate.concerns[0]); cases.push(duplicate);
    const dangling: any = clone(registry); dangling.relationships[0].concern_id = "concern.unknown"; cases.push(dangling);
    const changed: any = clone(registry); changed.concerns[0].definition = "Changed"; cases.push(changed);
    const specific: any = clone(registry); specific.capability_needs[0].required_outcome = "Use a PostgreSQL database"; cases.push(specific);
    for (const value of cases) expect(() => validatePolicyContractRegistry(value)).toThrow();
  });
  it("requires a new revision for registry content mutation", () => {
    const { content_hash: _ignored, ...body } = registry;
    const changed = createPolicyContractRegistry({ ...body, registry_revision: "1.0.0",
      concerns: body.concerns.map((concern) => ({ ...concern, title: `${concern.title} concern` })) });
    expect(changed.content_hash).not.toBe(registry.content_hash);
    expect(() => validatePolicyContractRegistrySuccessor(changed, registry)).toThrow(/new revision/u);
  });
});
