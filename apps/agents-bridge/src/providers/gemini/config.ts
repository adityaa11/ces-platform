import { z } from "zod";

const GeminiConfigSchema = z.object({
  api_key: z.string().min(1),
  models: z.record(
    z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u),
    z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u),
  ),
  retry_base_delay_ms: z.number().int().nonnegative().default(250),
  retry_max_delay_ms: z.number().int().positive().default(5_000),
  retry_after_max_ms: z.number().int().positive().default(30_000),
}).strict().refine(
  ({ retry_base_delay_ms, retry_max_delay_ms }) => retry_base_delay_ms <= retry_max_delay_ms,
  "Gemini retry base delay exceeds maximum delay",
);

export type GeminiProviderConfig = z.infer<typeof GeminiConfigSchema>;

export function parseGeminiProviderConfig(value: unknown): GeminiProviderConfig {
  const config = GeminiConfigSchema.parse(value);
  if (Object.keys(config.models).length === 0) throw new Error("At least one Gemini model alias is required");
  return config;
}

export function geminiConfigFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): GeminiProviderConfig {
  const apiKey = environment.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing required environment variable: GEMINI_API_KEY");
  return parseGeminiProviderConfig({
    api_key: apiKey,
    models: {
      [environment.ATLAS_MODEL_ALIAS ?? "atlas-default"]:
        environment.GEMINI_MODEL ?? "gemini-2.5-flash",
    },
    retry_base_delay_ms: integer(environment.GEMINI_RETRY_BASE_DELAY_MS, 250),
    retry_max_delay_ms: integer(environment.GEMINI_RETRY_MAX_DELAY_MS, 5_000),
    retry_after_max_ms: integer(environment.GEMINI_RETRY_AFTER_MAX_MS, 30_000),
  });
}

function integer(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/u.test(value)) throw new Error(`Invalid Gemini integer environment value: ${value}`);
  return Number(value);
}
