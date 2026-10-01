import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const base = ["compose", "-f", "docker-compose.yml"];
const compose = [...base, "-f", "docker-compose.perception-smoke.yml"];
const run = async (args, optional = false) => {
  try { return (await execFileAsync("docker", args, { cwd: root, maxBuffer: 4 * 1024 * 1024 })).stdout; }
  catch (error) { if (optional) return ""; throw new Error(String(error?.stderr ?? error).slice(-4000)); }
};
const waitFor = async (predicate) => {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) { if (await predicate()) return; await new Promise((resolve) => setTimeout(resolve, 250)); }
  throw new Error("Timed out waiting for the controlled IDSER-010 scenario.");
};
const url = process.env.DATABASE_URL ?? "postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev";
const atlasUrl = new URL(url); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
const bridgeUrl = new URL(url); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
const atlas = postgres(atlasUrl.toString(), { max: 2 });
const bridge = postgres(bridgeUrl.toString(), { max: 2 });
const origin = "http://localhost:3001";
const homeReadSecret = async () => {
  const settings = await readFile(new URL("../../atlas/.dev.vars", import.meta.url), "utf8");
  const match = settings.match(/^BETTER_AUTH_SECRET=(.+)$/m);
  assert.ok(match?.[1], "the controlled Compose configuration supplies the internal home-read secret");
  return match[1].trim();
};
const readProjectCard = async (projectId, expectedUncertainty, expectedDocuments = 1) => {
  const [project] = await atlas.unsafe("SELECT id, created_by_user_id FROM atlas.project WHERE stable_id=$1", [projectId]);
  assert.ok(project, "the authenticated project remains available to its owner");
  const issuedAt = String(Date.now());
  const signature = createHmac("sha256", await homeReadSecret()).update(`${project.created_by_user_id}.${issuedAt}`).digest("hex");
  const response = await fetch(`${origin}/internal/home-projects`, { headers: { "x-atlas-home-user-id": project.created_by_user_id, "x-atlas-home-issued-at": issuedAt, "x-atlas-home-signature": signature } });
  assert.equal(response.status, 200, "the production home-project read model accepts the authenticated owner identity");
  const body = await response.json();
  assert.ok(Array.isArray(body.projects), "the production home-project route returns its bounded card collection");
  const card = body.projects.find((value) => value.projectId === projectId);
  assert.deepEqual(card && { state: card.state, uncertainty: card.hasSemanticUncertainty, attentionReason: card.attentionReason, processed: card.initialDraft?.processedLabel, progress: card.initialDraft?.progressPercent, master: card.master?.label }, { state: "ready-for-review", uncertainty: expectedUncertainty, attentionReason: undefined, processed: `${expectedDocuments} of ${expectedDocuments} PRDs processed`, progress: 100, master: "No published work" }, "the production card presents the completed bundle as Ready for review without Needs attention");
};
const readOwnedProjectIds = async (ownerId) => {
  const issuedAt = String(Date.now());
  const signature = createHmac("sha256", await homeReadSecret()).update(`${ownerId}.${issuedAt}`).digest("hex");
  const response = await fetch(`${origin}/internal/home-projects`, { headers: { "x-atlas-home-user-id": ownerId, "x-atlas-home-issued-at": issuedAt, "x-atlas-home-signature": signature } });
  assert.equal(response.status, 200);
  const body = await response.json();
  return body.projects.map((project) => project.projectId);
};
const cookie = async (label) => {
  const email = `idser-010-${label}-${crypto.randomUUID().slice(0, 10)}@example.test`;
  const signUp = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "IDSER 010", email, password: "a-tested-local-password" }) });
  assert.equal(signUp.status, 200);
  const signIn = await fetch(`${origin}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email, password: "a-tested-local-password" }) });
  assert.equal(signIn.status, 200);
  return { email, value: signIn.headers.getSetCookie().map((item) => item.split(";", 1)[0]).join("; ") };
};
const create = async (label, texts, projectName = `IDSER 010 ${label}`) => {
  const auth = await cookie(label);
  const projectId = `idser-010-${label}-${crypto.randomUUID().slice(0, 10)}`;
  const form = new FormData(); form.set("projectId", projectId); form.set("projectName", projectName);
  for (const [index, text] of texts.entries()) form.append("prdFiles[]", new File([Buffer.from(`%PDF-1.7\n${text}`)], `${label}-${index + 1}.pdf`, { type: "application/pdf" }));
  const response = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie: auth.value, origin }, body: form });
  assert.equal(response.status, 201, await response.text());
  return { projectId, email: auth.email, cookie: auth.value };
};
let projects = [];
try {
  await run([...compose, "up", "-d", "--build", "--wait"]);
  for (const [label, texts, expectedCandidates, relationship] of [["normal", ["Normal approval statement"], 1, "new"], ["conflict", ["Conflicting quota statements"], 2, "contradicts"]]) {
    const item = await create(label, texts); projects.push(item);
    await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1)", [item.projectId]))[0]?.state === "ready_for_review");
    const [facts] = await atlas.unsafe("SELECT b.expected_document_count, b.completed_document_count, w.state AS workspace_state, master.state AS master_state, (SELECT count(*)::int FROM atlas.semantic_candidate c WHERE c.bundle_id=b.id) AS candidates, (SELECT count(*)::int FROM atlas.semantic_evidence e JOIN atlas.semantic_candidate c ON c.id=e.semantic_candidate_id WHERE c.bundle_id=b.id) AS evidence, (SELECT count(*)::int FROM atlas.reconciliation_relationship r WHERE r.bundle_id=b.id AND r.relationship_type=$2) AS relationships FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id JOIN atlas.workspace w ON w.id=b.workspace_id JOIN atlas.workspace master ON master.project_id=p.id AND master.kind='master' WHERE p.stable_id=$1", [item.projectId, relationship]);
    assert.deepEqual({ expected: Number(facts.expected_document_count), completed: Number(facts.completed_document_count), workspace: facts.workspace_state, master: facts.master_state, candidates: Number(facts.candidates), relationships: Number(facts.relationships) }, { expected: 1, completed: 1, workspace: "ready_for_review", master: "empty", candidates: expectedCandidates, relationships: 1 });
    assert.ok(Number(facts.evidence) >= expectedCandidates);
    const [states] = await atlas.unsafe("SELECT count(*)::int AS completed FROM atlas.semantic_execution e JOIN atlas.project p ON p.id=e.project_id WHERE p.stable_id=$1 AND e.lifecycle='completed'", [item.projectId]);
    assert.equal(Number(states.completed), 2, "actual extraction and reconciliation executions complete");
    const [results] = await atlas.unsafe("SELECT (SELECT count(*)::int FROM atlas.semantic_extraction_result extraction JOIN atlas.semantic_execution execution ON execution.id=extraction.execution_id AND execution.project_id=extraction.project_id AND execution.workspace_id=extraction.workspace_id AND execution.bundle_id=extraction.bundle_id AND execution.document_id=extraction.document_id JOIN atlas.document document ON document.id=extraction.document_id AND document.project_id=extraction.project_id AND document.workspace_id=extraction.workspace_id WHERE extraction.project_id=p.id AND extraction.workspace_id=b.workspace_id AND extraction.bundle_id=b.id AND execution.stage='extraction' AND execution.lifecycle='completed' AND extraction.contract_version='v1' AND extraction.source_sha256=document.source_sha256 AND extraction.provider_provenance->>'provider'='mistral' AND extraction.provider_provenance->>'endpoint'='/v1/chat/completions' AND extraction.result_json->>'version'='v1' AND jsonb_typeof(extraction.result_json->'candidate_assertions')='array' AND jsonb_array_length(extraction.result_json->'candidate_assertions')=$2) AS extraction_results, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result reconciliation JOIN atlas.semantic_execution execution ON execution.id=reconciliation.execution_id AND execution.project_id=reconciliation.project_id AND execution.workspace_id=reconciliation.workspace_id AND execution.bundle_id=reconciliation.bundle_id AND execution.document_id=reconciliation.current_document_id WHERE reconciliation.project_id=p.id AND reconciliation.workspace_id=b.workspace_id AND reconciliation.bundle_id=b.id AND execution.stage='reconciliation' AND execution.lifecycle='completed' AND reconciliation.contract_version='v1' AND reconciliation.provider_provenance->>'provider'='mistral' AND reconciliation.provider_provenance->>'endpoint'='/v1/chat/completions' AND reconciliation.result_json->>'version'='v1' AND jsonb_typeof(reconciliation.result_json->'relationships')='array' AND jsonb_array_length(reconciliation.result_json->'relationships')=$2) AS reconciliation_results, (SELECT count(*)::int FROM atlas.semantic_candidate candidate JOIN atlas.semantic_extraction_result extraction ON extraction.id=candidate.extraction_result_id AND extraction.project_id=candidate.project_id AND extraction.workspace_id=candidate.workspace_id AND extraction.bundle_id=candidate.bundle_id AND extraction.document_id=candidate.document_id JOIN atlas.semantic_evidence evidence ON evidence.semantic_candidate_id=candidate.id AND evidence.document_id=candidate.document_id JOIN atlas.knowledge_index knowledge ON knowledge.semantic_candidate_id=candidate.id AND knowledge.project_id=candidate.project_id AND knowledge.workspace_id=candidate.workspace_id AND knowledge.bundle_id=candidate.bundle_id AND knowledge.document_id=candidate.document_id WHERE candidate.project_id=p.id AND candidate.workspace_id=b.workspace_id AND candidate.bundle_id=b.id) AS resolved_candidate_evidence_ids FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id WHERE p.stable_id=$1", [item.projectId, expectedCandidates]);
    assert.deepEqual({ extraction: Number(results.extraction_results), reconciliation: Number(results.reconciliation_results), resolvedCandidateEvidenceIds: Number(results.resolved_candidate_evidence_ids) }, { extraction: 1, reconciliation: 1, resolvedCandidateEvidenceIds: expectedCandidates }, "persisted full semantic results, provider provenance, and candidate/evidence identities resolve in this project bundle");
    if (label === "conflict") {
      const [unresolved] = await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_candidate c JOIN atlas.project p ON p.id=c.project_id WHERE p.stable_id=$1 AND c.needs_resolution AND c.state='candidate'", [item.projectId]);
      assert.equal(Number(unresolved.count), 2);
      const [relationshipState] = await atlas.unsafe("SELECT count(*)::int AS unresolved FROM atlas.reconciliation_relationship relationship JOIN atlas.project p ON p.id=relationship.project_id JOIN atlas.extraction_bundle b ON b.id=relationship.bundle_id AND b.project_id=p.id WHERE p.stable_id=$1 AND relationship.workspace_id=b.workspace_id AND relationship.relationship_type='contradicts' AND relationship.requires_resolution=true", [item.projectId]);
      assert.equal(Number(relationshipState.unresolved), 1, "the persisted conflict relationship remains unresolved");
    }
    await readProjectCard(item.projectId, label === "conflict");
  }
  for (const [label, texts, relationship] of [["scenario-c-supports", ["Normal approval statement", "Supports approval statement"], "supports"], ["scenario-c-duplicates", ["Normal approval statement", "Duplicate approval statement"], "duplicates"], ["scenario-d", ["Normal approval statement", "Conflicting quota statements"], "contradicts"], ["scenario-e", ["Normal approval statement", "Normal approval statement", "Normal approval statement"], "new"]]) {
    const item = await create(label, texts); projects.push(item);
    await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1)", [item.projectId]))[0]?.state === "ready_for_review");
    const [bundle] = await atlas.unsafe("SELECT b.id, b.expected_document_count, b.completed_document_count FROM atlas.extraction_bundle b JOIN atlas.project p ON p.id=b.project_id WHERE p.stable_id=$1", [item.projectId]);
    assert.deepEqual({ expected: Number(bundle.expected_document_count), completed: Number(bundle.completed_document_count) }, { expected: texts.length, completed: texts.length }, `${label} completes only after every document is reconciled`);
    const members = await atlas.unsafe("SELECT m.sequence, m.state, m.started_at, m.completed_at, (SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.bundle_id=m.bundle_id AND e.document_id=m.document_id AND e.lifecycle='completed') AS stages FROM atlas.extraction_bundle_document m WHERE m.bundle_id=$1 ORDER BY m.sequence", [bundle.id]);
    assert.equal(members.length, texts.length);
    assert.ok(members.every((member) => member.state === "completed" && Number(member.stages) === 2), `${label} persists both completed semantic stages for every member`);
    for (let index = 1; index < members.length; index += 1) assert.ok(new Date(members[index].started_at).getTime() >= new Date(members[index - 1].completed_at).getTime(), `${label} starts D${index + 1} only after D${index} reconciliation acceptance`);
    const relationships = await atlas.unsafe("SELECT r.relationship_type, r.requires_resolution, r.source_semantic_id, r.target_semantic_id FROM atlas.reconciliation_relationship r WHERE r.bundle_id=$1 AND r.relationship_type=$2", [bundle.id, relationship]);
    assert.ok(relationships.length >= 1, `${label} persists its controlled ${relationship} relationship`);
    if (relationship === "supports" || relationship === "duplicates") assert.ok(relationships.some((row) => row.target_semantic_id), `${label} resolves only to the selected prior candidate neighborhood`);
    if (relationship === "contradicts") assert.ok(relationships.some((row) => row.requires_resolution), "D persists an unresolved contradiction without accepting a candidate");
    const [candidateStates] = await atlas.unsafe("SELECT count(*)::int AS candidates, count(*) FILTER (WHERE state <> 'candidate')::int AS non_candidates FROM atlas.semantic_candidate WHERE bundle_id=$1", [bundle.id]);
    assert.equal(Number(candidateStates.non_candidates), 0, `${label} keeps all relationship results as incoming candidates`);
    assert.ok(Number(candidateStates.candidates) >= texts.length, `${label} accounts for every current document candidate`);
    await readProjectCard(item.projectId, relationship === "contradicts", texts.length);
  }
  // Scenario F: create two identically named projects concurrently.  The
  // controlled provider emits distinct candidate meanings from their source
  // text, making a cross-context or cross-result delivery observable.
  const sameDisplayName = "Scenario F duplicate display name";
  const [alpha, beta] = await Promise.all([
    create("scenario-f-alpha", ["Isolation alpha payload"], sameDisplayName),
    create("scenario-f-beta", ["Isolation beta payload"], sameDisplayName),
  ]);
  projects.push(alpha, beta);
  await Promise.all([alpha, beta].map((item) => waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1)", [item.projectId]))[0]?.state === "ready_for_review")));
  const isolated = await atlas.unsafe("SELECT p.stable_id, p.id AS project_id, p.name, p.created_by_user_id, w.id AS workspace_id, b.id AS bundle_id, d.id AS document_id, array_agg(e.id ORDER BY e.stage) AS execution_ids, b.expected_document_count, b.completed_document_count, array_agg(DISTINCT c.normalized_meaning) AS meanings, count(DISTINCT x.id)::int AS extraction_results, count(DISTINCT r.id)::int AS reconciliation_results, count(DISTINCT c.id)::int AS candidates, count(DISTINCT ev.id)::int AS evidence, count(DISTINCT rr.id)::int AS relationships FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id JOIN atlas.document d ON d.project_id=p.id AND d.workspace_id=w.id JOIN atlas.semantic_execution e ON e.project_id=p.id AND e.workspace_id=w.id AND e.bundle_id=b.id AND e.document_id=d.id JOIN atlas.semantic_candidate c ON c.project_id=p.id AND c.workspace_id=w.id AND c.bundle_id=b.id AND c.document_id=d.id JOIN atlas.semantic_extraction_result x ON x.project_id=p.id AND x.workspace_id=w.id AND x.bundle_id=b.id AND x.document_id=d.id JOIN atlas.semantic_reconciliation_result r ON r.project_id=p.id AND r.workspace_id=w.id AND r.bundle_id=b.id AND r.current_document_id=d.id JOIN atlas.semantic_evidence ev ON ev.document_id=d.id AND ev.semantic_candidate_id=c.id JOIN atlas.reconciliation_relationship rr ON rr.project_id=p.id AND rr.workspace_id=w.id AND rr.bundle_id=b.id WHERE p.stable_id = ANY($1::text[]) GROUP BY p.stable_id, p.id, p.name, p.created_by_user_id, w.id, b.id, d.id, b.expected_document_count, b.completed_document_count ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
  assert.equal(isolated.length, 2, "both same-display-name scopes finish");
  assert.deepEqual(isolated.map((row) => row.name), [sameDisplayName, sameDisplayName]);
  for (const row of isolated) {
    assert.deepEqual({ expected: Number(row.expected_document_count), completed: Number(row.completed_document_count), extraction: Number(row.extraction_results), reconciliation: Number(row.reconciliation_results), candidates: Number(row.candidates), evidence: Number(row.evidence), relationships: Number(row.relationships) }, { expected: 1, completed: 1, extraction: 1, reconciliation: 1, candidates: 1, evidence: 1, relationships: 1 }, "each bundle has exactly its own completed N/N materialization");
    assert.equal(new Set([row.project_id, row.workspace_id, row.bundle_id, row.document_id, ...row.execution_ids]).size, 6, "every persisted scenario-F identity is unique");
    const expectedMeaning = row.stable_id === alpha.projectId ? "Scenario F alpha assertion." : "Scenario F beta assertion.";
    assert.deepEqual(row.meanings, [expectedMeaning], "the controlled provider result stays bound to its exact execution scope");
  }
  assert.notDeepEqual(isolated[0].execution_ids, isolated[1].execution_ids, "no execution identity is shared across same-display-name bundles");
  for (const item of [alpha, beta]) {
    const owner = isolated.find((row) => row.stable_id === item.projectId).created_by_user_id;
    const visible = await readOwnedProjectIds(owner);
    assert.ok(visible.includes(item.projectId), "an owner can read its own same-display-name project");
    const foreign = item === alpha ? beta.projectId : alpha.projectId;
    assert.ok(!visible.includes(foreign), "an owner cannot cross-read the other same-display-name project");
  }
  const executionIds = isolated.flatMap((row) => row.execution_ids);
  const [remainingJobs] = await atlas.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE data->'execution'->>'executionId' = ANY($1::text[])", [executionIds]);
  assert.equal(Number(remainingJobs.count), 0, "the production worker cleaned up each scoped queue job after exactly one completed delivery");
  const metrics = JSON.parse(await run([...compose, "exec", "-T", "mistral-mock", "node", "-e", "fetch('http://127.0.0.1:3100/metrics').then(async response => process.stdout.write(await response.text()))"]));
  assert.ok(metrics.ocrCalls >= 13, "the controlled Mistral endpoint received every single- and multi-document OCR call");
  assert.ok(metrics.structuredCalls >= 26, "the controlled Mistral endpoint received both semantic stages for every controlled document");
  const [direct] = await bridge.unsafe("SELECT has_schema_privilege('agents_bridge','atlas','USAGE') AS schema_usage");
  assert.equal(direct.schema_usage, false, "Bridge has no direct Atlas schema privilege");
  process.stdout.write("IDSER-010 controlled Compose scenarios A/B/C/D/E/F passed.\n");
} finally {
  for (const item of projects) {
    const project = "SELECT id FROM atlas.project WHERE stable_id=$1";
    await atlas.unsafe(`DELETE FROM atlas.reconciliation_relationship WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_reconciliation_result WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_evidence WHERE document_id IN (SELECT id FROM atlas.document WHERE project_id IN (${project}))`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_candidate_identity_map WHERE extraction_execution_id IN (SELECT id FROM atlas.semantic_execution WHERE project_id IN (${project}))`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.knowledge_index WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_candidate WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_extraction_result WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_execution_context WHERE execution_id IN (SELECT id FROM atlas.semantic_execution WHERE project_id IN (${project}))`, [item.projectId]);
    await atlas.unsafe(`DELETE FROM atlas.semantic_execution WHERE project_id IN (${project})`, [item.projectId]);
    await atlas.unsafe("DELETE FROM atlas.project WHERE stable_id=$1", [item.projectId]);
    await atlas.unsafe('DELETE FROM auth."user" WHERE email=$1', [item.email]);
  }
  await Promise.all([atlas.end(), bridge.end()]);
  await run([...compose, "down"], true);
  await run([...base, "up", "-d", "--wait"], true);
}
