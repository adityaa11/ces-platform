import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import test from "node:test";
const databaseUrl = process.env.DATABASE_URL, origin = "http://localhost:3001";
const form = (id) => { const body = new FormData(); body.set("projectId", id); body.set("projectName", "PCC route project"); body.append("prdFiles[]", new File(["%PDF-1.7\nsource"], "brief.pdf", { type: "application/pdf" })); return body; };
test("PCC-003 accepts only a trusted authenticated multipart project request", { skip: !databaseUrl }, async () => {
  const suffix = randomUUID().slice(0, 12), id = `pcc-route-${suffix}`, email = `pcc-${suffix}@example.test`, admin = postgres(databaseUrl, { max: 1 });
  try {
    await fetch("http://localhost:3001/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name: "PCC", email, password: "a-tested-local-password" }) });
    const signedIn = await fetch("http://localhost:3001/api/auth/sign-in/email", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ email, password: "a-tested-local-password" }) });
    const cookie = signedIn.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.equal((await fetch("http://localhost:3001/api/projects", { method: "POST", headers: { cookie, origin: "https://attacker.example" }, body: form(id) })).status, 403);
    const created = await fetch("http://localhost:3001/api/projects", { method: "POST", headers: { cookie, origin }, body: form(id) });
    assert.equal(created.status, 201, await created.clone().text());
    assert.deepEqual(await created.json(), { project: { projectId: id, name: "PCC route project", documentCount: 1 } });
    assert.equal((await admin`SELECT COUNT(*)::integer AS count FROM atlas.project WHERE stable_id=${id}`)[0].count, 1);
  } finally { await admin`DELETE FROM atlas.project WHERE stable_id=${id}`; await admin`DELETE FROM auth."user" WHERE email=${email}`; await admin.end(); }
});
