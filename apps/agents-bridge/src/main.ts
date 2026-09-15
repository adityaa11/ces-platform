import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { MistralProvider } from "./providers/mistral.js";
import { MistralChatRuntime, TestRuntime } from "./runtime.js";

const config = loadBridgeConfig();
const runtime = config.mistral.apiKey ? new MistralChatRuntime(new MistralProvider(config.mistral)) : new TestRuntime();
const app = createBridgeApp({ runtime, version: config.version });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
