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
    const expectedState = process.env.PERCEPTION_EXPECT_STATE ?? "completed";
    if (expectedState !== "completed" && expectedState !== "failed") throw new Error("PERCEPTION_EXPECT_STATE must be completed or failed.");
    // The Docling lifecycle smoke uses the same repository-owned,
    // non-confidential PDF that warms the resident worker route. The default
    // remains the synthetic Mistral smoke fixture.
    const bytes = useDocling
      // A trailing PDF comment leaves the fixture valid while giving every
      // scoped run its own source identity and cache key.
      ? new Uint8Array(Buffer.concat([await readFile("docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf"), Buffer.from(`\n% BSS-V2-004-02 ${randomUUID()}\n`)]))
      : new Uint8Array(Buffer.from("%PDF-compose-smoke-synthetic%"));
    const store = new LocalFilesystemDocumentStore(rootDirectory);
    const startedAt = Date.now();
    let executionId = "compose-smoke-" + randomUUID();
    let artifactId = "compose-smoke-artifact-" + randomUUID();
    let sourceSha256 = createHash("sha256").update(bytes).digest("hex");
    let idempotencyKey = "compose-smoke-" + randomUUID();
    let projectId = useDocling ? `compose-docling-${randomUUID().slice(0, 12)}` : undefined;
    if (projectId) {
      const email = `compose-docling-${randomUUID()}@example.test`;
      const password = "a-tested-local-password";
      const origin = "http://localhost:3001";
      const signUp = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "Docling Compose", email, password }) });
      if (!signUp.ok) throw new Error(`Compose signup failed: ${signUp.status} ${await signUp.text()}`);
      const signIn = await fetch(`${origin}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email, password }) });
      if (!signIn.ok) throw new Error(`Compose signin failed: ${signIn.status} ${await signIn.text()}`);
      const cookies = typeof signIn.headers.getSetCookie === "function" ? signIn.headers.getSetCookie() : [signIn.headers.get("set-cookie")].filter(Boolean);
      const cookie = cookies.map((value) => value.split(";", 1)[0]).join("; ");
      const form = new FormData();
      form.set("projectId", projectId);
      form.set("projectName", "Docling D1 smoke");
      form.set("prdFiles[]", new Blob([bytes], { type: "application/pdf" }), "qualified.pdf");
      const created = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie, origin }, body: form });
      if (!created.ok) throw new Error(`IDSER-003 Compose kickoff failed: ${created.status} ${await created.text()}`);
      const lifecycle = await atlas.unsafe("SELECT p.id AS project_id, d.id AS artifact_id, m.perception_execution_id, e.idempotency_key, d.storage_key FROM atlas.project p JOIN atlas.document d ON d.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.document_id=d.id JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id WHERE p.stable_id=$1", [projectId]);
      if (lifecycle.length !== 1) throw new Error("IDSER-003 kickoff did not create exactly one D1 lifecycle.");
      executionId = String(lifecycle[0].perception_execution_id);
      artifactId = String(lifecycle[0].artifact_id);
      idempotencyKey = String(lifecycle[0].idempotency_key);
      const storageKey = String(lifecycle[0].storage_key);
      const sourceSha256Row = await atlas.unsafe("SELECT source_sha256 FROM atlas.document WHERE id=$1", [artifactId]);
      sourceSha256 = String(sourceSha256Row[0]?.source_sha256);
      process.stdout.write(JSON.stringify({ phase: "kickoff", projectId, executionId, artifactId, idempotencyKey, storageKey, sourceSha256, elapsedMilliseconds: Date.now() - startedAt }) + "\n");
      if (process.env.PERCEPTION_WAIT !== "false") {
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        const state = await atlas.unsafe("SELECT state FROM atlas.document_perception_execution WHERE id=$1", [executionId]);
        if (state[0]?.state === expectedState) break;
        await new Promise((resume) => setTimeout(resume, 250));
      }
      const observation = await atlas.unsafe("SELECT e.state, (SELECT COUNT(*)::int FROM atlas.normalized_document_cache c WHERE c.source_sha256=d.source_sha256 AND c.capability_identity='docling-digital-pdf' AND c.invalidated_at IS NULL) AS cache_count, (SELECT COUNT(*)::int FROM atlas.semantic_execution s JOIN atlas.extraction_bundle b ON b.id=s.bundle_id WHERE b.project_id=p.id) AS semantic_execution_count, (SELECT COUNT(*)::int FROM atlas.document_perception_execution x JOIN atlas.document dx ON dx.id=x.artifact_id WHERE dx.project_id=p.id) AS execution_count, (SELECT COUNT(*)::int FROM atlas.extraction_bundle_document m JOIN atlas.extraction_bundle b ON b.id=m.bundle_id WHERE b.project_id=p.id) AS member_count FROM atlas.document_perception_execution e JOIN atlas.document d ON d.id=e.artifact_id JOIN atlas.project p ON p.id=d.project_id WHERE e.id=$1", [executionId]);
      if (observation[0]?.state !== expectedState) throw new Error(`IDSER-003 D1 kickoff did not reach ${expectedState} within two minutes.`);
      process.stdout.write(JSON.stringify({ phase: "completed", projectId, executionId, idempotencyKey, sourceSha256, elapsedMilliseconds: Date.now() - startedAt, ...observation[0] }) + "\n");
      }
    } else {
      const stored = await store.put({ bytes, mediaType: "application/pdf" });
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
      process.stdout.write(JSON.stringify({ executionId, idempotencyKey, artifactId, sourceSha256, storageKey: stored.storageKey, projectId }) + "\n");
    }
  }
} finally {
  await Promise.all([atlas.end(), bridge.end()]);
}
