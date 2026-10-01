import { loadBridgeConfig } from "./config.js";
import { qualifyLiveMistral } from "./live-mistral-qualification-core.js";
import { MistralProvider } from "./providers/mistral.js";

const config = loadBridgeConfig();
const record = await qualifyLiveMistral(config, new MistralProvider(config.mistral));
process.stdout.write(`${JSON.stringify(record)}\n`);
if (record.outcome !== "success") process.exitCode = 1;
