import { createBridgeApp } from "./app.js";
import { loadBridgeConfig } from "./config.js";
import { TestRuntime } from "./runtime.js";

const config = loadBridgeConfig();
const app = createBridgeApp({ runtime: new TestRuntime(), version: config.version });
const stop = async () => { await app.close(); process.exit(0); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await app.listen({ host: config.host, port: config.port });
