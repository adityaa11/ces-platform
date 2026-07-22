import { createHash } from "node:crypto";
import {
  resolveCapabilitiesAndTraits,
  type CapabilityTraitResolution,
} from "@company/ces-capability-resolver";
import {
  PolicyManifestSchema,
  PolicyObligationSchema,
  ResolutionEvidenceSchema,
  type PolicyManifest,
  type PolicyObligation,
  type ResolutionEvidence,
} from "@company/ces-policy-manifest";
import {
  PolicyIdSchema,
  defaultPolicyRegistry,
  type PolicyDefinition,
  type PolicyId,
  type PolicyRegistry,
} from "@company/ces-policy-registry";
import type { ProjectAssuranceContext } from "@company/ces-project-schema";
import {
  getPolicyRelevantRequirement,
  type RequirementPackage,
} from "@company/ces-requirement-schema";

export type PolicyCompilationExitCode = 0 | 3 | 4;

export interface PolicyCompilationInput {
  readonly requirement: RequirementPackage;
  readonly assurance: ProjectAssuranceContext;
  readonly ces_baseline_version: string;
  readonly registry?: PolicyRegistry;
}

export interface PolicyCompilationResult {
  readonly manifest: PolicyManifest;
  readonly exit_code: PolicyCompilationExitCode;
}

interface PolicyContribution {
  readonly policy_id: PolicyId;
  readonly requirement_level: "mandatory" | "conditional" | "prohibited";
  readonly resolution_state: "resolved" | "blocked";
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly reasons: readonly string[];
  readonly evidence: readonly ResolutionEvidence[];
  readonly source_rule_ids: readonly string[];
  readonly business_rule_ids: readonly string[];
  readonly missing_inputs: readonly string[];
}

export function compilePolicyManifest(
  input: PolicyCompilationInput,
): PolicyCompilationResult {
  const registry = input.registry ?? defaultPolicyRegistry;
  validateRegistry(registry);
  const vocabulary = resolveCapabilitiesAndTraits(input.requirement);
  const contributions = resolveRuleContributions(
    input.requirement,
    input.assurance,
    vocabulary,
    registry,
  );
  applyPolicyClosure(contributions, registry.definitions);
  const obligations = mergeContributions(contributions);

  const policyRelevantRequirement = getPolicyRelevantRequirement(input.requirement);
  const inputHash = hashCanonical({
    requirement: policyRelevantRequirement,
    assurance: input.assurance,
  });
  const registryHashInput = {
    version: registry.version,
    definitions: [...registry.definitions].sort(compareById),
    rules: [...registry.rules].sort(compareById),
  };
  const compilationId = hashCanonical({
    input_hash: inputHash,
    capability_registry_version: vocabulary.capability_registry_version,
    trait_registry_version: vocabulary.trait_registry_version,
    policy_registry: registryHashInput,
    ces_baseline_version: input.ces_baseline_version,
  });

  const manifest = PolicyManifestSchema.parse({
    schema_version: "1.0.0",
    compilation_id: compilationId,
    input_hash: inputHash,
    requirement_id: input.requirement.requirement.id,
    ces_baseline_version: input.ces_baseline_version,
    capability_registry_version: vocabulary.capability_registry_version,
    trait_registry_version: vocabulary.trait_registry_version,
    policy_registry_version: registry.version,
    resolved_capabilities: vocabulary.resolved_capabilities,
    resolved_traits: vocabulary.resolved_traits,
    obligations,
  });

  return {
    manifest,
    exit_code: determineExitCode(obligations),
  };
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function resolveRuleContributions(
  requirement: RequirementPackage,
  assurance: ProjectAssuranceContext,
  vocabulary: CapabilityTraitResolution,
  registry: PolicyRegistry,
): PolicyContribution[] {
  const capabilities = new Map(
    vocabulary.resolved_capabilities.map((item) => [item.id, item]),
  );
  const traits = new Map(vocabulary.resolved_traits.map((item) => [item.id, item]));
  const contributions: PolicyContribution[] = [];

  for (const rule of [...registry.rules].sort(compareById)) {
    const evidence: ResolutionEvidence[] = [];
    if (rule.when.capability) {
      const capability = capabilities.get(rule.when.capability);
      if (!capability) continue;
      evidence.push(...capability.evidence);
    }
    if (rule.when.trait) {
      const trait = traits.get(rule.when.trait);
      if (!trait) continue;
      evidence.push(...trait.evidence);
    }
    if (rule.when.assurance_path) {
      const assuranceFacts = readFactPath(assurance, rule.when.assurance_path);
      const matching = assuranceFacts.filter(
        ({ value }) => value === rule.when.assurance_equals,
      );
      if (matching.length === 0) continue;
      evidence.push(...matching.map(toEvidence));
    }

    const parameters: Record<string, unknown> = {};
    const missingInputs: string[] = [];
    for (const binding of rule.parameters) {
      const values = readFactPath(requirement, binding.fact_path);
      if (values.length === 0 && binding.required) {
        missingInputs.push(binding.fact_path);
        continue;
      }
      for (const fact of values) {
        if (parameters[binding.name] === undefined) {
          parameters[binding.name] = fact.value;
        } else if (!deepEqual(parameters[binding.name], fact.value)) {
          parameters[binding.name] = {
            conflict_values: [parameters[binding.name], fact.value],
          };
        }
        evidence.push(toEvidence(fact));
      }
    }

    const businessRuleIds: string[] = [];
    if (rule.required_business_rule_type) {
      const matches = requirement.business_rules
        .map((businessRule, index) => ({ businessRule, index }))
        .filter(
          ({ businessRule }) =>
            businessRule.type === rule.required_business_rule_type,
        );
      if (matches.length === 0) {
        missingInputs.push(
          `business_rules[type=${rule.required_business_rule_type}]`,
        );
      } else {
        for (const { businessRule, index } of matches) {
          businessRuleIds.push(businessRule.id);
          evidence.push(
            ResolutionEvidenceSchema.parse({
              path: `business_rules[${index}].type`,
              value: businessRule.type,
            }),
          );
        }
      }
    }

    contributions.push({
      policy_id: rule.policy_id,
      requirement_level: rule.requirement_level,
      resolution_state: missingInputs.length > 0 ? "blocked" : "resolved",
      parameters,
      reasons: [rule.reason],
      evidence: normalizeEvidence(evidence),
      source_rule_ids: [rule.id],
      business_rule_ids: uniqueSorted(businessRuleIds),
      missing_inputs: uniqueSorted(missingInputs),
    });
  }

  return contributions;
}

function applyPolicyClosure(
  contributions: PolicyContribution[],
  definitions: readonly PolicyDefinition[],
): void {
  const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));
  const added = new Set<string>();
  let index = 0;

  while (index < contributions.length) {
    const source = contributions[index++];
    if (!source || source.requirement_level === "prohibited") continue;
    const definition = definitionMap.get(source.policy_id);
    if (!definition) continue;

    for (const requiredPolicy of [...definition.requires].sort()) {
      const closureId = `CLOSURE:${source.policy_id}:${requiredPolicy}`;
      if (added.has(closureId)) continue;
      added.add(closureId);
      contributions.push({
        policy_id: requiredPolicy,
        requirement_level: source.requirement_level,
        resolution_state: source.resolution_state,
        parameters: {},
        reasons: [`Policy ${source.policy_id} requires ${requiredPolicy}`],
        evidence: source.evidence,
        source_rule_ids: [closureId],
        business_rule_ids: source.business_rule_ids,
        missing_inputs: source.missing_inputs,
      });
    }
  }
}

function mergeContributions(
  contributions: readonly PolicyContribution[],
): PolicyObligation[] {
  const grouped = new Map<PolicyId, PolicyContribution[]>();
  for (const contribution of contributions) {
    const group = grouped.get(contribution.policy_id) ?? [];
    group.push(contribution);
    grouped.set(contribution.policy_id, group);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([policyId, group]) => mergePolicyGroup(policyId, group));
}

function mergePolicyGroup(
  policyId: PolicyId,
  contributions: readonly PolicyContribution[],
): PolicyObligation {
  const levels = new Set(contributions.map(({ requirement_level }) => requirement_level));
  let resolutionState: "resolved" | "blocked" | "conflict" = contributions.some(
    ({ resolution_state }) => resolution_state === "blocked",
  )
    ? "blocked"
    : "resolved";

  if (levels.has("mandatory") && levels.has("prohibited")) {
    resolutionState = "conflict";
  }

  const parameters: Record<string, unknown> = {};
  for (const contribution of contributions) {
    for (const [name, value] of Object.entries(contribution.parameters)) {
      if (isConflictValue(value)) {
        resolutionState = "conflict";
        parameters[name] = value;
      } else if (parameters[name] === undefined) {
        parameters[name] = value;
      } else if (!deepEqual(parameters[name], value)) {
        resolutionState = "conflict";
        parameters[name] = {
          conflict_values: uniqueCanonicalValues([parameters[name], value]),
        };
      }
    }
  }

  const requirementLevel = levels.has("mandatory")
    ? "mandatory"
    : levels.has("prohibited")
      ? "prohibited"
      : "conditional";

  return PolicyObligationSchema.parse({
    policy_id: policyId,
    requirement_level: requirementLevel,
    resolution_state: resolutionState,
    parameters: canonicalize(parameters),
    reasons: uniqueSorted(contributions.flatMap(({ reasons }) => reasons)),
    evidence: normalizeEvidence(contributions.flatMap(({ evidence }) => evidence)),
    source_rule_ids: uniqueSorted(
      contributions.flatMap(({ source_rule_ids }) => source_rule_ids),
    ),
    business_rule_ids: uniqueSorted(
      contributions.flatMap(({ business_rule_ids }) => business_rule_ids),
    ),
    missing_inputs: uniqueSorted(
      contributions.flatMap(({ missing_inputs }) => missing_inputs),
    ),
  });
}

function determineExitCode(
  obligations: readonly PolicyObligation[],
): PolicyCompilationExitCode {
  if (obligations.some(({ resolution_state }) => resolution_state === "conflict")) {
    return 4;
  }
  if (obligations.some(({ resolution_state }) => resolution_state === "blocked")) {
    return 3;
  }
  return 0;
}

function validateRegistry(registry: PolicyRegistry): void {
  const definitions = new Set<PolicyId>();
  for (const definition of registry.definitions) {
    const parsed = PolicyIdSchema.parse(definition.id);
    if (definitions.has(parsed)) {
      throw new Error(`Duplicate policy definition ${parsed}`);
    }
    definitions.add(parsed);
  }
  for (const rule of registry.rules) {
    if (!definitions.has(rule.policy_id)) {
      throw new Error(`Policy rule ${rule.id} targets undefined policy ${rule.policy_id}`);
    }
  }
}

function readFactPath(
  value: unknown,
  path: string,
): Array<{ readonly path: string; readonly value: unknown }> {
  const segments = path.split(".");
  let current: Array<{ path: string; value: unknown }> = [{ path: "", value }];
  for (const segment of segments) {
    const next: Array<{ path: string; value: unknown }> = [];
    for (const item of current) {
      if (segment === "*") {
        if (!Array.isArray(item.value)) continue;
        item.value.forEach((entry, index) =>
          next.push({ path: `${item.path}[${index}]`, value: entry }),
        );
      } else if (isRecord(item.value) && segment in item.value) {
        next.push({
          path: item.path ? `${item.path}.${segment}` : segment,
          value: item.value[segment],
        });
      }
    }
    current = next;
  }
  return current.filter(({ value: factValue }) => factValue !== undefined);
}

function toEvidence(fact: {
  readonly path: string;
  readonly value: unknown;
}): ResolutionEvidence {
  return ResolutionEvidenceSchema.parse(fact);
}

function normalizeEvidence(
  evidence: readonly ResolutionEvidence[],
): ResolutionEvidence[] {
  const unique = new Map<string, ResolutionEvidence>();
  for (const item of evidence) {
    unique.set(`${item.path}\u0000${JSON.stringify(item.value)}`, item);
  }
  return [...unique.values()].sort((left, right) =>
    compareText(
      `${left.path}\u0000${JSON.stringify(left.value)}`,
      `${right.path}\u0000${JSON.stringify(right.value)}`,
    ),
  );
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareText)
      .map((key) => [key, canonicalize(value[key])]),
  );
}

function hashCanonical(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareText);
}

function uniqueCanonicalValues(values: readonly unknown[]): unknown[] {
  const unique = new Map(values.map((value) => [canonicalJson(value), value]));
  return [...unique.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([, value]) => value);
}

function isConflictValue(value: unknown): boolean {
  return isRecord(value) && Array.isArray(value.conflict_values);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function compareById(
  left: { readonly id: string },
  right: { readonly id: string },
): number {
  return compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
