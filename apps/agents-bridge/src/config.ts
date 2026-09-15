export type BridgeConfig = { readonly host: string; readonly port: number; readonly version: string };

export function loadBridgeConfig(environment: NodeJS.ProcessEnv = process.env): BridgeConfig {
  const port = Number(environment.AGENTS_BRIDGE_PORT ?? "3002");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("AGENTS_BRIDGE_PORT must be a valid TCP port.");
  return { host: environment.AGENTS_BRIDGE_HOST ?? "0.0.0.0", port, version: environment.AGENTS_BRIDGE_VERSION ?? "0.1.0" };
}
