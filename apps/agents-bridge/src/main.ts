import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { createMistralCapabilities } from "./providers/mistral.js";
import { StreamingChatRuntime, TestRuntime } from "./runtime.js";

const config = loadBridgeConfig();
const runtime = config.mistral.apiKey ? new StreamingChatRuntime(createMistralCapabilities(config.mistral).streaming) : new TestRuntime();
const app = createBridgeApp({ runtime, version: config.version });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
