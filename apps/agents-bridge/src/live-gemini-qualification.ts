import { loadBridgeConfig } from "./config.js";
import { qualifyLiveGemini } from "./live-gemini-qualification-core.js";
import { GeminiProvider } from "./providers/gemini.js";

if (process.env.GEMINI_LIVE_QUALIFICATION !== "true") {
  process.stderr.write("Set GEMINI_LIVE_QUALIFICATION=true to run the opt-in Gemini live qualification.\n");
  process.exitCode = 2;
} else {
  const config = loadBridgeConfig();
  const record = await qualifyLiveGemini(config, new GeminiProvider(config.gemini));
  process.stdout.write(`${JSON.stringify(record)}\n`);
  if (record.outcome !== "success") process.exitCode = 1;
}
