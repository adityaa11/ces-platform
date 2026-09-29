import postgres from "postgres";
import { inflateRawSync } from "node:zlib";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../../../packages/atlas-db/src/perception-authority.ts";
import { PostgresReconciliationAcceptanceHandler } from "../../../packages/atlas-db/src/reconciliation-acceptance.ts";
import { PostgresReconciliationSelector } from "../../../packages/atlas-db/src/reconciliation-selector.ts";
import { PostgresSemanticAuthority } from "../../../packages/atlas-db/src/semantic-authority.ts";
import { createTransactionalPerceptionQueueProducer } from "../src/queue.ts";
import { createBackgroundWorker } from "../src/worker.ts";
import type { ReasoningRuntime } from "@atlas/contracts";

const bridgeUrl = process.env.AGENTS_BRIDGE_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;
const appPassword = process.env.ATLAS_APP_PASSWORD;
if (!bridgeUrl || !databaseUrl || !appPassword) throw new Error("Compose reconciliation worker test requires the Bridge, Atlas, and database connection settings.");

const runtime: ReasoningRuntime = { async *execute() { yield { type: "complete" }; } };
const worker = createBackgroundWorker({
  databaseUrl: bridgeUrl,
  concurrency: 1,
  timeoutSeconds: 15,
  retryLimit: 2,
  retryDelaySeconds: 1,
  shutdownTimeoutMilliseconds: 5000,
}, runtime, undefined, undefined, undefined, async (job) => {
  if (!job.contextCapability.startsWith("z:")) throw new Error("Compose restart test requires a compressed frozen semantic envelope.");
  const envelope = JSON.parse(inflateRawSync(Buffer.from(job.contextCapability.slice(2), "base64")).toString("utf8")) as {
    scope: { projectId: string; workspaceId: string; bundleId: string; documentId: string; executionId: string; contractVersion: "v1" };
    skill: { id: string; version: "v1" };
    provider: { provider: string; model: string; endpoint: string; latencyMilliseconds: number; attempt: number };
    result: { version: "v1"; relationships: readonly unknown[]; questions: readonly unknown[] };
  };
  const appUrl = new URL(databaseUrl);
  appUrl.username = "atlas_app";
  appUrl.password = appPassword;
  const atlas = postgres(appUrl.toString(), { max: 1 });
  const queue = await createTransactionalPerceptionQueueProducer(databaseUrl);
  try {
    const selector = new PostgresReconciliationSelector(atlas);
    const authority = new PostgresSemanticAuthority(atlas, selector);
    const perception = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer("s".repeat(32)));
    const handler = new PostgresReconciliationAcceptanceHandler({ authority: perception, queue });
    if (envelope.scope.executionId !== job.executionId || envelope.skill.id !== job.skill.id || envelope.skill.version !== job.skill.version) throw new Error("Compose restart test envelope does not match its queued semantic execution.");
    await authority.deliver(envelope, handler);
  } finally {
    await queue.close();
    await atlas.end();
  }
});

await worker.start();
console.log("COMPOSE_RECONCILIATION_WORKER_READY");

let stopping = false;
process.once("SIGTERM", async () => {
  if (stopping) return;
  stopping = true;
  await worker.stop();
  process.exit(0);
});
