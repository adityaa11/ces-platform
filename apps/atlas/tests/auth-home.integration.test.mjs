import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const origin = "http://localhost:3001";

async function waitForServer(child) {
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const response = await fetch(origin, { redirect: "manual" });
      if (response.ok) return;
    } catch { /* The server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Atlas test server did not start: ${output}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
}

test("signs an existing user into the empty authenticated home without fixture or authorization state", { skip: !databaseUrl }, async () => {
  const server = spawn("corepack", ["pnpm", "exec", "vinext", "dev", "--port", "3001"], {
    cwd: new URL("../", import.meta.url),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const email = `sin004-sign-in-${randomUUID()}@example.test`;
  const invalidEmail = `sin004-invalid-${randomUUID()}@example.test`;
  const password = "a-tested-local-password";
  const admin = postgres(databaseUrl, { max: 1 });

  try {
    await waitForServer(server);
    const signUp = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: "SIN-004 sign-in test", email, password }),
    });
    assert.equal(signUp.status, 200);
    assert.ok(signUp.headers.getSetCookie().length > 0, "setup creates the unique Better Auth identity");

    const signIn = await fetch(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(signIn.status, 200);
    const cookie = signIn.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookie, "sign-in establishes the normal Better Auth session cookie");

    const session = await fetch(`${origin}/api/auth/get-session`, { headers: { cookie } });
    assert.equal(session.status, 200);
    const established = await session.json();
    assert.equal(established.user?.name, "SIN-004 sign-in test");
    assert.equal(established.user?.email, email);

    const authenticated = await fetch(`${origin}/home`, { headers: { cookie } });
    assert.equal(authenticated.status, 200, await authenticated.clone().text());
    const html = await authenticated.text();
    assert.match(html, /SIN-004 sign-in test/);
    assert.match(html, new RegExp(email));
    assert.match(html, /No projects yet/);
    assert.match(html, /<span>0<!-- --> repositories<\/span>/);
    assert.match(html, /href="\/home"/);
    assert.match(html, /<a href="\/home" aria-label="Project home" class="topbar-home">/);
    assert.match(html, /class="nav-disabled"/);
    assert.doesNotMatch(html, /Nadia Hartono|>Share<|>Logout<|owner access|Current accepted project source of truth/i);
    assert.doesNotMatch(html, /local-fixtures|fixture-powered prototype/i);

    const anonymous = await fetch(`${origin}/home`, { redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(anonymous.status));
    assert.equal(anonymous.headers.get("location"), "/sign-in");
    assert.doesNotMatch(await anonymous.text(), /SIN-004 sign-in test|Nadia Hartono|No projects yet/);

    const invalid = await fetch(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email: invalidEmail, password }),
    });
    assert.notEqual(invalid.status, 200);
    assert.equal(invalid.headers.getSetCookie().length, 0, "invalid credentials cannot establish a session");
    assert.doesNotMatch(await invalid.text(), /a-tested-local-password|postgres|stack trace/i);
    assert.equal((await admin`SELECT id FROM auth."user" WHERE email = ${invalidEmail}`).length, 0);

    const [emptyDemo, projectDemo] = await Promise.all([
      fetch(`${origin}/demo?scenario=empty-library`),
      fetch(`${origin}/demo?scenario=owner-ready`),
    ]);
    assert.equal(emptyDemo.status, 200);
    assert.match(await emptyDemo.text(), /No projects yet/);
    assert.equal(projectDemo.status, 200);
    assert.match(await projectDemo.text(), /Safara operations platform/);
  } finally {
    await stopServer(server);
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    assert.equal((await admin`SELECT id FROM auth."user" WHERE email = ${email}`).length, 0, "cleanup removes only the unique temporary identity");
    await admin.end();
  }
});
