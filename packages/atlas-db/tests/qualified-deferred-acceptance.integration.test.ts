import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import postgres from "postgres";
import { createJiti } from "jiti";
import { createSemanticInternalRoutes } from "@atlas/core";
import { canonicalSemanticFingerprint, PostgresSemanticAuthority } from "../src/semantic-authority.ts";
import { PostgresExtractionAcceptanceHandler } from "../src/extraction-acceptance.ts";

const databaseUrl = process.env.DATABASE_URL;
const credential = "q".repeat(32);
const hashes = { compositeHash: "a".repeat(64), relationshipRevisionSetHash: "b".repeat(64), provisionalSidecarHash: "c".repeat(64) };
const normalized = (executionId: string, documentId: string, sourceSha256: string) => ({
  version: "v1", executionId, artifactId: documentId, sourceSha256,
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
  provider: { name: "test", processor: "test", executionId, processedAt: "2026-10-15T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: [{ id: "block-1", text: "The customer approves an order." }], tables: [{ id: "table-1", content: "Status | Approved" }], visualRegions: [{ id: "visual-1", label: "Approval flow" }] }],
});
const canonical = () => ({
  provider: { provider: "test", model: "test", endpoint: "loopback", latencyMilliseconds: 1, attempt: 1 },
  result: {
    version: "v1",
    candidate_assertions: [{ local_candidate_id: "candidate-order", semantic_key: "order.approval", kind: "rule", payload: { status: "approved" }, normalized_meaning: "A customer approves an order.", source_wording: "The customer approves an order.", needs_resolution: false, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "block-1", excerpt: "customer approves" }] }],
    source_statement_inventory: [{ source_unit_id: "source-block", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "candidate", destination_local_candidate_ids: ["candidate-order"] }],
    questions: [],
  },
});
const deferred = () => [
  { source_unit_id: "source-table", page_number: 1, locator_type: "table", locator_id: "table-1", classification: "essential_dependent_deferred" as const },
  { source_unit_id: "source-visual", page_number: 1, locator_type: "visual_region", locator_id: "visual-1", classification: "essential_dependent_deferred" as const },
];
const allDeferred = () => [
  { source_unit_id: "source-block", page_number: 1, locator_type: "text_block", locator_id: "block-1", classification: "essential_dependent_deferred" as const },
  ...deferred(),
];

test("SEM-CUTOVER-007A qualified-result route materializes partial acceptance and hands off exactly one reconciliation job", { skip: !databaseUrl }, async () => {
  const fixture = await createFixture("partial");
  try {
    const queue = { jobs: [] as unknown[], enqueue: async (_transaction: unknown, job: unknown) => { queue.jobs.push(job); return randomUUID(); } };
    const handler = new PostgresExtractionAcceptanceHandler(queue as never);
    const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: new PostgresSemanticAuthority(fixture.atlas), handler, qualifiedHandler: handler });
    const input = { version: "v1" as const, scope: fixture.scope, outcome: "partial_accepted" as const, composite: hashes, deferredCoverage: deferred(), canonical: canonical() };
    assert.equal((await routes.deliverQualified("wrong", input)).status, 401, "the qualified-result route is service-authenticated");
    assert.equal((await routes.deliverQualified(credential, input)).status, 204);
    assert.deepEqual(await fixture.counts(), { deferred: 1, results: 1, candidates: 1, evidence: 1, knowledge: 1, reconciliation: 1, jobs: 0 });
    assert.equal(queue.jobs.length, 1, "partial acceptance hands off only its materialized canonical candidate set");
    const [record] = await fixture.atlas.unsafe("SELECT outcome,composite_hash,relationship_revision_set_hash,provisional_sidecar_hash,deferred_coverage FROM atlas.semantic_deferred_acceptance WHERE execution_id=$1", [fixture.execution]);
    assert.equal(record.outcome, "partial_accepted");
    assert.deepEqual({ compositeHash: record.composite_hash, relationshipRevisionSetHash: record.relationship_revision_set_hash, provisionalSidecarHash: record.provisional_sidecar_hash }, hashes);
    assert.equal((typeof record.deferred_coverage === "string" ? JSON.parse(record.deferred_coverage) : record.deferred_coverage).length, 2);
    assert.deepEqual((await fixture.atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [fixture.execution]))[0], { lifecycle: "completed" });
    assert.deepEqual((await fixture.atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [fixture.bundle, fixture.document]))[0], { state: "reconciling" });
    assert.equal((await routes.deliverQualified(credential, input)).status, 204, "identical replay is idempotent");
    assert.equal((await routes.deliverQualified(credential, { ...input, composite: { ...hashes, compositeHash: "d".repeat(64) } })).status, 409, "changed hash-bound input conflicts after acceptance");
    assert.deepEqual(await fixture.counts(), { deferred: 1, results: 1, candidates: 1, evidence: 1, knowledge: 1, reconciliation: 1, jobs: 0 });
    assert.equal(queue.jobs.length, 1, "replay/conflict cannot enqueue another reconciliation handoff");
  } finally {
    await fixture.cleanup();
  }
});

test("SEM-CUTOVER-007A qualified-result route persists fully deferred truth with no Semantic V1 effects", { skip: !databaseUrl }, async () => {
  const fixture = await createFixture("fully-deferred");
  try {
    const handler = new PostgresExtractionAcceptanceHandler({ enqueue: async () => { throw new Error("fully deferred acceptance must not enqueue"); } });
    const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: new PostgresSemanticAuthority(fixture.atlas), handler, qualifiedHandler: handler });
    const input = { version: "v1" as const, scope: fixture.scope, outcome: "qualified_deferred" as const, composite: hashes, deferredCoverage: allDeferred() };
    assert.equal((await routes.deliverQualified(credential, input)).status, 204);
    assert.deepEqual(await fixture.counts(), { deferred: 1, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 });
    assert.deepEqual((await fixture.atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 AND document_id=$2", [fixture.bundle, fixture.document]))[0], { state: "qualified_deferred" });
    assert.deepEqual((await fixture.atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE id=$1", [fixture.bundle]))[0], { state: "qualified_deferred" });
    assert.deepEqual([...await fixture.atlas.unsafe("SELECT kind,state FROM atlas.workspace WHERE project_id=$1 ORDER BY kind", [fixture.project])], [{ kind: "initial_draft", state: "draft" }, { kind: "master", state: "empty" }]);
    assert.equal((await routes.deliverQualified(credential, input)).status, 204, "fully deferred replay is idempotent");
    assert.equal((await routes.deliverQualified(credential, { ...input, composite: { ...hashes, provisionalSidecarHash: "d".repeat(64) } })).status, 409);
    assert.deepEqual(await fixture.counts(), { deferred: 1, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 });
  } finally {
    await fixture.cleanup();
  }
});

test("SEM-CUTOVER-007A qualified deferral keeps a mixed bundle processing and leaves draft/Master unchanged", { skip: !databaseUrl }, async () => {
  const fixture = await createFixture("mixed", 2);
  try {
    const handler = new PostgresExtractionAcceptanceHandler({ enqueue: async () => { throw new Error("fully deferred acceptance must not enqueue"); } });
    const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: new PostgresSemanticAuthority(fixture.atlas), handler, qualifiedHandler: handler });
    const input = { version: "v1" as const, scope: fixture.scope, outcome: "qualified_deferred" as const, composite: hashes, deferredCoverage: allDeferred() };
    assert.equal((await routes.deliverQualified(credential, input)).status, 204);
    assert.deepEqual(await fixture.counts(), { deferred: 1, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 });
    assert.deepEqual([...await fixture.atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE id=$1", [fixture.bundle])], [{ state: "processing" }]);
    assert.deepEqual([...await fixture.atlas.unsafe("SELECT state FROM atlas.extraction_bundle_document WHERE bundle_id=$1 ORDER BY sequence", [fixture.bundle])], [{ state: "qualified_deferred" }, { state: "extracting" }]);
    assert.deepEqual([...await fixture.atlas.unsafe("SELECT kind,state FROM atlas.workspace WHERE project_id=$1 ORDER BY kind", [fixture.project])], [{ kind: "initial_draft", state: "draft" }, { kind: "master", state: "empty" }]);
  } finally {
    await fixture.cleanup();
  }
});

test("SEM-CUTOVER-007A qualified-result route rejects stale, foreign, and malformed coverage atomically", { skip: !databaseUrl }, async () => {
  const fixture = await createFixture("negatives");
  try {
    const handler = new PostgresExtractionAcceptanceHandler({ enqueue: async () => "unexpected" });
    const routes = createSemanticInternalRoutes({ serviceCredential: credential, authority: new PostgresSemanticAuthority(fixture.atlas), handler, qualifiedHandler: handler });
    const valid = { version: "v1" as const, scope: fixture.scope, outcome: "partial_accepted" as const, composite: hashes, deferredCoverage: deferred(), canonical: canonical() };
    const zero = { deferred: 0, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 };
    const malformed = [
      { ...valid, scope: { ...fixture.scope, documentId: "foreign-document" } },
      { ...valid, deferredCoverage: [{ ...deferred()[0], locator_id: "unknown" }, deferred()[1]] },
      { ...valid, deferredCoverage: [deferred()[0]] },
      { ...valid, deferredCoverage: [{ ...deferred()[0], classification: "candidate" }] },
      { ...valid, deferredCoverage: [{ ...deferred()[0], locator_type: "text_block", locator_id: "block-1" }, deferred()[1]] },
    ];
    for (const input of malformed) {
      assert.notEqual((await routes.deliverQualified(credential, input)).status, 204);
      assert.deepEqual(await fixture.counts(), zero, "every rejected scope or coverage variant leaves no acceptance effects");
      assert.deepEqual((await fixture.atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [fixture.execution]))[0], { lifecycle: "queued" });
    }
    await fixture.atlas.unsafe("UPDATE atlas.semantic_execution SET capability_valid_until=now()-interval '1 second' WHERE id=$1", [fixture.execution]);
    assert.equal((await routes.deliverQualified(credential, valid)).status, 409, "stale execution is rejected");
    assert.deepEqual(await fixture.counts(), zero);
    await fixture.atlas.unsafe("UPDATE atlas.semantic_execution SET lifecycle='cancelled', capability_valid_until=now()+interval '1 hour' WHERE id=$1", [fixture.execution]);
    assert.equal((await routes.deliverQualified(credential, valid)).status, 409, "cancelled execution is rejected");
    assert.deepEqual(await fixture.counts(), zero);
  } finally {
    await fixture.cleanup();
  }
});

test("SEM-CUTOVER-007A mounted qualified-result route proves redaction and the frozen negative matrix", { skip: !databaseUrl }, async () => {
  const partial = await createFixture("mounted-partial");
  const fullyDeferred = await createFixture("mounted-fully-deferred");
  const server = await mountQualifiedRoute(partial.atlasUrl);
  try {
    const partialInput = { version: "v1" as const, scope: partial.scope, outcome: "partial_accepted" as const, composite: hashes, deferredCoverage: deferred(), canonical: canonical() };
    const deferredInput = { version: "v1" as const, scope: fullyDeferred.scope, outcome: "qualified_deferred" as const, composite: hashes, deferredCoverage: allDeferred() };

    assertRedacted(await server.post(partialInput), 401, { error: "Unauthorized internal service request." });
    assertRedacted(await server.post({ malformed: true }, credential), 409, { error: "Semantic delivery cannot be accepted." });
    assert.equal((await server.post(partialInput, credential)).status, 204, "the mounted Atlas route accepts partial truth");
    assert.deepEqual(await partial.counts(), { deferred: 1, results: 1, candidates: 1, evidence: 1, knowledge: 1, reconciliation: 1, jobs: 1 });
    assert.equal((await server.post(deferredInput, credential)).status, 204, "the mounted Atlas route accepts fully deferred truth");
    assert.deepEqual(await fullyDeferred.counts(), { deferred: 1, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 });

    assertRedacted(await server.post({ ...partialInput, composite: { ...hashes, relationshipRevisionSetHash: "d".repeat(64) } }, credential), 409, { error: "Semantic delivery cannot be accepted." });
    assertRedacted(await server.post({ ...partialInput, deferredCoverage: deferred().map((item, index) => index === 0 ? { ...item, source_unit_id: "changed-coverage" } : item) }, credential), 409, { error: "Semantic delivery cannot be accepted." });

    const negative = await createFixture("mounted-negatives");
    try {
      const valid = { version: "v1" as const, scope: negative.scope, outcome: "partial_accepted" as const, composite: hashes, deferredCoverage: deferred(), canonical: canonical() };
      const zero = { deferred: 0, results: 0, candidates: 0, evidence: 0, knowledge: 0, reconciliation: 0, jobs: 0 };
      const rejected = [
        { input: { ...valid, scope: { ...negative.scope, executionId: randomUUID() } }, status: 409, body: { error: "Semantic delivery cannot be accepted." } },
        { input: { ...valid, scope: { ...negative.scope, documentId: randomUUID() } }, status: 409, body: { error: "Semantic delivery cannot be accepted." } },
        { input: { ...valid, deferredCoverage: [deferred()[0], deferred()[0], deferred()[1]] }, status: 422, body: { error: "Semantic result failed deterministic validation." } },
        { input: { ...valid, deferredCoverage: [{ ...deferred()[0], locator_id: "unknown" }, deferred()[1]] }, status: 422, body: { error: "Semantic result failed deterministic validation." } },
        { input: { ...valid, deferredCoverage: [deferred()[0]] }, status: 422, body: { error: "Semantic result failed deterministic validation." } },
        { input: { ...valid, deferredCoverage: [{ ...deferred()[0], classification: "candidate" }, deferred()[1]] }, status: 409, body: { error: "Semantic delivery cannot be accepted." } },
        { input: { ...valid, deferredCoverage: [{ ...deferred()[0], locator_type: "text_block", locator_id: "block-1" }, deferred()[1]] }, status: 422, body: { error: "Semantic result failed deterministic validation." } },
      ];
      for (const rejection of rejected) {
        assertRedacted(await server.post(rejection.input, credential), rejection.status, rejection.body);
        assert.deepEqual(await negative.counts(), zero);
        assert.deepEqual((await negative.atlas.unsafe("SELECT lifecycle FROM atlas.semantic_execution WHERE id=$1", [negative.execution]))[0], { lifecycle: "queued" });
      }
      await negative.atlas.unsafe("UPDATE atlas.semantic_execution SET capability_valid_until=now()-interval '1 second' WHERE id=$1", [negative.execution]);
      assertRedacted(await server.post(valid, credential), 409, { error: "Semantic delivery cannot be accepted." });
      assert.deepEqual(await negative.counts(), zero);
    } finally { await negative.cleanup(); }
  } finally {
    await server.close();
    await Promise.all([partial.cleanup(), fullyDeferred.cleanup()]);
  }
});

function assertRedacted(response: { status: number; body: unknown }, status: number, body: unknown) {
  assert.equal(response.status, status);
  assert.deepEqual(response.body, body);
  assert.doesNotMatch(JSON.stringify(response.body), /postgres|sql|source\.pdf|credential|provider|stack/i);
}

async function mountQualifiedRoute(database: URL) {
  const original = { database: process.env.ATLAS_DATABASE_URL, credential: process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL };
  process.env.ATLAS_DATABASE_URL = database.toString();
  process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL = credential;
  let middleware: ((request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse, next: () => void) => Promise<void>) | undefined;
  const jiti = createJiti(import.meta.url);
  const { createAtlasPerceptionInternalPlugin } = await jiti.import<typeof import("../../../apps/atlas/perception-internal.ts")>("../../../apps/atlas/perception-internal.ts");
  const listener = createServer((request, response) => {
    if (!middleware) throw new Error("qualified route middleware was not registered");
    void middleware(request, response, () => { response.statusCode = 404; response.end(); });
  });
  const viteServer = { httpServer: listener, middlewares: { use(handler: typeof middleware) { middleware = handler; } } };
  await createAtlasPerceptionInternalPlugin().configureServer!(viteServer as never);
  await new Promise<void>((resolve) => listener.listen(0, "127.0.0.1", () => resolve()));
  const address = listener.address();
  if (!address || typeof address === "string") throw new Error("qualified route listener did not bind a TCP port");
  return {
    async post(body: unknown, bearer?: string) {
      const response = await fetch(`http://127.0.0.1:${address.port}/internal/semantic/qualified-result`, { method: "POST", headers: { "content-type": "application/json", ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify(body) });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    },
    async close() {
      await new Promise<void>((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
      if (original.database === undefined) delete process.env.ATLAS_DATABASE_URL; else process.env.ATLAS_DATABASE_URL = original.database;
      if (original.credential === undefined) delete process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL; else process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL = original.credential;
    },
  };
}

async function createFixture(label: string, expectedDocuments = 1) {
  const admin = postgres(databaseUrl!, { max: 1 });
  const atlasUrl = new URL(databaseUrl!); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const atlas = postgres(atlasUrl.toString(), { max: 1 });
  const suffix = randomUUID(); const owner = `deferred-${label}-owner-${suffix}`; const project = `deferred-${label}-project-${suffix}`; const draft = `deferred-${label}-draft-${suffix}`; const master = `deferred-${label}-master-${suffix}`; const bundle = `deferred-${label}-bundle-${suffix}`; const document = `deferred-${label}-document-${suffix}`; const extraDocument = expectedDocuments === 2 ? `deferred-${label}-extra-document-${suffix}` : undefined; const perception = `deferred-${label}-perception-${suffix}`; const execution = `deferred-${label}-execution-${suffix}`; const sourceSha = "e".repeat(64); const capability = `deferred-${label}-capability-${suffix}`;
  const scope = { projectId: project, workspaceId: draft, bundleId: bundle, documentId: document, executionId: execution, contractVersion: "v1" as const };
  await admin.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
  await atlas.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'deferred acceptance',$3)", [project, `deferred-${suffix.slice(0, 12)}`, owner]);
  await atlas.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Initial Draft'),($3,$2,'master','empty','Master')", [draft, project, master]);
  await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'source.pdf','private/source',$4,1,'application/pdf',$5)", [document, project, draft, sourceSha, owner]);
  if (extraDocument) await atlas.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'extra.pdf','private/extra',$4,1,'application/pdf',$5)", [extraDocument, project, draft, "f".repeat(64), owner]);
  await atlas.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',$4)", [bundle, project, draft, expectedDocuments]);
  await atlas.unsafe("INSERT INTO atlas.document_perception_execution (id,artifact_id,document_storage_key,source_sha256,mime_type,byte_size,contract_version,state,idempotency_key,capability_identity) VALUES ($1,$2,'private/source',$3,'application/pdf',1,'v1','completed',$4,$5)", [perception, document, sourceSha, `perception-${suffix}`, capability]);
  await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id,semantic_extraction_execution_id) VALUES ($1,$2,$3,$4,1,'extracting',$5,$6)", [bundle, document, project, draft, perception, execution]);
  if (extraDocument) await atlas.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state) VALUES ($1,$2,$3,$4,2,'extracting')", [bundle, extraDocument, project, draft]);
  await atlas.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [bundle]);
  await atlas.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until) VALUES ($1,$2,$3,$4,$5,'extraction','v1','v1',$1,'queued','perception',$6,now()+interval '1 hour')", [execution, project, draft, bundle, document, canonicalSemanticFingerprint("capability")]);
  await atlas.unsafe("INSERT INTO atlas.normalized_document_cache (cache_key,source_sha256,contract_version,capability,capability_identity,normalized_document) VALUES ($1,$2,'v1','atlas.document.perceive',$3,$4::jsonb)", [`deferred-cache-${suffix}`, sourceSha, capability, JSON.stringify(normalized(perception, document, sourceSha))]);
  const counts = async () => ({
    deferred: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_deferred_acceptance WHERE execution_id=$1", [execution]))[0].count),
    results: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_extraction_result WHERE execution_id=$1", [execution]))[0].count),
    candidates: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate WHERE document_id=$1", [document]))[0].count),
    evidence: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_evidence WHERE document_id=$1", [document]))[0].count),
    knowledge: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.knowledge_index WHERE document_id=$1", [document]))[0].count),
    reconciliation: Number((await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_execution WHERE document_id=$1 AND stage='reconciliation'", [document]))[0].count),
    jobs: Number((await admin.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE document_id=$1 AND stage='reconciliation')", [document]))[0].count),
  });
  const cleanup = async () => {
    try {
      await admin.unsafe("DELETE FROM pgboss.job WHERE name='bridge-background-execution-v1' AND data->'execution'->>'executionId' IN (SELECT id FROM atlas.semantic_execution WHERE project_id=$1)", [project]);
      await admin.unsafe("DELETE FROM atlas.semantic_evidence WHERE document_id=$1", [document]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate_identity_map WHERE extraction_execution_id=$1", [execution]);
      await admin.unsafe("DELETE FROM atlas.knowledge_index WHERE document_id=$1", [document]);
      await admin.unsafe("DELETE FROM atlas.semantic_candidate WHERE document_id=$1", [document]);
      await admin.unsafe("DELETE FROM atlas.semantic_extraction_result WHERE execution_id=$1", [execution]);
      await admin.unsafe("DELETE FROM atlas.semantic_execution WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.extraction_bundle WHERE id=$1", [bundle]);
      await admin.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [perception]);
      await admin.unsafe("DELETE FROM atlas.normalized_document_cache WHERE cache_key=$1", [`deferred-cache-${suffix}`]);
      await admin.unsafe("DELETE FROM atlas.document WHERE project_id=$1", [project]);
      await admin.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]);
      await admin.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]);
    } finally { await Promise.allSettled([atlas.end(), admin.end()]); }
  };
  return { admin, atlas, atlasUrl, project, bundle, document, execution, scope, counts, cleanup };
}
