import type { AuthenticatedClient } from "./contracts.js";
import { BridgeExecutionError } from "./executor.js";

export interface AdmissionLease {
  release(): void;
}

export interface BridgeAdmissionController {
  acquire(input: {
    readonly client: AuthenticatedClient;
    readonly agent_id: string;
    readonly provider_id: string;
  }): Promise<AdmissionLease>;
}

export class InMemoryAdmissionController implements BridgeAdmissionController {
  private readonly clientConcurrency = new Map<string, number>();
  private readonly providerConcurrency = new Map<string, number>();
  private readonly rateWindows = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly providerMaximum: number,
    private readonly now: () => number = Date.now,
  ) {}

  async acquire(input: {
    readonly client: AuthenticatedClient;
    readonly agent_id: string;
    readonly provider_id: string;
  }): Promise<AdmissionLease> {
    const timestamp = this.now();
    const window = this.rateWindows.get(input.client.client_id);
    const currentWindow = !window || timestamp - window.start >= 60_000
      ? { start: timestamp, count: 0 }
      : window;
    if (currentWindow.count >= input.client.requests_per_minute) {
      throw new BridgeExecutionError(429, "BRIDGE_RATE_LIMITED", "The bridge rate limit was reached.");
    }
    const clientCount = this.clientConcurrency.get(input.client.client_id) ?? 0;
    const providerCount = this.providerConcurrency.get(input.provider_id) ?? 0;
    if (
      clientCount >= input.client.max_concurrency
      || providerCount >= this.providerMaximum
    ) {
      throw new BridgeExecutionError(429, "BRIDGE_RATE_LIMITED", "The bridge concurrency limit was reached.");
    }
    currentWindow.count += 1;
    this.rateWindows.set(input.client.client_id, currentWindow);
    this.clientConcurrency.set(input.client.client_id, clientCount + 1);
    this.providerConcurrency.set(input.provider_id, providerCount + 1);
    let released = false;
    return {
      release: () => {
        if (released) return;
        released = true;
        decrement(this.clientConcurrency, input.client.client_id);
        decrement(this.providerConcurrency, input.provider_id);
      },
    };
  }
}

function decrement(values: Map<string, number>, key: string): void {
  const next = (values.get(key) ?? 1) - 1;
  if (next <= 0) values.delete(key);
  else values.set(key, next);
}
