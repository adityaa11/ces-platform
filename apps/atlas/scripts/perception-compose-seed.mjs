import { createHash, randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
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
    const projectId = process.argv[6];
    if (!executionId || !idempotencyKey || !storageKey) throw new Error("cleanup requires executionId, idempotencyKey, and storageKey.");
    await atlas.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]);
    await bridge.unsafe("DELETE FROM bridge.background_effects WHERE idempotency_key=$1", [idempotencyKey]);
    await bridge.unsafe("DELETE FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1", [idempotencyKey]);
    if (projectId) await atlas.unsafe("DELETE FROM atlas.project WHERE id=$1", [projectId]);
    await rm(resolve(rootDirectory, storageKey), { force: true });
  } else {
    const useDocling = process.argv[2] === "docling";
    // The Docling lifecycle smoke uses the same repository-owned,
    // non-confidential PDF that warms the resident worker route. The default
    // remains the synthetic Mistral smoke fixture.
    const bytes = useDocling
      // A trailing PDF comment leaves the fixture valid while giving every
      // scoped run its own source identity and cache key.
      ? new Uint8Array(Buffer.concat([await readFile("docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf"), Buffer.from(`\n% BSS-V2-004-02 ${randomUUID()}\n`)]))
      : new Uint8Array(Buffer.from("%PDF-compose-smoke-synthetic%"));
    const store = new LocalFilesystemDocumentStore(rootDirectory);
    const stored = await store.put({ bytes, mediaType: "application/pdf" });
    const executionId = "compose-smoke-" + randomUUID();
    const artifactId = "compose-smoke-artifact-" + randomUUID();
    const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
    const idempotencyKey = "compose-smoke-" + randomUUID();
    const projectId = useDocling ? `compose-docling-project-${randomUUID()}` : undefined;
    if (projectId) {
      const owner = `compose-docling-owner-${randomUUID()}`;
      const workspaceId = `compose-docling-workspace-${randomUUID()}`;
      const bundleId = `compose-docling-bundle-${randomUUID()}`;
      await atlas.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
      await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'Docling D1 smoke',$3)", [projectId, `compose-docling-${randomUUID().slice(0, 12)}`, owner]);
      await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspaceId, projectId]);
      await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'qualified.pdf',$4,$5,$6,'application/pdf',$7)", [artifactId, projectId, workspaceId, stored.storageKey, sourceSha256, bytes.byteLength, owner]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',1)", [bundleId, projectId, workspaceId]);
      await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundleId, artifactId, projectId, workspaceId, executionId]);
    }
    const input = { executionId, artifactId, storageKey: stored.storageKey, sourceSha256, mimeType: "application/pdf", byteSize: bytes.byteLength, idempotencyKey, capabilityIdentity: useDocling ? "docling-digital-pdf" : "mistral-ocr:compose-smoke" };
    const authority = new PostgresPerceptionAuthority(atlas, new PerceptionSourceGrantIssuer(process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32"));
    const request = await authority.create(input);
    const boss = new PgBoss({ connectionString: bridgeUrl.toString(), schema: "pgboss", migrate: false, schedule: false, createSchema: false, application_name: "atlas-perception-compose-seed" });
    await boss.start();
    try {
      await boss.send(queueName, { idempotencyKey, request }, { singletonKey: idempotencyKey });
    } finally {
      await boss.stop({ graceful: false });
    }
    process.stdout.write(JSON.stringify({ executionId, idempotencyKey, artifactId, sourceSha256, storageKey: stored.storageKey, projectId }) + "\n");
  }
} finally {
  await Promise.all([atlas.end(), bridge.end()]);
}
