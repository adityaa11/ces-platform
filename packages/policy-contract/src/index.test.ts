import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createPolicyContractRegistry, PolicyResolutionSchema,
  validatePolicyContractRegistry,
  validatePolicyContractRegistrySuccessor,
  validatePolicyResolution } from "./index.js";
import { CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1 as registry } from "./representative-registry.js";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function rehash(value: any) { const { content_hash: _ignored, ...body } = value;
  return { ...body, content_hash: createHash("sha256").update(JSON.stringify(body)).digest("hex") }; }

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
  it("rejects per-Policy authority forgery after content rehashing", () => {
    const changed: any = clone(registry); changed.policies[0].final_publication_hash = "a".repeat(64);
    expect(() => validatePolicyContractRegistry(rehash(changed))).toThrow(/exact final POL-008/u);
  });
  it("rejects semantic duplicate relationships with different IDs", () => {
    const changed: any = clone(registry); changed.relationships.push({ ...changed.relationships[0],
      relationship_id: "relationship.duplicate-endpoints" });
    expect(() => validatePolicyContractRegistry(rehash(changed))).toThrow(/semantic link/u);
  });
  it("rejects targeted semantic violations after content rehashing", () => {
    const cases: Array<{ value: any; message: RegExp }> = [];
    const stale: any = clone(registry); stale.policies[0].taxonomy_revision = "1.2.0";
    cases.push({ value: stale, message: /1\.3\.0|exact final POL-008/u });
    const duplicate: any = clone(registry); duplicate.concerns.push(duplicate.concerns[0]);
    cases.push({ value: duplicate, message: /Concern identities/u });
    const dangling: any = clone(registry); dangling.relationships[0].concern_id = "concern.unknown";
    cases.push({ value: dangling, message: /unknown Concern/u });
    for (const { value, message } of cases)
      expect(() => validatePolicyContractRegistry(rehash(value))).toThrow(message);
  });
  it.each([
    ["project", "Safara-specific access"], ["vendor", "Use AWS authorization"],
    ["framework", "Implement with Spring"], ["stack", "Coordinate through Kafka"],
    ["architecture", "Route through an API gateway"], ["mechanism", "Store in a database"],
  ])("rejects %s terminology with a valid recomputed hash", (_category, wording) => {
    const changed: any = clone(registry); changed.capability_needs[0].required_outcome = wording;
    expect(() => validatePolicyContractRegistry(rehash(changed))).toThrow(/project or implementation/u);
  });
  it("rejects prohibited terminology in every reusable text surface", () => {
    for (const mutate of [
      (value: any) => { value.concerns[0].title = "Docker bypass"; },
      (value: any) => { value.concerns[0].definition = "A MySQL-specific concern"; },
      (value: any) => { value.capability_needs[0].title = "Redis capability"; },
      (value: any) => { value.relationships[0].rationale = "Implemented by Kubernetes"; },
    ]) { const changed: any = clone(registry); mutate(changed);
      expect(() => validatePolicyContractRegistry(rehash(changed))).toThrow(/project or implementation/u); }
  });
  it("rejects a stale outer content hash independently", () => {
    const changed: any = clone(registry); changed.concerns[0].definition = "Changed without rehashing";
    expect(() => validatePolicyContractRegistry(changed)).toThrow(/content hash/u);
  });
  it("requires a new revision for registry content mutation", () => {
    const { content_hash: _ignored, ...body } = registry;
    const changed = createPolicyContractRegistry({ ...body, registry_revision: "1.0.0",
      concerns: body.concerns.map((concern) => ({ ...concern, title: `${concern.title} concern` })) });
    expect(changed.content_hash).not.toBe(registry.content_hash);
    expect(() => validatePolicyContractRegistrySuccessor(changed, registry)).toThrow(/new revision/u);
  });
});
