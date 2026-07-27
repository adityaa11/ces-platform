import { expect, it } from "vitest";
import { z } from "zod";
import { GeminiStructuredGenerationProvider, geminiConfigFromEnvironment } from "../../index.js";

it.skipIf(process.env.GEMINI_LIVE_TEST !== "true")(
  "executes an explicitly enabled live Gemini structured request",
  async () => {
    const config = geminiConfigFromEnvironment(process.env);
    const provider = new GeminiStructuredGenerationProvider(config);
    const outputSchema = z.object({ status: z.literal("ok") }).strict();
    const result = await provider.executeStructured({
      system_instructions: "Return only the requested JSON object.",
      messages: [{ role: "user", content: "Set status to ok." }],
      response_json_schema: {
        type: "object",
        properties: { status: { type: "string", enum: ["ok"] } },
        required: ["status"],
        additionalProperties: false,
      },
      model_alias: "atlas-default",
      max_output_tokens: 32,
    }, outputSchema, {
      request_id: "live-test",
      client_id: "local-live-test",
      agent_id: "live.fixture",
      agent_version: "1.0.0",
      model_alias: "atlas-default",
      provider_id: "gemini",
      resolved_model: config.models["atlas-default"]!,
      max_attempts: 1,
      max_response_bytes: 4096,
      signal: AbortSignal.timeout(30_000),
    });
    expect(result.output).toEqual({ status: "ok" });
  },
  35_000,
);
