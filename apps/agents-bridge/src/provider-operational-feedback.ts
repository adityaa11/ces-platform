/**
 * Provider adapters translate vendor responses into this deliberately small,
 * secret-free contract.  It is operational feedback for BSS-V2 admission, not
 * provenance or the BSS-V2-007 historical cost ledger.
 */
export type ProviderOperationalFeedback = Readonly<{
  transportMayHaveStarted: boolean;
  usage?: Readonly<{ tpm?: number; rpm?: number; rpd?: number }>;
  retryAfterSeconds?: number;
  lowerLimit?: Readonly<{ dimension: "rpm" | "tpm" | "rpd" | "concurrency"; value: number; resetAt?: string }>;
}>;

const nonNegativeInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Rejects ambiguous, unbounded, or raw-provider-shaped data before it reaches durable admission state. */
export function normalizeProviderOperationalFeedback(input: unknown): ProviderOperationalFeedback {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new Error("Provider operational feedback must be an object.");
  const value = input as Record<string, unknown>;
  if (typeof value.transportMayHaveStarted !== "boolean") throw new Error("Provider operational feedback requires transportMayHaveStarted.");
  const result: { transportMayHaveStarted: boolean; usage?: { tpm?: number; rpm?: number; rpd?: number }; retryAfterSeconds?: number; lowerLimit?: { dimension: "rpm" | "tpm" | "rpd" | "concurrency"; value: number; resetAt?: string } } = { transportMayHaveStarted: value.transportMayHaveStarted };
  if (value.usage !== undefined) {
    if (typeof value.usage !== "object" || value.usage === null || Array.isArray(value.usage)) throw new Error("Provider usage must be a bounded resource object.");
    const usage = value.usage as Record<string, unknown>;
    if (Object.keys(usage).some((key) => !["tpm", "rpm", "rpd"].includes(key)) || Object.values(usage).some((units) => !nonNegativeInteger(units))) throw new Error("Provider usage has an unsupported resource dimension.");
    result.usage = usage as { tpm?: number; rpm?: number; rpd?: number };
  }
  if (value.retryAfterSeconds !== undefined) {
    if (!nonNegativeInteger(value.retryAfterSeconds) || value.retryAfterSeconds > 3600) throw new Error("Retry-After must be a bounded non-negative number of seconds.");
    result.retryAfterSeconds = value.retryAfterSeconds;
  }
  if (value.lowerLimit !== undefined) {
    if (typeof value.lowerLimit !== "object" || value.lowerLimit === null || Array.isArray(value.lowerLimit)) throw new Error("Lower limit feedback must be an object.");
    const lower = value.lowerLimit as Record<string, unknown>;
    if (!(["rpm", "tpm", "rpd", "concurrency"] as const).includes(lower.dimension as never) || !nonNegativeInteger(lower.value)) throw new Error("Lower limit feedback is invalid.");
    if (lower.resetAt !== undefined && (typeof lower.resetAt !== "string" || !Number.isFinite(Date.parse(lower.resetAt)))) throw new Error("Lower limit resetAt is invalid.");
    result.lowerLimit = { dimension: lower.dimension as "rpm" | "tpm" | "rpd" | "concurrency", value: lower.value, ...(lower.resetAt === undefined ? {} : { resetAt: lower.resetAt as string }) };
  }
  if (!result.usage && result.retryAfterSeconds === undefined && !result.lowerLimit && !result.transportMayHaveStarted) throw new Error("Untransmitted feedback must contain a trustworthy outcome.");
  return result;
}
