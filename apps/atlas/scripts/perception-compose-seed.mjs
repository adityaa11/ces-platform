import { createHash, randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createJiti } from "jiti";
import postgres from "postgres";

const databaseUrl = process.env.ATLAS_DATABASE_URL;
const rootDirectory = process.env.ATLAS_DOCUMENT_STORE_ROOT ?? resolve(process.cwd(), ".atlas-data");
const bridgePassword = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
const queueName = "atlas-document-perception-v1";

if (!databaseUrl) throw new Error("ATLAS_DATABASE_URL is required.");

const bridgeUrl = new URL(process.env.DATABASE_URL ?? databaseUrl);
bridgeUrl.username = "agents_bridge";
bridgeUrl.password = bridgePassword;

const jiti = createJiti(import.meta.url);
const [{ PostgresPerceptionAuthority }, { PerceptionSourceGrantIssuer }, { LocalFilesystemDocumentStore }, { PgBoss }] = await Promise.all([
  jiti.import("../../../packages/atlas-db/src/perception-authority.ts"),
  jiti.import("../../../packages/atlas-core/src/source-grant.ts"),
  jiti.import("../../../packages/document-store/src/local-filesystem-document-store.ts"),
  jiti.import("../../../apps/agents-bridge/node_modules/pg-boss/dist/index.js"),
]);

const atlas = postgres(databaseUrl, { max: 2 });
const bridge = postgres(bridgeUrl.toString(), { max: 2 });

try {
  if (process.argv[2] === "cleanup") {
    const executionId = process.argv[3];
    const idempotencyKey = process.argv[4];
    const storageKey = process.argv[5];
    if (!executionId || !idempotencyKey || !storageKey) throw new Error("cleanup requires executionId, idempotencyKey, and storageKey.");
    await atlas.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key=$1", [idempotencyKey]);
    await bridge.unsafe("DELETE FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [idempotencyKey]);
    await rm(resolve(rootDirectory, storageKey), { force: true });
  } else {
    const bytes = new Uint8Array(Buffer.from("%PDF-compose-smoke-synthetic%"));
    const store = new LocalFilesystemDocumentStore(rootDirectory);
    const stored = await store.put({ bytes, mediaType: "application/pdf" });
    const executionId = "compose-smoke-" + randomUUID();
    const artifactId = "compose-smoke-artifact-" + randomUUID();
    const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
    const idempotencyKey = "compose-smoke-" + randomUUID();
    const input = { executionId, artifactId, storageKey: stored.storageKey, sourceSha256, mimeType: "application/pdf", byteSize: bytes.byteLength, idempotencyKey, capabilityIdentity: "mistral-ocr:compose-smoke" };
    const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer(process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32"));
    const request = await authority.create(input);
    const boss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, schedule: false, createSchema: false, application_name: "atlas-perception-compose-seed" });
    await boss.start();
    try {
      await boss.send(queueName, { idempotencyKey, request }, { singletonKey: idempotencyKey });
    } finally {
      await boss.stop({ graceful: false });
    }
    process.stdout.write(JSON.stringify({ executionId, idempotencyKey, artifactId, sourceSha256, storageKey: stored.storageKey }) + "\n");
  }
} finally {
  await Promise.all([atlas.end(), bridge.end()]);
}
