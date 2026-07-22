import fs from "node:fs";
import { defaultCapabilityTraitRegistry as vocabulary } from "../../../packages/capability-resolver/dist/index.js";
import { compilePolicyManifest } from "../../../packages/policy-engine/dist/index.js";
import { defaultPolicyRegistry as policies } from "../../../packages/policy-registry/dist/index.js";
import { parseProjectText, splitProjectContext } from "../../../packages/project-schema/dist/index.js";
import { parseRequirementText } from "../../../packages/requirement-schema/dist/index.js";

const requirement = parseRequirementText(
  fs.readFileSync("examples/profile-picture.requirement.yaml", "utf8"),
  "yaml",
);
const { assurance, ces } = splitProjectContext(
  parseProjectText(fs.readFileSync("examples/laravel-project.yaml", "utf8"), "yaml"),
);
const compile = (registry = policies, vocabularyRegistry = vocabulary) =>
  compilePolicyManifest({
    requirement,
    assurance,
    ces_baseline_version: ces.baseline_version,
    registry,
    vocabulary_registry: vocabularyRegistry,
  }).manifest;

const manifests = {
  baseline: compile(),
  capability_definition: compile(policies, {
    ...vocabulary,
    capabilities: vocabulary.capabilities.filter((id) => id !== "IMAGE_PROCESSING"),
    rules: vocabulary.rules.filter(({ target_id }) => target_id !== "IMAGE_PROCESSING"),
  }),
  trait_definition: compile(policies, {
    ...vocabulary,
    traits: vocabulary.traits.filter((id) => id !== "BROWSER_RENDERED_CONTENT"),
    rules: vocabulary.rules.filter(({ target_id }) => target_id !== "BROWSER_RENDERED_CONTENT"),
  }),
  resolver_rule: compile(policies, {
    ...vocabulary,
    rules: vocabulary.rules.map((rule) =>
      rule.id === "CAP-FILE-001" ? { ...rule, reason: `${rule.reason} mutated` } : rule,
    ),
  }),
  policy_definition: compile({
    ...policies,
    definitions: policies.definitions.map((definition) =>
      definition.id === "SAFE_LOGGING"
        ? { ...definition, category: "consistency" }
        : definition,
    ),
  }),
  policy_rule: compile({
    ...policies,
    rules: policies.rules.map((rule) =>
      rule.id === "POL-INPUT-001" ? { ...rule, reason: `${rule.reason} mutated` } : rule,
    ),
  }),
  parameter_binding: compile({
    ...policies,
    rules: policies.rules.map((rule) =>
      rule.id === "POL-FILE-001"
        ? {
            ...rule,
            parameters: rule.parameters.map((binding) => ({
              ...binding,
              name: "maximum_upload_bytes",
            })),
          }
        : rule,
    ),
  }),
};

for (const [name, manifest] of Object.entries(manifests)) {
  console.log(JSON.stringify({
    name,
    capability_registry_hash: manifest.capability_registry_hash,
    trait_registry_hash: manifest.trait_registry_hash,
    policy_registry_hash: manifest.policy_registry_hash,
    compilation_id: manifest.compilation_id,
  }));
}
