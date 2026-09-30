import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import test from "node:test";

const databaseUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3001";
const cookieHeader = (response) => response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
const signUp = async (name, email) => {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ name, email, password: "a-tested-local-password" }) });
  assert.equal(response.status, 200, await response.clone().text());
  return cookieHeader(response);
};

const holdPerceptionDelivery = (admin, projectId) => admin.unsafe(`CREATE OR REPLACE FUNCTION pgboss.idser00904_hold_perception() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name='atlas-document-perception-v1' AND EXISTS (SELECT 1 FROM atlas.document document JOIN atlas.project project ON project.id=document.project_id WHERE document.id=(NEW.data #>> '{request,artifact,id}')::uuid AND project.stable_id=TG_ARGV[0]) THEN NEW.start_after=now()+interval '10 minutes'; END IF; RETURN NEW; END; $$; DROP TRIGGER IF EXISTS idser00904_hold_perception ON pgboss.job_common; CREATE TRIGGER idser00904_hold_perception BEFORE INSERT ON pgboss.job_common FOR EACH ROW EXECUTE FUNCTION pgboss.idser00904_hold_perception('${projectId}');`);
const releasePerceptionDelivery = (admin, projectId) => admin.unsafe("DROP TRIGGER IF EXISTS idser00904_hold_perception ON pgboss.job_common; DROP FUNCTION IF EXISTS pgboss.idser00904_hold_perception(); DELETE FROM pgboss.job WHERE name='atlas-document-perception-v1' AND start_after>now() AND data #>> '{request,artifact,id}' IN (SELECT id::text FROM atlas.document WHERE project_id=(SELECT id FROM atlas.project WHERE stable_id=$1));", [projectId]);

test("PCC-004 renders only the session member's persisted waiting projects on /home", { skip: !databaseUrl }, async () => {
  const suffix = randomUUID().slice(0, 12);
  const projectId = `pcc-home-${suffix}`;
  const ownerEmail = `pcc-home-owner-${suffix}@example.test`;
  const otherEmail = `pcc-home-other-${suffix}@example.test`;
  const admin = postgres(databaseUrl, { max: 1 });
  try {
    await holdPerceptionDelivery(admin, projectId);
    const [ownerCookie, otherCookie] = await Promise.all([signUp("PCC home owner", ownerEmail), signUp("PCC home other", otherEmail)]);
    const form = new FormData();
    form.set("projectId", projectId); form.set("projectName", "PCC home project"); form.set("projectDescription", "Persisted Atlas project description");
    form.append("prdFiles[]", new File([Buffer.from("%PDF-1.7\nPCC-004 source")], "brief.pdf", { type: "application/pdf" }));
    const created = await fetch(`${origin}/api/projects`, { method: "POST", headers: { cookie: ownerCookie, origin }, body: form });
    assert.equal(created.status, 201, await created.clone().text());
    const [ownerHome, otherHome] = await Promise.all([fetch(`${origin}/home`, { headers: { cookie: ownerCookie } }), fetch(`${origin}/home`, { headers: { cookie: otherCookie } })]);
    assert.equal(ownerHome.status, 200);
    assert.equal(otherHome.status, 200);
    const ownerHtml = await ownerHome.text();
    const otherHtml = await otherHome.text();
    assert.match(ownerHtml, /PCC home project/);
    assert.match(ownerHtml, /Waiting for extraction/);
    assert.match(ownerHtml, /No published work/);
    assert.match(ownerHtml, /0 of 1 PRDs processed/);
    assert.match(ownerHtml, /0%/);
    assert.match(ownerHtml, /<dd>0<\/dd><dt>published facts<\/dt>/);
    assert.match(ownerHtml, /<dd>1<\/dd><dt>PRDs uploaded<\/dt>/);
    assert.match(ownerHtml, /Workspace unavailable/);
    assert.doesNotMatch(ownerHtml, /href="\/demo\?projectId=/);
    assert.match(ownerHtml, /aria-label="Sharing unavailable until production sharing is supported"[^>]*disabled=""[^>]*>Share<\/button>/);
    assert.doesNotMatch(ownerHtml, /storage_key|PCC-004 source|\.atlas-data/i);
    assert.doesNotMatch(otherHtml, new RegExp(`PCC home project|${projectId}`), "membership authorization happens before project data reaches User B's browser");
    assert.match(otherHtml, /No projects yet/);
  } finally {
    await releasePerceptionDelivery(admin, projectId);
    await admin`DELETE FROM atlas.project WHERE stable_id=${projectId}`;
    await admin`DELETE FROM auth."user" WHERE email IN (${ownerEmail}, ${otherEmail})`;
    await admin.end();
  }
});
