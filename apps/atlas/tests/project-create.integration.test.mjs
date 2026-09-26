import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import test from "node:test";

const databaseUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3001";
const endpoint = "http://localhost:3001/api/projects";
const sourceBytes = Buffer.from("%PDF-1.7\nPCC-003 exact source bytes");
const injectedFailure = process.env.ATLAS_PROJECT_CREATION_TEST_FAILURE;
const form = (id, options = {}) => {
  const body = new FormData();
  if (!options.omitId) body.set("projectId", id);
  body.set("projectName", options.name ?? "PCC route project");
  if (options.claimedCreator) body.set("creatorUserId", options.claimedCreator);
  if (!options.omitFile) body.append("prdFiles[]", new File([options.bytes ?? sourceBytes], options.filename ?? "brief.pdf", { type: options.mediaType ?? "application/pdf" }));
  return body;
};
const cookieHeader = (response) => response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
const route = (body, cookie = "", headers = {}) => fetch(endpoint, { method: "POST", headers: { cookie, origin, ...headers }, body });

test("PCC-003 enforces the authenticated multipart creation boundary and safe failure matrix", { skip: !databaseUrl }, async () => {
  const suffix = randomUUID().slice(0, 12);
  const id = `pcc-route-${suffix}`;
  const duplicateId = `pcc-duplicate-${suffix}`;
  const email = `pcc-${suffix}@example.test`;
  const admin = postgres(databaseUrl, { max: 1 });
  try {
    assert.equal((await route(form(id))).status, 401, "unauthenticated uploads cannot create Atlas state");
    const signedUp = await fetch("http://localhost:3001/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "PCC", email, password: "a-tested-local-password" }) });
    assert.equal(signedUp.status, 200, await signedUp.clone().text());
    const signedIn = await fetch("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email, password: "a-tested-local-password" }) });
    assert.equal(signedIn.status, 200, await signedIn.clone().text());
    const cookie = cookieHeader(signedIn);
    const session = await (await fetch("http://localhost:3001/api/auth/get-session", { headers: { cookie } })).json();
    assert.ok(session.user?.id);
    if (injectedFailure) {
      const failed = await route(form(id), cookie);
      assert.equal(failed.status, 500);
      assert.deepEqual(await failed.json(), { error: "Unable to create the project. Please try again." });
      const visible = await admin`SELECT stable_id FROM atlas.project WHERE stable_id=${id}`;
      assert.equal(visible.length, 0, `${injectedFailure} failure creates no visible Atlas project`);
      return;
    }
    assert.equal((await route(form(id), cookie, { origin: "https://attacker.example" })).status, 403, "untrusted origins stop before creation");
    assert.equal((await route(new FormData(), cookie, { "content-type": "application/json" })).status, 415, "JSON and fixture transport are rejected");
    assert.equal((await route(form(id, { omitId: true }), cookie)).status, 400, "required metadata is validated");
    assert.equal((await route(form(`pcc-no-prd-${suffix}`, { omitFile: true }), cookie)).status, 400, "at least one PRD is required");
    const tooMany = new FormData();
    tooMany.set("projectId", `pcc-many-${suffix}`); tooMany.set("projectName", "Too many PDFs");
    for (let index = 0; index < 11; index += 1) tooMany.append("prdFiles[]", new File([sourceBytes], `brief-${index}.pdf`, { type: "application/pdf" }));
    assert.equal((await route(tooMany, cookie)).status, 400, "file count is bounded");
    assert.equal((await route(form(`pcc-invalid-${suffix}`, { bytes: Buffer.from("not a PDF") }), cookie)).status, 400, "spoofed PDF content is rejected");
    assert.equal((await route(form(`pcc-media-${suffix}`, { mediaType: "text/plain" }), cookie)).status, 415, "unsupported media is rejected");
    assert.equal((await route(form(`pcc-large-${suffix}`, { bytes: Buffer.alloc(20 * 1024 * 1024 + 1, 0x61) }), cookie)).status, 413, "per-file size is bounded");
    const totalTooLarge = new FormData();
    totalTooLarge.set("projectId", `pcc-total-${suffix}`); totalTooLarge.set("projectName", "Total too large");
    totalTooLarge.append("prdFiles[]", new File([Buffer.alloc(20 * 1024 * 1024, 0x61)], "one.pdf", { type: "application/pdf" }));
    totalTooLarge.append("prdFiles[]", new File([Buffer.alloc(20 * 1024 * 1024, 0x62)], "two.pdf", { type: "application/pdf" }));
    totalTooLarge.append("prdFiles[]", new File([sourceBytes], "three.pdf", { type: "application/pdf" }));
    assert.equal((await route(totalTooLarge, cookie)).status, 413, "total request size is bounded");
    const created = await route(form(id, { claimedCreator: "attacker-controlled-user" }), cookie, { host: "attacker.example" });
    assert.equal(created.status, 201, await created.clone().text());
    const createdBody = await created.json();
    assert.deepEqual(createdBody, { project: { projectId: id, name: "PCC route project", documentCount: 1 } });
    assert.doesNotMatch(JSON.stringify(createdBody), /storage|path|cookie|secret|database|sql|%PDF/i, "success responses expose no source or infrastructure internals");
    const project = (await admin`SELECT id, created_by_user_id, description FROM atlas.project WHERE stable_id=${id}`)[0];
    assert.equal(project.created_by_user_id, session.user.id, "only the server-resolved session identity is persisted");
    assert.equal(project.description, null, "optional metadata stays faithful to the submitted command");
    assert.deepEqual(Array.from(await admin`SELECT user_id, role FROM atlas.project_member WHERE project_id=${project.id}`), [{ user_id: session.user.id, role: "owner" }], "creator receives the persisted owner membership");
    assert.deepEqual(Array.from(await admin`SELECT kind, state FROM atlas.workspace WHERE project_id=${project.id} ORDER BY kind`), [{ kind: "initial_draft", state: "draft" }, { kind: "master", state: "empty" }], "creation establishes the empty Master and Initial Draft");
    const document = (await admin`SELECT id, storage_key, source_sha256, byte_size, media_type, workspace_id FROM atlas.document WHERE project_id=${project.id}`)[0];
    assert.deepEqual(await readFile(join(process.env.ATLAS_DOCUMENT_STORE_ROOT, document.storage_key)), sourceBytes, "DocumentStore preserves exact upload bytes");
    assert.equal(document.source_sha256, createHash("sha256").update(sourceBytes).digest("hex"), "metadata retains the immutable source hash");
    assert.equal(Number(document.byte_size), sourceBytes.byteLength, "metadata retains source byte size");
    assert.equal(document.media_type, "application/pdf", "metadata retains the PDF media type");
    assert.equal((await admin`SELECT kind FROM atlas.workspace WHERE id=${document.workspace_id}`)[0].kind, "initial_draft", "each source belongs to the Initial Draft");
    assert.doesNotMatch(JSON.stringify(document), /%PDF|PCC-003 exact source bytes/, "ordinary Atlas rows retain metadata, never raw PDF bytes");
    assert.equal((await route(form(id), cookie)).status, 409, "duplicate submission is rejected by server uniqueness");
    assert.equal((await route(form(duplicateId), cookie)).status, 201);
    assert.equal((await route(form(duplicateId), cookie)).status, 409, "duplicate requests cannot create a second project");
    const fixtureState = await fetch("http://localhost:3001/api/local-fixtures");
    assert.equal(fixtureState.status, 200);
    assert.doesNotMatch(await fixtureState.text(), new RegExp(`${id}|${duplicateId}`), "production uploads never enter fixture persistence");
    const [{ count: queueCount }] = await admin`SELECT COUNT(*)::integer AS count FROM pgboss.job WHERE name='atlas-document-perception-v1' AND data::text LIKE ${`%${id}%`}`;
    assert.equal(queueCount, 0, "project creation does not enqueue downstream perception");
    const [{ executions, grants, cache, derived }] = await admin`SELECT (SELECT COUNT(*)::integer FROM atlas.document_perception_execution WHERE artifact_id=${document.id}) AS executions, (SELECT COUNT(*)::integer FROM atlas.document_perception_source_grant WHERE artifact_id=${document.id}) AS grants, (SELECT COUNT(*)::integer FROM atlas.normalized_document_cache WHERE source_sha256=${document.source_sha256}) AS cache, (SELECT COUNT(*)::integer FROM atlas.document_perception_derived_asset asset JOIN atlas.normalized_document_cache cache ON cache.cache_key=asset.cache_key WHERE cache.source_sha256=${document.source_sha256}) AS derived`;
    assert.equal(executions, 0, "creation does not start perception execution");
    assert.equal(grants, 0, "creation does not issue a perception source grant");
    assert.equal(cache, 0, "creation does not write normalized extraction cache state");
    assert.equal(derived, 0, "creation does not write perception-derived assets");
  } finally {
    await admin`DELETE FROM atlas.project WHERE stable_id IN (${id}, ${duplicateId})`;
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    await admin.end();
  }
});
