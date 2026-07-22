import {
  CapabilityIdSchema,
  TraitIdSchema,
  defaultCapabilityTraitRegistry,
  type CapabilityTraitRegistry,
  type FactPredicate,
  type ResolutionRule,
} from "@company/ces-capability-registry";
import {
  ResolvedVocabularyItemSchema,
  ResolutionEvidenceSchema,
  type ResolvedVocabularyItem,
  type ResolutionEvidence,
} from "@company/ces-policy-manifest";
import {
  getPolicyRelevantRequirement,
  type RequirementPackage,
} from "@company/ces-requirement-schema";
import { z } from "zod";

export const CAPABILITY_RESOLUTION_SCHEMA_VERSION = "1.0.0" as const;

export type ResolverErrorCode =
  | "UNKNOWN_CAPABILITY"
  | "UNKNOWN_TRAIT"
  | "UNSUPPORTED_ASSERTION"
  | "INVALID_REGISTRY_RULE";

export class ResolverError extends Error {
  public constructor(
    public readonly code: ResolverErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ResolverError";
  }
}

export const CapabilityTraitResolutionSchema = z
  .object({
    schema_version: z.literal(CAPABILITY_RESOLUTION_SCHEMA_VERSION),
    capability_registry_version: z.string().trim().min(1),
    trait_registry_version: z.string().trim().min(1),
    declared_facts: z.array(ResolutionEvidenceSchema),
    asserted_capabilities: z.array(CapabilityIdSchema),
    resolved_capabilities: z.array(ResolvedVocabularyItemSchema),
    resolved_traits: z.array(ResolvedVocabularyItemSchema),
  })
  .strict();

export type CapabilityTraitResolution = z.infer<
  typeof CapabilityTraitResolutionSchema
>;

interface EvidenceMatch {
  readonly matched: boolean;
  readonly evidence: readonly ResolutionEvidence[];
}

export function resolveCapabilitiesAndTraits(
  requirement: RequirementPackage,
  registry: CapabilityTraitRegistry = defaultCapabilityTraitRegistry,
): CapabilityTraitResolution {
  validateRegistry(registry);
  const facts = getPolicyRelevantRequirement(requirement);
  const capabilityResults: ResolvedVocabularyItem[] = [];
  const traitResults: ResolvedVocabularyItem[] = [];

  for (const rule of [...registry.rules].sort(compareById)) {
    const match = matchRule(facts, rule);
    if (!match.matched) continue;

    const result = ResolvedVocabularyItemSchema.parse({
      id: rule.target_id,
      source: "resolver_rule",
      rule_id: rule.id,
      evidence: normalizeEvidence(match.evidence),
      reason: rule.reason,
      registry_version:
        rule.target_kind === "capability"
          ? registry.capability_registry_version
          : registry.trait_registry_version,
    });

    if (rule.target_kind === "capability") capabilityResults.push(result);
    else traitResults.push(result);
  }

  const resolvedCapabilityIds = new Set(capabilityResults.map(({ id }) => id));
  const assertedCapabilities = [...requirement.asserted_capabilities].sort();
  for (const assertion of assertedCapabilities) {
    const parsedAssertion = CapabilityIdSchema.safeParse(assertion);
    if (
      !parsedAssertion.success ||
      !registry.capabilities.includes(parsedAssertion.data)
    ) {
      throw new ResolverError(
        "UNKNOWN_CAPABILITY",
        `Asserted capability ${assertion} is not in capability registry ${registry.capability_registry_version}`,
      );
    }
    if (!resolvedCapabilityIds.has(assertion)) {
      throw new ResolverError(
        "UNSUPPORTED_ASSERTION",
        `Asserted capability ${assertion} is not supported by requirement facts`,
      );
    }
  }

  const resolvedCapabilities = mergeResults(capabilityResults);
  const resolvedTraits = mergeResults(traitResults);

  return CapabilityTraitResolutionSchema.parse({
    schema_version: CAPABILITY_RESOLUTION_SCHEMA_VERSION,
    capability_registry_version: registry.capability_registry_version,
    trait_registry_version: registry.trait_registry_version,
    declared_facts: normalizeEvidence([
      ...resolvedCapabilities.flatMap(({ evidence }) => evidence),
      ...resolvedTraits.flatMap(({ evidence }) => evidence),
    ]),
    asserted_capabilities: assertedCapabilities,
    resolved_capabilities: resolvedCapabilities,
    resolved_traits: resolvedTraits,
  });
}

function validateRegistry(registry: CapabilityTraitRegistry): void {
  const capabilityIds = new Set(registry.capabilities);
  const traitIds = new Set(registry.traits);

  for (const rule of registry.rules) {
    if (rule.target_kind === "capability") {
      const parsed = CapabilityIdSchema.safeParse(rule.target_id);
      if (!parsed.success || !capabilityIds.has(parsed.data)) {
        throw new ResolverError(
          "UNKNOWN_CAPABILITY",
          `Rule ${rule.id} targets unknown capability ${rule.target_id}`,
        );
      }
    } else {
      const parsed = TraitIdSchema.safeParse(rule.target_id);
      if (!parsed.success || !traitIds.has(parsed.data)) {
        throw new ResolverError(
          "UNKNOWN_TRAIT",
          `Rule ${rule.id} targets unknown trait ${rule.target_id}`,
        );
      }
    }
  }
}

function matchRule(facts: object, rule: ResolutionRule): EvidenceMatch {
  const evidence: ResolutionEvidence[] = [];
  for (const predicate of rule.all) {
    const match = matchPredicate(facts, predicate);
    if (!match.matched) return { matched: false, evidence: [] };
    evidence.push(...match.evidence);
  }
  return { matched: true, evidence };
}

function matchPredicate(facts: object, predicate: FactPredicate): EvidenceMatch {
  const values = readFactPath(facts, predicate.path);
  if (predicate.operator === "includes") {
    const evidence = values.flatMap(({ path, value }) => {
      if (!Array.isArray(value)) return [];
      return value.flatMap((entry, index) =>
        entry === predicate.value
          ? [ResolutionEvidenceSchema.parse({ path: `${path}[${index}]`, value: entry })]
          : [],
      );
    });
    return { matched: evidence.length > 0, evidence };
  }

  const matched = values.filter(({ value }) => {
    if (predicate.operator === "exists") return value !== undefined;
    return value === predicate.value;
  });

  return {
    matched: matched.length > 0,
    evidence: matched.map(({ path, value }) =>
      ResolutionEvidenceSchema.parse({ path, value }),
    ),
  };
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
        item.value.forEach((entry, index) => {
          next.push({ path: `${item.path}[${index}]`, value: entry });
        });
      } else if (isRecord(item.value) && segment in item.value) {
        next.push({
          path: item.path ? `${item.path}.${segment}` : segment,
          value: item.value[segment],
        });
      }
    }
    current = next;
  }

  return current;
}

function normalizeEvidence(
  evidence: readonly ResolutionEvidence[],
): ResolutionEvidence[] {
  const unique = new Map<string, ResolutionEvidence>();
  for (const item of evidence) {
    const key = `${item.path}\u0000${JSON.stringify(item.value)}`;
    unique.set(key, item);
  }
  return [...unique.values()].sort((left, right) =>
    compareText(
      `${left.path}\u0000${JSON.stringify(left.value)}`,
      `${right.path}\u0000${JSON.stringify(right.value)}`,
    ),
  );
}

function mergeResults(
  results: readonly ResolvedVocabularyItem[],
): ResolvedVocabularyItem[] {
  const byId = new Map<string, ResolvedVocabularyItem>();
  for (const result of results) {
    const existing = byId.get(result.id);
    if (!existing) {
      byId.set(result.id, result);
      continue;
    }
    byId.set(
      result.id,
      ResolvedVocabularyItemSchema.parse({
        ...existing,
        evidence: normalizeEvidence([...existing.evidence, ...result.evidence]),
        reason: [existing.reason, result.reason].sort().join("; "),
        rule_id: [existing.rule_id, result.rule_id].filter(Boolean).sort().join(","),
      }),
    );
  }
  return [...byId.values()].sort(compareById);
}

function compareById(left: { readonly id: string }, right: { readonly id: string }): number {
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
