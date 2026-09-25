import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import test from "node:test";

const databaseUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3001";
const endpoint = "http://localhost:3001/api/projects";
const sourceBytes = Buffer.from("%PDF-1.7\nPCC-003 exact source bytes");
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
    assert.equal((await route(form(id), cookie, { origin: "https://attacker.example" })).status, 403, "untrusted origins stop before creation");
    assert.equal((await route(new FormData(), cookie, { "content-type": "application/json" })).status, 415, "JSON and fixture transport are rejected");
    assert.equal((await route(form(id, { omitId: true }), cookie)).status, 400, "required metadata is validated");
    assert.equal((await route(form(`pcc-invalid-${suffix}`, { bytes: Buffer.from("not a PDF") }), cookie)).status, 400, "spoofed PDF content is rejected");
    assert.equal((await route(form(`pcc-media-${suffix}`, { mediaType: "text/plain" }), cookie)).status, 415, "unsupported media is rejected");
    assert.equal((await route(form(`pcc-large-${suffix}`, { bytes: Buffer.alloc(20 * 1024 * 1024 + 1, 0x61) }), cookie)).status, 413, "per-file size is bounded");
    const created = await route(form(id, { claimedCreator: "attacker-controlled-user" }), cookie, { host: "attacker.example" });
    assert.equal(created.status, 201, await created.clone().text());
    const createdBody = await created.json();
    assert.deepEqual(createdBody, { project: { projectId: id, name: "PCC route project", documentCount: 1 } });
    assert.doesNotMatch(JSON.stringify(createdBody), /storage|path|cookie|secret|database|sql|%PDF/i, "success responses expose no source or infrastructure internals");
    const project = (await admin`SELECT id, created_by_user_id FROM atlas.project WHERE stable_id=${id}`)[0];
    assert.equal(project.created_by_user_id, session.user.id, "only the server-resolved session identity is persisted");
    const document = (await admin`SELECT storage_key FROM atlas.document WHERE project_id=${project.id}`)[0];
    assert.deepEqual(await readFile(join(process.env.ATLAS_DOCUMENT_STORE_ROOT, document.storage_key)), sourceBytes, "DocumentStore preserves exact upload bytes");
    assert.equal((await route(form(id), cookie)).status, 409, "duplicate submission is rejected by server uniqueness");
    assert.equal((await route(form(duplicateId), cookie)).status, 201);
    assert.equal((await route(form(duplicateId), cookie)).status, 409, "duplicate requests cannot create a second project");
    const fixtureState = await fetch("http://localhost:3001/api/local-fixtures");
    assert.equal(fixtureState.status, 200);
    assert.doesNotMatch(await fixtureState.text(), new RegExp(`${id}|${duplicateId}`), "production uploads never enter fixture persistence");
  } finally {
    await admin`DELETE FROM atlas.project WHERE stable_id IN (${id}, ${duplicateId})`;
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    await admin.end();
  }
});
