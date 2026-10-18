import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { PerceptionSourceGrantIssuer } from "@atlas/core";
import { PostgresPerceptionAuthority } from "../src/perception-authority.ts";
import { PostgresAcceptedSemanticBatchPlanInputFixtureRepository, parseSemanticBatchPlanInputV1 } from "../src/semantic-batch-plan-input.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("accepted RUN-003 facts derive the sole canonical semantic-batch input without any downstream effect", { skip }, async () => {
  const sql = postgres(databaseUrl!, { max: 1 });
  const suffix = randomUUID();
  const owner = `semantic-batch-input-owner-${suffix}`;
  const project = `semantic-batch-input-project-${suffix}`;
  const workspace = `semantic-batch-input-workspace-${suffix}`;
  const bundle = `semantic-batch-input-bundle-${suffix}`;
  const documentId = `semantic-batch-input-document-${suffix}`;
  const executionId = `semantic-batch-input-execution-${suffix}`;
  const sourceSha256 = createHash("sha256").update(`semantic-batch-input-source-${suffix}`).digest("hex");
  const capabilityIdentity = "docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1";
  const input = { executionId, artifactId: documentId, storageKey: `private/${suffix}.pdf`, sourceSha256, mimeType: "application/pdf" as const, byteSize: 64, idempotencyKey: `semantic-batch-input-${suffix}`, capabilityIdentity };
  const authority = new PostgresPerceptionAuthority(sql, new PerceptionSourceGrantIssuer("i".repeat(32)), undefined, capabilityIdentity);
  const fixtures = new PostgresAcceptedSemanticBatchPlanInputFixtureRepository(sql);
  try {
    const request = await authority.create(input);
    await sql.unsafe('INSERT INTO auth."user" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$1,$2,false,now(),now())', [owner, `${owner}@example.test`]);
    await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,created_by_user_id) VALUES ($1,$2,'semantic batch input fixture',$3)", [project, `semantic-batch-input-${suffix.slice(0, 12)}`, owner]);
    await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'initial_draft','draft','Draft')", [workspace, project]);
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,'accepted.pdf',$4,$5,$6,'application/pdf',$7)", [documentId, project, workspace, input.storageKey, sourceSha256, input.byteSize, owner]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,perception_admission_policy) VALUES ($1,$2,$3,'waiting','v1','v1',1,'staged-fair-local-v1')", [bundle, project, workspace]);
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,perception_execution_id) VALUES ($1,$2,$3,$4,1,'perception_queued',$5)", [bundle, documentId, project, workspace, executionId]);
    await authority.redeem(request);
    await authority.deliver(request, {
      version: "v1",
      executionId,
      artifactId: documentId,
      sourceSha256,
      perception: request.perception,
      provider: { name: "docling", processor: "run-003-capture", executionId, processedAt: "2026-10-19T00:00:00.000Z" },
      pages: [{ number: 1, textBlocks: [], tables: [], visualRegions: [] }],
    });
    const accepted = (await sql.unsafe("SELECT e.state AS execution_state, m.state AS member_state, e.completion_fingerprint, c.cache_key FROM atlas.document_perception_execution e JOIN atlas.extraction_bundle_document m ON m.perception_execution_id=e.id JOIN atlas.normalized_document_cache c ON c.source_sha256=e.source_sha256 AND c.contract_version=e.contract_version AND c.capability_identity=e.capability_identity AND c.invalidated_at IS NULL WHERE e.id=$1", [executionId]))[0]!;
    assert.deepEqual({ execution_state: accepted.execution_state, member_state: accepted.member_state }, { execution_state: "completed", member_state: "perceived" }, "fixture source is an actual accepted staged-perception record");
    const before = (await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.normalized_document_cache WHERE source_sha256=$1) AS cache_rows, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$2) AS semantic_executions, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$2) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$2) AS semantic_candidates, (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$2) AS knowledge_index, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$2) AS reconciliation_results", [sourceSha256, documentId]))[0];
    const fixture = await fixtures.derive(executionId);
    const replay = await fixtures.derive(executionId);
    assert.deepEqual(replay, fixture, "the same accepted facts always reproduce the exact fixture and provenance");
    assert.equal(fixture.provenance.repositoryPath, "atlas.document_perception_execution -> atlas.extraction_bundle_document -> atlas.document -> atlas.normalized_document_cache");
    assert.equal(fixture.input.normalizedDocumentRef, accepted.cache_key, "fixture uses the persisted cache key");
    assert.equal(fixture.input.sourceSha256, sourceSha256, "fixture uses the original document source digest");
    assert.equal(fixture.input.normalizedDocumentFingerprint, accepted.completion_fingerprint, "fixture uses the accepted completion fingerprint");
    assert.notEqual(fixture.input.normalizedDocumentRef, fixture.input.normalizedDocumentFingerprint, "cache key and completion fingerprint remain distinct identities");
    assert.equal(fixture.canonicalJsonSha256, createHash("sha256").update(fixture.canonicalJson).digest("hex"));
    assert.deepEqual(parseSemanticBatchPlanInputV1(fixture.canonicalJson), fixture.input);
    assert.ok(!fixture.canonicalJson.includes(input.storageKey), "fixture does not copy a source-storage path");
    assert.ok(!fixture.canonicalJson.includes("normalized_document"), "fixture does not copy normalized document or media bytes");
    assert.deepEqual((await sql.unsafe("SELECT (SELECT count(*)::int FROM atlas.normalized_document_cache WHERE source_sha256=$1) AS cache_rows, (SELECT count(*)::int FROM atlas.semantic_execution WHERE document_id=$2) AS semantic_executions, (SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE document_id=$2) AS semantic_results, (SELECT count(*)::int FROM atlas.semantic_candidate WHERE document_id=$2) AS semantic_candidates, (SELECT count(*)::int FROM atlas.knowledge_index WHERE document_id=$2) AS knowledge_index, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result WHERE current_document_id=$2) AS reconciliation_results", [sourceSha256, documentId]))[0], before, "fixture derivation and parser are read-only and create no semantic or reconciliation effects");
    await assert.rejects(() => fixtures.derive(`lookalike-${suffix}`), /accepted.*unavailable|ambiguous/i, "a JSON-shaped identity without accepted persisted facts cannot produce a fixture");

    const reject = (label: string, body: string) => assert.throws(() => parseSemanticBatchPlanInputV1(body), /SemanticBatchPlanInput\/v1 is invalid/, label);
    reject("missing field", JSON.stringify({ ...fixture.input, sourceSha256: undefined }));
    reject("extra field", `${fixture.canonicalJson.slice(0, -1)},"extra":true}`);
    reject("duplicate field", fixture.canonicalJson.replace("\"sourceSha256\":", `"sourceSha256":"${"0".repeat(64)}",\"sourceSha256\":`));
    reject("prototype-bearing field", `${fixture.canonicalJson.slice(0, -1)},"__proto__":{}}`);
    reject("oversized body", "x".repeat(2049));
    reject("malformed hash", fixture.canonicalJson.replace(fixture.input.sourceSha256, fixture.input.sourceSha256.toUpperCase()));
    reject("malformed execution", fixture.canonicalJson.replace(executionId, ""));
    reject("wrong version", fixture.canonicalJson.replace("\"normalizedDocumentVersion\":\"v1\"", "\"normalizedDocumentVersion\":\"v2\""));
    reject("noncanonical whitespace", ` ${fixture.canonicalJson}`);
  } finally {
    await sql.unsafe("DELETE FROM atlas.normalized_document_cache WHERE source_sha256=$1", [sourceSha256]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.document_perception_execution WHERE id=$1", [executionId]).catch(() => undefined);
    await sql.unsafe("DELETE FROM atlas.project WHERE id=$1", [project]).catch(() => undefined);
    await sql.unsafe('DELETE FROM auth."user" WHERE id=$1', [owner]).catch(() => undefined);
    await sql.end();
  }
});
