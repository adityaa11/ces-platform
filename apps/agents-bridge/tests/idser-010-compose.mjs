import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const canonicalJson = (value) => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right))) : item);
// This checkpoint owns a disposable Compose project so its restart and queue
// observations cannot consume or mutate a developer's long-lived pg-boss DB.
const composeEnvironment = { ...process.env, POSTGRES_PORT: "15432", ATLAS_PORT: "13001", AGENTS_BRIDGE_PORT: "13002" };
const stagedRegression = process.env.IDSER_012_STAGED_REGRESSION === "1" || process.argv.includes("--staged-regression");
const base = ["compose", "-p", "idser-010-compose", "-f", "docker-compose.yml"];
const compose = [...base, "-f", "docker-compose.perception-smoke.yml"];
const run = async (args, optional = false) => {
  try { return (await execFileAsync("docker", args, { cwd: root, env: composeEnvironment, maxBuffer: 4 * 1024 * 1024 })).stdout; }
  catch (error) { if (optional) return ""; throw new Error(String(error?.stderr ?? error).slice(-4000)); }
};
const waitFor = async (predicate) => {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) { if (await predicate()) return; await new Promise((resolve) => setTimeout(resolve, 250)); }
  throw new Error("Timed out waiting for the controlled IDSER-010 scenario.");
};
const url = process.env.DATABASE_URL ?? "postgresql://atlas:atlas_local_dev_only@localhost:15432/atlas_dev";
const atlasUrl = new URL(url); atlasUrl.username = "atlas_app"; atlasUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
const bridgeUrl = new URL(url); bridgeUrl.username = "agents_bridge"; bridgeUrl.password = process.env.AGENTS_BRIDGE_PASSWORD ?? "agents_bridge_local_dev_only";
const atlas = postgres(atlasUrl.toString(), { max: 2 });
const bridge = postgres(bridgeUrl.toString(), { max: 2 });
const admin = postgres(url, { max: 2 });
const origin = "http://localhost:13001";
const browserOrigin = "http://localhost:3001";
const semanticResultObservations = async () => {
  const response = await fetch(`${origin}/__test/semantic-result-observations`, { headers: { authorization: `Bearer ${process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32"}` } });
  assert.equal(response.status, 200, "the controlled Atlas result-boundary observer accepts only the Bridge credential");
  const body = await response.json();
  assert.ok(Array.isArray(body.observations), "the controlled Atlas result-boundary observer returns its received envelopes");
  return body.observations;
};
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
const mockControl = async (delayMs) => JSON.parse(await run([...compose, "exec", "-T", "mistral-mock", "node", "-e", `fetch('http://127.0.0.1:3100/__test-control',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({delayMs:${delayMs}})}).then(async r=>process.stdout.write(await r.text()))`]));
const mockMetrics = async () => JSON.parse(await run([...compose, "exec", "-T", "mistral-mock", "node", "-e", "fetch('http://127.0.0.1:3100/metrics').then(async r=>process.stdout.write(await r.text()))"]));
const jobRows = async (executionIds) => bridge.unsafe("SELECT id::text AS id, name, state, data->'execution'->>'executionId' AS execution_id, data->'execution'->'input'->>'contextCapability' AS context_capability FROM pgboss.job WHERE data->'execution'->>'executionId'=ANY($1::text[]) ORDER BY name, execution_id", [executionIds]);
const allJobStates = async () => bridge.unsafe("SELECT id::text AS id, name, state FROM pgboss.job ORDER BY id");
const queueStateSummary = (rows) => ({ rowCount: rows.length, sha256: createHash("sha256").update(JSON.stringify(rows)).digest("hex") });
const progressSnapshot = async (projectIds) => atlas.unsafe("SELECT p.stable_id, p.id AS project_id, w.id AS workspace_id, w.state AS workspace_state, b.id AS bundle_id, b.state AS bundle_state, b.completed_document_count, (SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.bundle_id=b.id) AS executions, (SELECT count(*)::int FROM atlas.semantic_extraction_result r WHERE r.bundle_id=b.id) AS extraction_results, (SELECT count(*)::int FROM atlas.semantic_reconciliation_result r WHERE r.bundle_id=b.id) AS reconciliation_results, (SELECT count(*)::int FROM atlas.semantic_candidate c WHERE c.bundle_id=b.id) AS candidates, (SELECT count(*)::int FROM atlas.semantic_evidence e JOIN atlas.semantic_candidate c ON c.id=e.semantic_candidate_id WHERE c.bundle_id=b.id) AS evidence, (SELECT count(*)::int FROM atlas.reconciliation_relationship r WHERE r.bundle_id=b.id) AS relationships FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id", [projectIds]);
const compositionScenarioEvidence = async (scenario, items, workerEvents) => {
  const projectIds = items.map((item) => item.projectId);
  const scopes = await atlas.unsafe("SELECT p.stable_id,p.id AS project_id,w.id AS workspace_id,b.id AS bundle_id,b.state AS bundle_state,master.state AS master_state,b.expected_document_count,b.completed_document_count,array_agg(DISTINCT d.id ORDER BY d.id) AS document_ids FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.workspace master ON master.project_id=p.id AND master.kind='master' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id JOIN atlas.document d ON d.project_id=p.id AND d.workspace_id=w.id WHERE p.stable_id=ANY($1::text[]) GROUP BY p.stable_id,p.id,w.id,b.id,master.state ORDER BY p.stable_id", [projectIds]);
  const executionRows = await atlas.unsafe("SELECT p.stable_id,e.id,e.stage,e.lifecycle,e.workspace_id,e.bundle_id,e.document_id FROM atlas.semantic_execution e JOIN atlas.project p ON p.id=e.project_id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id,e.stage,e.document_id", [projectIds]);
  const executionIds = executionRows.map((row) => row.id);
  const queueJobs = executionIds.length ? await bridge.unsafe("SELECT id::text AS id,name,state,data->'execution'->>'executionId' AS execution_id FROM pgboss.job WHERE data->'execution'->>'executionId'=ANY($1::text[]) ORDER BY execution_id,name", [executionIds]) : [];
  const dbRows = await atlas.unsafe("SELECT p.stable_id,(SELECT count(*)::int FROM atlas.semantic_extraction_result r WHERE r.project_id=p.id) AS extraction_results,(SELECT count(*)::int FROM atlas.semantic_reconciliation_result r WHERE r.project_id=p.id) AS reconciliation_results,(SELECT count(*)::int FROM atlas.semantic_candidate c WHERE c.project_id=p.id) AS candidates,(SELECT count(*)::int FROM atlas.semantic_evidence ev JOIN atlas.semantic_candidate c ON c.id=ev.semantic_candidate_id WHERE c.project_id=p.id) AS evidence,(SELECT count(*)::int FROM atlas.reconciliation_relationship r WHERE r.project_id=p.id) AS relationships FROM atlas.project p WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id", [projectIds]);
  const relationshipObservations = await atlas.unsafe("SELECT p.stable_id,r.relationship_type,r.requires_resolution,r.source_semantic_id,r.target_semantic_id FROM atlas.reconciliation_relationship r JOIN atlas.project p ON p.id=r.project_id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id,r.relationship_type,r.source_semantic_id", [projectIds]);
  const orderedMembers = await atlas.unsafe("SELECT p.stable_id,m.sequence,m.document_id,m.state,m.started_at,m.completed_at,(SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.bundle_id=m.bundle_id AND e.document_id=m.document_id AND e.lifecycle='completed') AS completed_stages FROM atlas.extraction_bundle_document m JOIN atlas.extraction_bundle b ON b.id=m.bundle_id JOIN atlas.project p ON p.id=b.project_id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id,m.sequence", [projectIds]);
  const ids = new Set(executionIds);
  return { scenario, safeScopedIds: scopes, dbObservations: dbRows, relationshipObservations, orderedMembers, executions: executionRows, queueJobs, providerEvents: workerEvents.filter((event) => ids.has(event.scope?.executionId)) };
};
const semanticRequest = async (path, body) => {
  const response = await fetch(`${origin}/internal/semantic/${path}`, { method: "POST", headers: { authorization: `Bearer ${process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL ?? "agents_bridge_service_local_dev_only_32"}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
};
const cookie = async (label) => {
  const email = `idser-010-${label}-${crypto.randomUUID().slice(0, 10)}@example.test`;
  const signUp = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin: browserOrigin }, body: JSON.stringify({ name: "IDSER 010", email, password: "a-tested-local-password" }) });
  assert.equal(signUp.status, 200);
  const signIn = await fetch(`${origin}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin: browserOrigin }, body: JSON.stringify({ email, password: "a-tested-local-password" }) });
  assert.equal(signIn.status, 200);
  return { email, value: signIn.headers.getSetCookie().map((item) => item.split(";", 1)[0]).join("; ") };
};
const create = async (label, texts, projectName = `IDSER 010 ${label}`) => {
  const auth = await cookie(label);
  const projectId = `idser-010-${label}-${crypto.randomUUID().slice(0, 10)}`;
  const form = new FormData(); form.set("projectId", projectId); form.set("projectName", projectName);
  for (const [index, text] of texts.entries()) form.append("prdFiles[]", new File([Buffer.from(`%PDF-1.7\n${text}`)], `${label}-${index + 1}.pdf`, { type: "application/pdf" }));
  const response = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie: auth.value, origin: browserOrigin }, body: form });
  assert.equal(response.status, 201, await response.text());
  return { projectId, email: auth.email, cookie: auth.value };
};
let projects = [];
try {
  await run([...compose, "down", "-v"], true);
  await run([...compose, "up", "-d", "postgres", "--wait"]);
  await run([...compose, "exec", "-T", "postgres", "psql", "-U", "atlas", "-d", "atlas_dev", "-c", "CREATE ROLE agents_bridge LOGIN PASSWORD 'agents_bridge_local_dev_only'; CREATE ROLE atlas_app LOGIN PASSWORD 'atlas_app_local_dev_only'; GRANT ALL ON DATABASE atlas_dev TO agents_bridge, atlas_app"]);
  await run([...compose, "run", "--rm", "--no-deps", "--workdir", "/workspace/apps/agents-bridge", "agents-bridge-worker", "node", "-e", "import('pg-boss').then(async ({ PgBoss }) => { const boss = new PgBoss({ connectionString: process.env.AGENTS_BRIDGE_DATABASE_URL, schema: 'pgboss', migrate: true, createSchema: true }); await boss.start(); await boss.stop(); })"]);
  await run([...compose, "exec", "-T", "postgres", "psql", "-U", "atlas", "-d", "atlas_dev", "-c", "GRANT USAGE ON SCHEMA pgboss TO atlas_app; GRANT SELECT ON ALL TABLES IN SCHEMA pgboss TO atlas_app"]);
  await run([...compose, "up", "-d", "--build", "--wait"]);
  const composeHealth = await run([...compose, "ps", "--format", "json"]);
  process.stdout.write(`IDSER-010 Compose service health: ${composeHealth.trim()}\n`);
  if (stagedRegression) {
    // IDSER-012 supersedes the old immediate-D1 Compose expectation.  Keep
    // the IDSER-010-04/05 identity and durable-boundary observations, but
    // create clean projects only through the current production endpoint and
    // prove they stop at the staged perception lifecycle.
    const [alpha, beta] = await Promise.all([
      create("idser-012-alpha", ["Staged alpha payload"], "IDSER-012 concurrent staged project"),
      create("idser-012-beta", ["Staged beta payload"], "IDSER-012 concurrent staged project"),
    ]);
    projects.push(alpha, beta);
    await waitFor(async () => (await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.extraction_bundle b JOIN atlas.project p ON p.id=b.project_id WHERE p.stable_id=ANY($1::text[]) AND b.perception_admission_policy='staged-fair-local-v1'", [[alpha.projectId, beta.projectId]]))[0].count === 2);
    const staged = await atlas.unsafe("SELECT p.stable_id,p.id AS project_id,b.id AS bundle_id,d.id AS document_id,m.state AS member_state,(SELECT count(*)::int FROM atlas.document_perception_execution e WHERE e.artifact_id=d.id) AS perception_executions,(SELECT count(*)::int FROM atlas.document_perception_source_grant g JOIN atlas.document_perception_execution e ON e.id=g.execution_id WHERE e.artifact_id=d.id) AS grants,(SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.project_id=p.id) AS semantic_executions,(SELECT count(*)::int FROM pgboss.job j WHERE j.name='atlas-document-perception-v1' AND j.data->>'idempotencyKey' LIKE ('staged-perception:%:' || d.id || ':v1')) AS perception_jobs,(SELECT count(*)::int FROM pgboss.job j WHERE j.data->'execution'->>'executionId' IN (SELECT e.id FROM atlas.semantic_execution e WHERE e.project_id=p.id)) AS semantic_jobs FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id JOIN atlas.document d ON d.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id AND m.document_id=d.id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
    assert.equal(staged.length, 2, "two concurrent production creates persist separate staged bundles");
    assert.equal(new Set(staged.flatMap((row) => [row.project_id, row.bundle_id, row.document_id])).size, 6, "concurrent staged projects retain distinct project, bundle, and document identities");
    assert.ok(staged.every((row) => ["pending", "perception_queued"].includes(row.member_state)), "each clean project remains in the staged pending/perception lifecycle");
    assert.ok(staged.every((row) => Number(row.perception_executions) === 1 && Number(row.grants) === 1 && Number(row.perception_jobs) === 1), "each admitted staged document has one isolated perception execution, grant, and durable job");
    assert.ok(staged.every((row) => Number(row.semantic_executions) === 0 && Number(row.semantic_jobs) === 0), "the staged cutover does not enter the obsolete IDSER-010 semantic/replay lifecycle");
    process.stdout.write(`IDSER-012 staged IDSER-010-04/05 regression evidence: ${JSON.stringify({ projects: staged.map((row) => ({ projectId: row.stable_id, projectRowId: row.project_id, bundleId: row.bundle_id, documentId: row.document_id, memberState: row.member_state, perceptionExecutions: Number(row.perception_executions), grants: Number(row.grants), perceptionJobs: Number(row.perception_jobs), semanticExecutions: Number(row.semantic_executions), semanticJobs: Number(row.semantic_jobs) })) })}\n`);
  } else {
  const compositionScenarios = [];
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
    compositionScenarios.push({ scenario: label === "normal" ? "A" : "B", items: [item] });
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
    compositionScenarios.push({ scenario: label === "scenario-c-supports" ? "C-supports" : label === "scenario-c-duplicates" ? "C-duplicates" : label === "scenario-d" ? "D" : "E", items: [item] });
  }
  const scenarioEvidenceEvents = await mockMetrics();
  for (const scenario of compositionScenarios) process.stdout.write(`IDSER-010 Scenario ${scenario.scenario} evidence: ${JSON.stringify(await compositionScenarioEvidence(scenario.scenario, scenario.items, scenarioEvidenceEvents.structuredEvents))}\n`);
  // Scenario G follows the normal production worker path but returns a
  // controlled invalid evidence locator. The trusted boundary must contain it.
  const invalid = await create("scenario-g-invalid", ["Invalid semantic output"]); projects.push(invalid);
  await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1)", [invalid.projectId]))[0]?.state === "needs_attention");
  const [invalidOutcome] = await atlas.unsafe("SELECT b.state AS bundle_state,b.completed_document_count,m.state AS member_state,(SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.bundle_id=b.id AND e.lifecycle='failed') AS failed_executions,(SELECT count(*)::int FROM atlas.semantic_extraction_result r WHERE r.bundle_id=b.id) AS extraction_results,(SELECT count(*)::int FROM atlas.semantic_candidate c WHERE c.bundle_id=b.id) AS candidates,(SELECT count(*)::int FROM atlas.semantic_execution e WHERE e.bundle_id=b.id AND e.stage='reconciliation') AS successors FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id WHERE p.stable_id=$1", [invalid.projectId]);
  const invalidSummary = { bundle: invalidOutcome.bundle_state, completed: Number(invalidOutcome.completed_document_count), member: invalidOutcome.member_state, failedExecutions: Number(invalidOutcome.failed_executions), extractionResults: Number(invalidOutcome.extraction_results), candidates: Number(invalidOutcome.candidates), successors: Number(invalidOutcome.successors) };
  assert.deepEqual(invalidSummary, { bundle: "needs_attention", completed: 0, member: "needs_attention", failedExecutions: 1, extractionResults: 0, candidates: 0, successors: 0 }, "Scenario G rejects invalid semantic evidence without trusted progress, materialization, or successor work");
  process.stdout.write(`IDSER-010 Scenario G evidence: ${JSON.stringify({ projectId: invalid.projectId, outcome: invalidSummary })}\n`);
  // Scenario F: create two identically named projects concurrently.  The
  // controlled provider emits distinct candidate meanings from their source
  // text, making a cross-context or cross-result delivery observable.
  await mockControl(1200);
  const sameDisplayName = "Scenario F duplicate display name";
  const [alpha, beta] = await Promise.all([
    create("scenario-f-alpha", ["Isolation alpha payload"], sameDisplayName),
    create("scenario-f-beta", ["Isolation beta payload"], sameDisplayName),
  ]);
  projects.push(alpha, beta);
  const initialScopes = await atlas.unsafe("SELECT p.stable_id,p.id AS project_id,p.name,p.created_by_user_id,w.id AS workspace_id,b.id AS bundle_id,d.id AS document_id FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id JOIN atlas.document d ON d.project_id=p.id AND d.workspace_id=w.id WHERE p.stable_id=ANY($1::text[]) ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
  assert.equal(initialScopes.length, 2);
  assert.deepEqual(initialScopes.map((row) => row.name), [sameDisplayName, sameDisplayName]);
  const safeIds = initialScopes.map((row) => ({ projectId: row.stable_id, projectRowId: row.project_id, workspaceId: row.workspace_id, bundleId: row.bundle_id, documentId: row.document_id }));
  for (const item of [alpha, beta]) {
    const owner = initialScopes.find((row) => row.stable_id === item.projectId).created_by_user_id;
    const visible = await readOwnedProjectIds(owner);
    assert.ok(visible.includes(item.projectId), "an owner can read its own same-display-name project");
    const foreign = item === alpha ? beta.projectId : alpha.projectId;
    assert.ok(!visible.includes(foreign), "an owner cannot cross-read the other same-display-name project");
  }
  let extractionExecutions = [];
  await waitFor(async () => {
    extractionExecutions = await atlas.unsafe("SELECT e.id,e.stage,e.lifecycle,p.stable_id FROM atlas.semantic_execution e JOIN atlas.project p ON p.id=e.project_id WHERE p.stable_id=ANY($1::text[]) AND e.stage='extraction' ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
    if (extractionExecutions.length !== 2) return false;
    const active = await jobRows(extractionExecutions.map((row) => row.id));
    return active.length === 2 && active.every((row) => row.state === "active" && row.context_capability);
  });
  const extractionJobs = await jobRows(extractionExecutions.map((row) => row.id));
  assert.equal(new Set(extractionJobs.map((row) => row.id)).size, 2);
  assert.ok(extractionJobs.every((row) => row.name === extractionJobs[0].name), "both production jobs use their matching configured queue");
  const alphaExtraction = extractionExecutions.find((row) => row.stable_id === alpha.projectId);
  const betaExtraction = extractionExecutions.find((row) => row.stable_id === beta.projectId);
  const beforeContextDenial = await progressSnapshot([alpha.projectId, beta.projectId]);
  const unrelatedJobsBefore = (await allJobStates()).filter((row) => !extractionJobs.some((job) => job.id === row.id));
  const deniedContext = await semanticRequest("context", { version: "v1", executionId: betaExtraction.id, skill: { id: "atlas.semantic.extract", version: "v1" }, contextCapability: extractionJobs.find((row) => row.execution_id === alphaExtraction.id).context_capability });
  assert.ok(deniedContext.status === 400 || deniedContext.status === 409, "a capability from the other owner cannot redeem semantic context");
  const afterContextDenial = await progressSnapshot([alpha.projectId, beta.projectId]);
  assert.deepEqual(afterContextDenial, beforeContextDenial, "cross-owner context denial leaves target and control progress unchanged");
  const unrelatedJobsAfterContextDenial = (await allJobStates()).filter((row) => !extractionJobs.some((job) => job.id === row.id));
  assert.deepEqual(unrelatedJobsAfterContextDenial, unrelatedJobsBefore, "cross-owner context denial leaves unrelated queue state unchanged");

  const alphaBundle = initialScopes.find((row) => row.stable_id === alpha.projectId);
  const betaBundle = initialScopes.find((row) => row.stable_id === beta.projectId);
  const mismatchedScope = await semanticRequest("result", {
    version: "v1",
    scope: { projectId: betaBundle.project_id, workspaceId: betaBundle.workspace_id, bundleId: betaBundle.bundle_id, documentId: betaBundle.document_id, executionId: alphaExtraction.id, contractVersion: "v1" },
    skill: { id: "atlas.semantic.extract", version: "v1" },
    provider: { provider: "mistral", model: "compose-smoke-structured", endpoint: "/v1/chat/completions", latencyMilliseconds: 1, attempt: 1 },
    result: { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] },
  });
  assert.equal(mismatchedScope.status, 409, "a foreign owner's scope cannot mutate another execution's progress");
  const afterCrossOwnerProgressMutation = await progressSnapshot([alpha.projectId, beta.projectId]);
  assert.deepEqual(afterCrossOwnerProgressMutation, beforeContextDenial, "denied cross-owner result delivery leaves both target and control observations unchanged");

  let reconciliationExecutions = [];
  await waitFor(async () => {
    reconciliationExecutions = await atlas.unsafe("SELECT e.id,e.stage,e.lifecycle,p.stable_id FROM atlas.semantic_execution e JOIN atlas.project p ON p.id=e.project_id WHERE p.stable_id=ANY($1::text[]) AND e.stage='reconciliation' ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
    if (reconciliationExecutions.length !== 2) return false;
    const active = await jobRows(reconciliationExecutions.map((row) => row.id));
    return active.length === 2 && active.every((row) => row.state === "active");
  });
  const reconciliationJobs = await jobRows(reconciliationExecutions.map((row) => row.id));
  assert.equal(new Set(reconciliationJobs.map((row) => row.id)).size, 2);
  assert.ok(reconciliationJobs.every((row) => row.name === extractionJobs[0].name));
  const alphaReconciliation = reconciliationExecutions.find((row) => row.stable_id === alpha.projectId);
  const betaForeignCandidate = await atlas.unsafe("SELECT id FROM atlas.semantic_candidate WHERE bundle_id=$1 LIMIT 1", [betaBundle.bundle_id]);
  const [alphaContext] = await atlas.unsafe("SELECT context_json FROM atlas.semantic_execution_context WHERE execution_id=$1", [alphaReconciliation.id]);
  const reconciledContext = typeof alphaContext.context_json === "string" ? JSON.parse(alphaContext.context_json) : alphaContext.context_json;
  const beforeForeignReferenceDenial = await progressSnapshot([alpha.projectId, beta.projectId]);
  const unrelatedBeforeForeignReference = (await allJobStates()).filter((row) => ![...extractionJobs, ...reconciliationJobs].some((job) => job.id === row.id));
  const deniedForeignReference = await semanticRequest("result", {
    version: "v1",
    scope: { projectId: alphaBundle.project_id, workspaceId: alphaBundle.workspace_id, bundleId: alphaBundle.bundle_id, documentId: alphaBundle.document_id, executionId: alphaReconciliation.id, contractVersion: "v1" },
    skill: { id: "atlas.semantic.reconcile", version: "v1" },
    provider: { provider: "mistral", model: "compose-smoke-structured", endpoint: "/v1/chat/completions", latencyMilliseconds: 1, attempt: 1 },
    result: { version: "v1", relationships: reconciledContext.currentCandidates.map((candidate) => ({ source_candidate_id: candidate.id, target_candidate_id: betaForeignCandidate[0].id, relationship_type: "supports", payload: { controlled: true }, requires_resolution: false, evidence_refs: candidate.evidence_refs })), questions: [] },
  });
  assert.equal(deniedForeignReference.status, 422, "Atlas rejects a reconciliation result that references the other owner's candidate");
  const afterForeignReferenceDenial = await progressSnapshot([alpha.projectId, beta.projectId]);
  assert.deepEqual(afterForeignReferenceDenial, beforeForeignReferenceDenial, "foreign candidate rejection leaves target and control result/progress observations unchanged");
  const unrelatedAfterForeignReference = (await allJobStates()).filter((row) => ![...extractionJobs, ...reconciliationJobs].some((job) => job.id === row.id));
  assert.deepEqual(unrelatedAfterForeignReference, unrelatedBeforeForeignReference, "foreign candidate rejection leaves unrelated queue state unchanged");

  await Promise.all([alpha, beta].map((item) => waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1)", [item.projectId]))[0]?.state === "ready_for_review")));
  const isolated = await atlas.unsafe("SELECT p.stable_id,p.id AS project_id,p.name,p.created_by_user_id,w.id AS workspace_id,b.id AS bundle_id,d.id AS document_id,array_agg(e.id ORDER BY e.stage) AS execution_ids,b.expected_document_count,b.completed_document_count,array_agg(DISTINCT c.normalized_meaning) AS meanings,count(DISTINCT x.id)::int AS extraction_results,count(DISTINCT r.id)::int AS reconciliation_results,count(DISTINCT c.id)::int AS candidates,count(DISTINCT ev.id)::int AS evidence,count(DISTINCT rr.id)::int AS relationships FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id JOIN atlas.document d ON d.project_id=p.id AND d.workspace_id=w.id JOIN atlas.semantic_execution e ON e.project_id=p.id AND e.workspace_id=w.id AND e.bundle_id=b.id AND e.document_id=d.id JOIN atlas.semantic_candidate c ON c.project_id=p.id AND c.workspace_id=w.id AND c.bundle_id=b.id AND c.document_id=d.id JOIN atlas.semantic_extraction_result x ON x.project_id=p.id AND x.workspace_id=w.id AND x.bundle_id=b.id AND x.document_id=d.id JOIN atlas.semantic_reconciliation_result r ON r.project_id=p.id AND r.workspace_id=w.id AND r.bundle_id=b.id AND r.current_document_id=d.id JOIN atlas.semantic_evidence ev ON ev.document_id=d.id AND ev.semantic_candidate_id=c.id JOIN atlas.reconciliation_relationship rr ON rr.project_id=p.id AND rr.workspace_id=w.id AND rr.bundle_id=b.id WHERE p.stable_id=ANY($1::text[]) GROUP BY p.stable_id,p.id,p.name,p.created_by_user_id,w.id,b.id,d.id,b.expected_document_count,b.completed_document_count ORDER BY p.stable_id", [[alpha.projectId, beta.projectId]]);
  assert.equal(isolated.length, 2, "both same-display-name scopes finish");
  assert.deepEqual(isolated.map((row) => row.name), [sameDisplayName, sameDisplayName]);
  for (const row of isolated) {
    assert.deepEqual({ expected: Number(row.expected_document_count), completed: Number(row.completed_document_count), extraction: Number(row.extraction_results), reconciliation: Number(row.reconciliation_results), candidates: Number(row.candidates), evidence: Number(row.evidence), relationships: Number(row.relationships) }, { expected: 1, completed: 1, extraction: 1, reconciliation: 1, candidates: 1, evidence: 1, relationships: 1 }, "each bundle has exactly its own completed N/N materialization");
    assert.equal(new Set([row.project_id,row.workspace_id,row.bundle_id,row.document_id,...row.execution_ids]).size, 6, "every persisted scenario-F identity is unique");
    assert.deepEqual(row.meanings, [row.stable_id === alpha.projectId ? "Scenario F alpha assertion." : "Scenario F beta assertion."], "the controlled provider result stays bound to its exact execution scope");
  }
  assert.notDeepEqual(isolated[0].execution_ids, isolated[1].execution_ids, "no execution identity is shared across same-display-name bundles");
  for (const row of isolated) safeIds.find((scope) => scope.projectId === row.stable_id).executionIds = row.execution_ids;
  const executionIds = isolated.flatMap((row) => row.execution_ids);
  const semanticExecutions = [...extractionExecutions, ...reconciliationExecutions];
  await waitFor(async () => (await atlas.unsafe("SELECT count(*)::int AS count FROM atlas.semantic_execution WHERE id=ANY($1::text[]) AND lifecycle='completed'", [executionIds]))[0].count === executionIds.length);
  const scenarioJobs = [...extractionJobs, ...reconciliationJobs];
  const workerMetrics = await mockMetrics();
  const scenarioEvents = workerMetrics.structuredEvents.filter((event) => executionIds.includes(event.scope?.executionId));
  assert.equal(scenarioEvents.length, 4, "the production worker produced one logged provider execution for each extraction and reconciliation job");
  for (const item of [alpha, beta]) for (const stage of ["atlas.semantic.extract", "atlas.semantic.reconcile"]) assert.equal(scenarioEvents.filter((event) => event.scope?.projectId === isolated.find((row) => row.stable_id === item.projectId).project_id && event.stage === stage).length, 1, "each job is delivered once by its matching scope");
  for (const stage of ["atlas.semantic.extract", "atlas.semantic.reconcile"]) {
    const [left, right] = scenarioEvents.filter((event) => event.stage === stage);
    assert.ok(Date.parse(left.startedAt) < Date.parse(right.finishedAt) && Date.parse(right.startedAt) < Date.parse(left.finishedAt), `${stage} worker execution overlaps for both scopes`);
  }
  const [remainingJobs] = await bridge.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE data->'execution'->>'executionId' = ANY($1::text[])", [executionIds]);
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM pgboss.job WHERE data->'execution'->>'executionId'=ANY($1::text[]) AND state='completed'", [executionIds]))[0]?.count === executionIds.length);
  const finalJobs = await bridge.unsafe("SELECT id::text AS id,name,state,data->'execution'->>'executionId' AS execution_id FROM pgboss.job WHERE data->'execution'->>'executionId'=ANY($1::text[]) ORDER BY execution_id", [executionIds]);
  assert.equal(finalJobs.length, 4);
  assert.ok(finalJobs.every((job) => job.state === "completed"), "each matching pg-boss job reaches its terminal completed state");
  assert.equal(Number(remainingJobs.count), 4, "the four completed queue records remain auditable in pg-boss");
  const [deliveryOutbox] = await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE execution_id=ANY($1::text[])", [executionIds]);
  assert.equal(Number(deliveryOutbox.count), 0, "the production worker cleans up all four acknowledged result deliveries");
  await mockControl(0);
  const metrics = JSON.parse(await run([...compose, "exec", "-T", "mistral-mock", "node", "-e", "fetch('http://127.0.0.1:3100/metrics').then(async response => process.stdout.write(await response.text()))"]));
  assert.ok(metrics.ocrCalls >= 13, "the controlled Mistral endpoint received every single- and multi-document OCR call");
  assert.ok(metrics.structuredCalls >= 26, "the controlled Mistral endpoint received both semantic stages for every controlled document");
  const [direct] = await bridge.unsafe("SELECT has_schema_privilege('agents_bridge','atlas','USAGE') AS schema_usage");
  assert.equal(direct.schema_usage, false, "Bridge has no direct Atlas schema privilege");
  const finalScopes = await progressSnapshot([alpha.projectId, beta.projectId]);
  const finalExecutionStates = await atlas.unsafe("SELECT id,stage,lifecycle FROM atlas.semantic_execution WHERE id=ANY($1::text[]) ORDER BY id", [executionIds]);
  const finalByJobId = new Map(finalJobs.map((job) => [job.id, job]));
  const observedQueueJobs = scenarioJobs.map((job) => ({ id: job.id, queueName: job.name, claimedStateAtObservation: job.state, finalState: finalByJobId.get(job.id)?.state, executionId: job.execution_id }));
  const foreignReference = { candidateId: betaForeignCandidate[0].id, candidateBundleId: betaBundle.bundle_id, attemptedSourceExecutionId: alphaReconciliation.id };
  const evidence = { scenario: "F", composeCommand: "node apps/agents-bridge/tests/idser-010-compose.mjs", ownersAndIds: safeIds, queueJobs: observedQueueJobs, workerEvents: scenarioEvents, deniedContext: { status: deniedContext.status, targetControlBefore: beforeContextDenial, targetControlAfter: afterContextDenial, unrelatedQueueStateBefore: queueStateSummary(unrelatedJobsBefore), unrelatedQueueStateAfter: queueStateSummary(unrelatedJobsAfterContextDenial) }, deniedCrossOwnerProgressMutation: { status: mismatchedScope.status, targetControlBefore: beforeContextDenial, targetControlAfter: afterCrossOwnerProgressMutation }, deniedForeignCandidateReference: { status: deniedForeignReference.status, foreignReference, targetControlBefore: beforeForeignReferenceDenial, targetControlAfter: afterForeignReferenceDenial, unrelatedQueueStateBefore: queueStateSummary(unrelatedBeforeForeignReference), unrelatedQueueStateAfter: queueStateSummary(unrelatedAfterForeignReference) }, completedStageCounts: finalExecutionStates, ocrCalls: metrics.ocrCalls, structuredCalls: metrics.structuredCalls, acknowledgedOutboxRowsRemaining: Number(deliveryOutbox.count), finalScopes };
  process.stdout.write(`IDSER-010 Scenario F evidence: ${JSON.stringify(evidence)}\n`);
  // Scenario H: stage an extraction result while Atlas is deliberately
  // unavailable, stop the real Compose worker, then recover through the
  // durable pg-boss/outbox state. A one-shot completion trigger makes the
  // first post-acceptance acknowledgement fail, forcing identical replay.
  const replay = await create("scenario-h-replay", ["Replay restart payload"]); projects.push(replay);
  let replayScope;
  await waitFor(async () => {
    [replayScope] = await atlas.unsafe("SELECT p.id AS project_id,w.id AS workspace_id,b.id AS bundle_id,d.id AS document_id,e.id AS execution_id FROM atlas.project p JOIN atlas.workspace w ON w.project_id=p.id AND w.kind='initial_draft' JOIN atlas.extraction_bundle b ON b.project_id=p.id AND b.workspace_id=w.id JOIN atlas.document d ON d.project_id=p.id AND d.workspace_id=w.id JOIN atlas.semantic_execution e ON e.bundle_id=b.id AND e.document_id=d.id AND e.stage='extraction' WHERE p.stable_id=$1", [replay.projectId]);
    return Boolean(replayScope);
  });
  assert.ok(replayScope, "Scenario H has its extraction execution");
  let replayKey;
  await waitFor(async () => {
    replayKey = (await bridge.unsafe("SELECT data->>'idempotencyKey' AS key FROM pgboss.job WHERE data->'execution'->>'executionId'=$1", [replayScope.execution_id]))[0]?.key;
    return Boolean(replayKey);
  });
  assert.ok(replayKey, "Scenario H exposes its durable Bridge idempotency key");
  const faultName = `idser_h_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  await bridge.unsafe(`CREATE SEQUENCE bridge.${faultName}_sequence START 1`);
  await bridge.unsafe(`CREATE FUNCTION bridge.${faultName}_completion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.idempotency_key = '${replayKey}' AND NEW.status = 'completed' AND nextval('bridge.${faultName}_sequence') = 1 THEN RAISE EXCEPTION 'controlled Scenario H acknowledgement loss'; END IF; RETURN NEW; END $$`);
  await bridge.unsafe(`CREATE TRIGGER ${faultName}_trigger BEFORE UPDATE ON bridge.background_effects FOR EACH ROW EXECUTE FUNCTION bridge.${faultName}_completion()`);
  const beforeReplayMetrics = await mockMetrics();
  await mockControl(3_000);
  await waitFor(async () => (await mockMetrics()).structuredEvents.length > beforeReplayMetrics.structuredEvents.length);
  await run([...compose, "stop", "atlas"]);
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [replayKey]))[0]?.count === 1);
  const [staged] = await bridge.unsafe("SELECT execution_id,validated_envelope,provenance,lease_owner,lease_generation FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [replayKey]);
  const [stagedEffect] = await bridge.unsafe("SELECT status,lease_owner,lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [replayKey]);
  assert.equal(staged.execution_id, replayScope.execution_id, "only the scoped execution owns the staged envelope");
  assert.ok(staged.lease_owner && Number(staged.lease_generation) >= 1, "staging records a durable lease fence");
  assert.ok(["pending", "running"].includes(stagedEffect.status), "the stopped delivery retains a staged replay claimant");
  const [conflictingStage] = await bridge.unsafe("INSERT INTO bridge.semantic_result_delivery (idempotency_key,execution_id,stage,validated_envelope,provenance,completion_fingerprint,lease_owner,lease_generation) SELECT idempotency_key,$2,stage,validated_envelope,provenance,'conflicting-fingerprint','losing-claimant',0 FROM bridge.semantic_result_delivery WHERE idempotency_key=$1 ON CONFLICT (idempotency_key) DO NOTHING RETURNING idempotency_key", [replayKey, `${replayScope.execution_id}-conflict`]);
  assert.equal(conflictingStage, undefined, "a conflicting result/fingerprint cannot replace the staged winner");
  const [afterConflictStage] = await bridge.unsafe("SELECT validated_envelope,execution_id,lease_generation FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [replayKey]);
  assert.deepEqual(afterConflictStage, { validated_envelope: staged.validated_envelope, execution_id: staged.execution_id, lease_generation: staged.lease_generation }, "the losing fingerprint mutation leaves the durable winner unchanged");
  await bridge.unsafe("UPDATE bridge.background_effects SET lease_owner='superseding-claimant', lease_generation=lease_generation+1, lease_expires_at=now()-interval '1 second' WHERE idempotency_key=$1", [replayKey]);
  const [staleCompletion] = await bridge.unsafe("UPDATE bridge.background_effects SET status='completed' WHERE idempotency_key=$1 AND lease_owner=$2 AND lease_generation=$3 AND status='running' RETURNING idempotency_key", [replayKey, stagedEffect.lease_owner, stagedEffect.lease_generation]);
  assert.equal(staleCompletion, undefined, "the stale lease claimant cannot complete the superseded effect");
  const [afterStaleCompletion] = await bridge.unsafe("SELECT status,lease_owner,lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [replayKey]);
  assert.deepEqual(afterStaleCompletion, { status: stagedEffect.status, lease_owner: "superseding-claimant", lease_generation: Number(stagedEffect.lease_generation) + 1 }, "the stale completion attempt leaves the superseding control row unchanged");
  await run([...compose, "stop", "agents-bridge-worker"]);
  const [survivingStage] = await bridge.unsafe("SELECT validated_envelope,lease_generation FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [replayKey]);
  assert.deepEqual(survivingStage.validated_envelope, staged.validated_envelope, "the exact staged envelope survives worker interruption");
  await run([...compose, "start", "atlas"]);
  await waitFor(async () => {
    try { return (await fetch(origin)).ok; }
    catch { return false; }
  });
  await run([...compose, "start", "agents-bridge-worker"]);
  await bridge.unsafe("UPDATE pgboss.job SET state='created', started_on=NULL, completed_on=NULL, start_after=now() WHERE data->>'idempotencyKey'=$1", [replayKey]);
  await waitFor(async () => (await bridge.unsafe("SELECT status FROM bridge.background_effects WHERE idempotency_key=$1", [replayKey]))[0]?.status === "completed");
  let resumedAtlasBoundEnvelopes;
  await waitFor(async () => {
    resumedAtlasBoundEnvelopes = await semanticResultObservations();
    return resumedAtlasBoundEnvelopes.length > 0;
  });
  for (const envelope of resumedAtlasBoundEnvelopes) assert.deepEqual(envelope, staged.validated_envelope, "every actual post-restart Atlas-bound envelope equals the durable pre-interruption staged envelope");
  const resumedAtlasBoundEnvelope = resumedAtlasBoundEnvelopes[0];
  assert.deepEqual(resumedAtlasBoundEnvelope, staged.validated_envelope, "the real resumed worker delivers the exact durable staged envelope at the trusted Atlas result boundary");
  await waitFor(async () => (await bridge.unsafe("SELECT count(*)::int AS count FROM bridge.semantic_result_delivery WHERE idempotency_key=$1", [replayKey]))[0]?.count === 0);
  await waitFor(async () => (await atlas.unsafe("SELECT state FROM atlas.extraction_bundle WHERE id=$1", [replayScope.bundle_id]))[0]?.state === "ready_for_review");
  await mockControl(0);
  const afterReplayMetrics = await mockMetrics();
  assert.equal(afterReplayMetrics.structuredEvents.filter((event) => event.scope?.executionId === replayScope.execution_id).length, 1, "restart and acknowledgement-loss replay do not make a second extraction provider call");
  const [replayEffects] = await atlas.unsafe("SELECT e.lifecycle,b.expected_document_count,b.completed_document_count,(SELECT count(*)::int FROM atlas.semantic_extraction_result WHERE execution_id=e.id) AS extraction_results,(SELECT count(*)::int FROM atlas.semantic_candidate WHERE bundle_id=e.bundle_id AND document_id=e.document_id) AS candidates,(SELECT count(*)::int FROM atlas.semantic_evidence evidence JOIN atlas.semantic_candidate candidate ON candidate.id=evidence.semantic_candidate_id WHERE candidate.bundle_id=e.bundle_id AND candidate.document_id=e.document_id) AS evidence,(SELECT count(*)::int FROM atlas.reconciliation_relationship WHERE bundle_id=e.bundle_id) AS relationships,(SELECT count(*)::int FROM pgboss.job WHERE data->'execution'->>'executionId'=e.id AND state='completed') AS completed_jobs FROM atlas.semantic_execution e JOIN atlas.extraction_bundle b ON b.id=e.bundle_id WHERE e.id=$1", [replayScope.execution_id]);
  assert.deepEqual({ lifecycle: replayEffects.lifecycle, expected: Number(replayEffects.expected_document_count), completed: Number(replayEffects.completed_document_count), extraction: Number(replayEffects.extraction_results), candidates: Number(replayEffects.candidates), evidence: Number(replayEffects.evidence), relationships: Number(replayEffects.relationships), completedJobs: Number(replayEffects.completed_jobs) }, { lifecycle: "completed", expected: 1, completed: 1, extraction: 1, candidates: 1, evidence: 1, relationships: 1, completedJobs: 1 }, "identical replay has singular Atlas rows, progress, successor work, and final queue record");
  const [completedEffect] = await bridge.unsafe("SELECT lease_generation FROM bridge.background_effects WHERE idempotency_key=$1", [replayKey]);
  assert.ok(Number(completedEffect.lease_generation) > Number(staged.lease_generation), "the resumed claimant completes under a later lease generation");
  const stagedEnvelopeSha256 = createHash("sha256").update(canonicalJson(staged.validated_envelope)).digest("hex");
  const resumedAtlasBoundEnvelopeSha256 = createHash("sha256").update(canonicalJson(resumedAtlasBoundEnvelope)).digest("hex");
  assert.equal(resumedAtlasBoundEnvelopeSha256, stagedEnvelopeSha256, "the observed resumed Atlas-bound envelope fingerprint equals the durable staged fingerprint");
  process.stdout.write(`IDSER-010 Scenario H evidence: ${JSON.stringify({ executionId: replayScope.execution_id, idempotencyKey: replayKey, stagedLeaseGeneration: staged.lease_generation, resumedLeaseGeneration: completedEffect.lease_generation, providerCallsBefore: beforeReplayMetrics.structuredCalls, providerCallsAfter: afterReplayMetrics.structuredCalls, stagedEnvelopeSha256, resumedAtlasBoundEnvelopeSha256, resumedAtlasBoundEnvelopeCount: resumedAtlasBoundEnvelopes.length, resumedAtlasBoundEnvelopeEqualsStaged: true, singularEffects: replayEffects })}\n`);
  const [negativeAuthority] = await atlas.unsafe("SELECT (count(*) FILTER (WHERE master.state <> 'empty'))::int AS nonempty_masters FROM atlas.project p JOIN atlas.workspace master ON master.project_id=p.id AND master.kind='master' WHERE p.stable_id=ANY($1::text[])", [projects.map((item) => item.projectId)]);
  assert.equal(Number(negativeAuthority.nonempty_masters), 0, "every controlled outcome retains an empty Master workspace");
  const prohibitedState = await atlas.unsafe("SELECT unnest($1::text[]) AS state_name, to_regclass('atlas.' || unnest($1::text[]))::text AS relation", [["resolved_knowledge", "approval", "publication", "review_decision", "projection", "ces_assessment", "conversation", "addendum", "workspace_revision", "workspace_head"]]);
  assert.ok(prohibitedState.every((row) => row.relation === null), "the deterministic composition introduces no downstream truth, review, CES, conversation, Addendum, revision, or HEAD state");
  process.stdout.write(`IDSER-010 negative-authority evidence: ${JSON.stringify({ controlledProjects: projects.map((item) => item.projectId), nonemptyMasters: Number(negativeAuthority.nonempty_masters), prohibitedRelations: prohibitedState })}\n`);
  await bridge.unsafe(`DROP TRIGGER IF EXISTS ${faultName}_trigger ON bridge.background_effects`);
  await bridge.unsafe(`DROP FUNCTION IF EXISTS bridge.${faultName}_completion()`);
  await bridge.unsafe(`DROP SEQUENCE IF EXISTS bridge.${faultName}_sequence`);
  process.stdout.write("IDSER-010 controlled Compose scenarios A/B/C/D/E/F/H passed.\n");
  }
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
  await Promise.all([atlas.end(), bridge.end(), admin.end()]);
  await run([...compose, "down", "-v"], true);
}
