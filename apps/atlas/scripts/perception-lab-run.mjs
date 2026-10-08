import { createHash, randomBytes, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const [experimentId, sourcePath] = process.argv.slice(2);
if (experimentId !== "safara-baseline-001" || !sourcePath) throw new Error("Usage: perception-lab-run.mjs safara-baseline-001 <source-pdf-path>");

const origin = process.env.ATLAS_LAB_ORIGIN ?? "http://127.0.0.1:13011";
const atlasUrl = process.env.ATLAS_LAB_URL ?? origin;
const databaseUrl = process.env.ATLAS_DATABASE_URL;
if (!databaseUrl) throw new Error("ATLAS_DATABASE_URL is required.");
const evidenceDirectory = process.env.ATLAS_LAB_EVIDENCE_DIRECTORY ?? "/lab-evidence";
const bytes = await readFile(sourcePath);
const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
const startedAt = new Date();
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const userEmail = `atlas-lab-${randomUUID()}@local.invalid`;
const userPassword = randomBytes(24).toString("hex");
const stableProjectId = `safara-baseline-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const sql = postgres(databaseUrl, { max: 2 });

try {
  const signUp = await fetch(`${atlasUrl}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "Atlas Perception Lab", email: userEmail, password: userPassword }) });
  if (!signUp.ok) throw new Error(`Lab sign-up failed: ${signUp.status} ${await signUp.text()}`);
  const signIn = await fetch(`${atlasUrl}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email: userEmail, password: userPassword }) });
  if (!signIn.ok) throw new Error(`Lab sign-in failed: ${signIn.status} ${await signIn.text()}`);
  const cookies = typeof signIn.headers.getSetCookie === "function" ? signIn.headers.getSetCookie() : [signIn.headers.get("set-cookie")].filter(Boolean);
  const cookie = cookies.map((value) => value.split(";", 1)[0]).join("; ");
  const form = new FormData();
  form.set("projectId", stableProjectId);
  form.set("projectName", "Safara baseline perception inspection");
  form.set("projectDescription", "safara-baseline-001; qualified Docling perception only.");
  form.set("prdFiles[]", new Blob([bytes], { type: "application/pdf" }), "Safara_Buyer_Business_PRD_Professional.pdf");
  const created = await fetch(`${atlasUrl}/api/projects`, { method: "POST", headers: { cookie, origin }, body: form });
  if (!created.ok) throw new Error(`Lab project creation failed: ${created.status} ${await created.text()}`);

  const deadline = Date.now() + 10 * 60_000;
  let lifecycle;
  while (Date.now() < deadline) {
    const rows = await sql.unsafe("SELECT p.id AS project_id, p.stable_id, b.id AS bundle_id, d.id AS document_id, d.source_sha256, m.state AS member_state, e.id AS execution_id, e.state AS execution_state, e.capability_identity, c.cache_key, c.normalized_document, (SELECT count(*)::integer FROM atlas.semantic_execution s WHERE s.project_id=p.id) AS semantic_execution_count FROM atlas.project p JOIN atlas.extraction_bundle b ON b.project_id=p.id JOIN atlas.document d ON d.project_id=p.id JOIN atlas.extraction_bundle_document m ON m.bundle_id=b.id AND m.document_id=d.id JOIN atlas.document_perception_execution e ON e.id=m.perception_execution_id LEFT JOIN atlas.normalized_document_cache c ON c.source_sha256=d.source_sha256 AND c.contract_version=e.contract_version AND c.capability='atlas.document.perceive' AND c.capability_identity=e.capability_identity AND c.invalidated_at IS NULL WHERE p.stable_id=$1", [stableProjectId]);
    lifecycle = rows[0];
    if (lifecycle?.member_state === "perceived" || lifecycle?.execution_state === "failed") break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!lifecycle) throw new Error("Lab project did not create a perception lifecycle.");
  const completedAt = new Date();
  const normalized = typeof lifecycle.normalized_document === "string" ? JSON.parse(lifecycle.normalized_document) : lifecycle.normalized_document;
  const visualAssets = normalized?.pages?.flatMap((page) => (page.visualRegions ?? []).map((region) => ({ pageNumber: page.number, locatorId: region.id, assetRef: region.assetRef }))) ?? [];
  if (visualAssets.length !== 5 || visualAssets.some((asset) => typeof asset.assetRef !== "string")) throw new Error("RUN-003 did not produce five durable visual references.");
  const manifests = await sql.unsafe("SELECT locator_id,asset_ref,source_sha256,page_number,media_type,width,height,byte_size,sha256,accepted_at FROM atlas.document_perception_derived_manifest WHERE artifact_id=$1 ORDER BY locator_id", [lifecycle.document_id]);
  if (manifests.length !== 5 || manifests.some((manifest) => !manifest.accepted_at || manifest.source_sha256 !== lifecycle.source_sha256 || manifest.media_type !== "image/png")) throw new Error("RUN-003 manifests are not accepted, source-bound PNG evidence.");
  const resolved = [];
  for (const asset of visualAssets) {
    const response = await fetch(`${atlasUrl}/api/derived-evidence?${new URLSearchParams({ documentId: lifecycle.document_id, sourceSha256: lifecycle.source_sha256, locatorId: asset.locatorId, assetRef: asset.assetRef })}`, { headers: { cookie } });
    if (!response.ok) throw new Error(`Authorized derived resolver rejected ${asset.locatorId}: ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const manifest = manifests.find((candidate) => candidate.asset_ref === asset.assetRef && candidate.locator_id === asset.locatorId);
    if (!manifest || bytes.byteLength !== Number(manifest.byte_size) || createHash("sha256").update(bytes).digest("hex") !== manifest.sha256) throw new Error(`Resolved derived bytes failed manifest integrity for ${asset.locatorId}.`);
    resolved.push({ locatorId: asset.locatorId, assetRef: asset.assetRef, pageNumber: asset.pageNumber, byteSize: bytes.byteLength, sha256: manifest.sha256 });
  }
  const evidence = {
    experimentId,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMilliseconds: completedAt.getTime() - startedAt.getTime(),
    source: { filename: "Safara_Buyer_Business_PRD_Professional.pdf", sha256: sourceSha256, byteSize: bytes.byteLength },
    qualifiedRoute: { routeId: "docling-run-003-capture", processor: "docling-slim-2.132.0", adapterVersion: "docling-serve-adapter-v1", doclingServeVersion: "1.36.0", optionProfile: "atlas-digital-pdf-run-003-capture-v1", qualificationVersion: "idser-012-01-03-02-local" },
    lifecycle: lifecycle ? { projectId: lifecycle.project_id, stableProjectId: lifecycle.stable_id, bundleId: lifecycle.bundle_id, documentId: lifecycle.document_id, perceptionExecutionId: lifecycle.execution_id, executionState: lifecycle.execution_state, memberState: lifecycle.member_state, capabilityIdentity: lifecycle.capability_identity, normalizedCacheKey: lifecycle.cache_key ?? null, normalizedDocumentPersisted: Boolean(lifecycle.normalized_document), semanticExecutionCount: lifecycle.semantic_execution_count } : null,
    manifests: manifests.map((manifest) => ({ locatorId: manifest.locator_id, assetRef: manifest.asset_ref, sourceSha256: manifest.source_sha256, pageNumber: manifest.page_number, mediaType: manifest.media_type, width: manifest.width, height: manifest.height, byteSize: Number(manifest.byte_size), sha256: manifest.sha256, acceptedAt: manifest.accepted_at })),
    authorizedResolver: resolved,
    cacheIdentity: "source SHA-256 + contract version + capability + immutable capture capability identity",
  };
  await mkdir(evidenceDirectory, { recursive: true });
  await appendFile(`${evidenceDirectory}/${experimentId}-${stamp}.json`, `${JSON.stringify(evidence, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
  if (lifecycle.execution_state !== "completed" || lifecycle.member_state !== "perceived" || !lifecycle.normalized_document || lifecycle.semantic_execution_count !== 0 || resolved.length !== 5) process.exitCode = 2;
} finally {
  await sql.end();
}
