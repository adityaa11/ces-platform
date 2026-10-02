import { loadBridgeConfig } from "./config.js";
import { GeminiProvider } from "./providers/gemini.js";

if (process.env.GEMINI_LIVE_QUALIFICATION !== "true") {
  process.stderr.write("Set GEMINI_LIVE_QUALIFICATION=true to run the opt-in Gemini minimal probe.\n");
  process.exitCode = 2;
} else {
  const config = loadBridgeConfig();
  try {
    const result = await new GeminiProvider(config.gemini).structured({
      messages: [{ role: "user", content: "Return a JSON object with qualified set to true." }],
      schema: { type: "object", additionalProperties: false, required: ["qualified"], properties: { qualified: { type: "boolean" } } },
      signal: AbortSignal.timeout(config.gemini.timeoutMilliseconds),
    });
    process.stdout.write(`${JSON.stringify({ outcome: "success", model: result.provenance.model, endpoint: result.provenance.endpoint, latencyMilliseconds: result.provenance.latencyMilliseconds, usagePresent: result.provenance.usage !== undefined })}\n`);
  } catch (error) {
    const code = typeof error === "object" && error !== null && typeof (error as { readonly code?: unknown }).code === "string" ? (error as { readonly code: string }).code : "unknown";
    process.stdout.write(`${JSON.stringify({ outcome: "failure", errorCode: code })}\n`);
    process.exitCode = 1;
  }
}
