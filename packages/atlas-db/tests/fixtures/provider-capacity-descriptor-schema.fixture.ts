export type SchemaOnlyProviderCapacityDescriptor = {
  apiVersion: "ProviderCapacityDescriptorFixture/v1";
  fixtureKind: "schema_only";
  providerShape: "openai_like" | "anthropic_like";
  tokenAccountingVersion: string;
  dimensions: Array<{
    id: string;
    metricKind: "requests" | "tokens";
    accountingUnit: "requests" | "tokens";
    scope: { kind: "shared_rate_limit_group" | "route"; groupId: string };
    window: { kind: "fixed_window" | "rolling_window"; windowSeconds: number };
    provenance: { sourceKind: "provider_documentation"; version: string };
    optional?: boolean;
  }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// This is deliberately a test-fixture schema. It describes possible provider
// vocabulary but has no runtime import, route, credential, or activation seam.
export const parseSchemaOnlyProviderCapacityDescriptor = (value: unknown): SchemaOnlyProviderCapacityDescriptor => {
  if (!isRecord(value)
    || value.apiVersion !== "ProviderCapacityDescriptorFixture/v1"
    || value.fixtureKind !== "schema_only"
    || (value.providerShape !== "openai_like" && value.providerShape !== "anthropic_like")
    || typeof value.tokenAccountingVersion !== "string"
    || !Array.isArray(value.dimensions)) throw new Error("invalid schema-only provider capacity descriptor");

  const dimensions = value.dimensions.map((dimension) => {
    if (!isRecord(dimension) || typeof dimension.id !== "string"
      || (dimension.metricKind !== "requests" && dimension.metricKind !== "tokens")
      || (dimension.accountingUnit !== "requests" && dimension.accountingUnit !== "tokens")
      || !isRecord(dimension.scope)
      || (dimension.scope.kind !== "shared_rate_limit_group" && dimension.scope.kind !== "route")
      || typeof dimension.scope.groupId !== "string"
      || !isRecord(dimension.window)
      || (dimension.window.kind !== "fixed_window" && dimension.window.kind !== "rolling_window")
      || typeof dimension.window.windowSeconds !== "number" || dimension.window.windowSeconds <= 0
      || !isRecord(dimension.provenance)
      || dimension.provenance.sourceKind !== "provider_documentation"
      || typeof dimension.provenance.version !== "string"
      || (dimension.optional !== undefined && typeof dimension.optional !== "boolean")) {
      throw new Error("invalid schema-only provider capacity descriptor dimension");
    }
    return dimension as SchemaOnlyProviderCapacityDescriptor["dimensions"][number];
  });

  if (new Set(dimensions.map(({ id }) => id)).size !== dimensions.length) {
    throw new Error("schema-only provider capacity descriptor dimensions must be unique");
  }
  if (value.providerShape === "openai_like") {
    const scopes = new Set(dimensions.filter(({ scope }) => scope.kind === "shared_rate_limit_group").map(({ scope }) => scope.groupId));
    if (scopes.size !== 1 || !dimensions.some(({ id }) => id === "requests_per_day")) {
      throw new Error("OpenAI-like fixtures require one shared group and an optional daily descriptor");
    }
  } else if (!dimensions.some(({ id }) => id === "input_tokens_per_minute")
    || !dimensions.some(({ id }) => id === "output_tokens_per_minute")
    || dimensions.some(({ id }) => id === "tokens_per_minute")) {
    throw new Error("Anthropic-like fixtures require split input/output token descriptors");
  }
  return value as SchemaOnlyProviderCapacityDescriptor;
};

export const openAiLikeSchemaOnlyDescriptor = {
  apiVersion: "ProviderCapacityDescriptorFixture/v1",
  fixtureKind: "schema_only",
  providerShape: "openai_like",
  tokenAccountingVersion: "tokens-v2",
  dimensions: [
    { id: "requests_per_minute", metricKind: "requests", accountingUnit: "requests", scope: { kind: "shared_rate_limit_group", groupId: "shared-tier-a" }, window: { kind: "rolling_window", windowSeconds: 60 }, provenance: { sourceKind: "provider_documentation", version: "2026-10" } },
    { id: "tokens_per_minute", metricKind: "tokens", accountingUnit: "tokens", scope: { kind: "shared_rate_limit_group", groupId: "shared-tier-a" }, window: { kind: "rolling_window", windowSeconds: 60 }, provenance: { sourceKind: "provider_documentation", version: "2026-10" } },
    { id: "requests_per_day", metricKind: "requests", accountingUnit: "requests", scope: { kind: "shared_rate_limit_group", groupId: "shared-tier-a" }, window: { kind: "fixed_window", windowSeconds: 86_400 }, provenance: { sourceKind: "provider_documentation", version: "2026-10" }, optional: true },
  ],
} as const;

export const anthropicLikeSchemaOnlyDescriptor = {
  apiVersion: "ProviderCapacityDescriptorFixture/v1",
  fixtureKind: "schema_only",
  providerShape: "anthropic_like",
  tokenAccountingVersion: "tokens-v1",
  dimensions: [
    { id: "input_tokens_per_minute", metricKind: "tokens", accountingUnit: "tokens", scope: { kind: "route", groupId: "input-tier-a" }, window: { kind: "rolling_window", windowSeconds: 60 }, provenance: { sourceKind: "provider_documentation", version: "2026-10" } },
    { id: "output_tokens_per_minute", metricKind: "tokens", accountingUnit: "tokens", scope: { kind: "route", groupId: "output-tier-a" }, window: { kind: "rolling_window", windowSeconds: 60 }, provenance: { sourceKind: "provider_documentation", version: "2026-10" } },
  ],
} as const;
