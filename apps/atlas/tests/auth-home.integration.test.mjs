import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";

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

test("renders authenticated /home from the Better Auth session and redirects anonymous requests", { skip: !databaseUrl }, async () => {
  const server = spawn("corepack", ["pnpm", "exec", "vinext", "dev", "--port", "3001"], {
    cwd: new URL("../", import.meta.url),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const email = `sin003-home-${randomUUID()}@example.test`;

  try {
    await waitForServer(server);
    const signUp = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: "SIN-003 home test", email, password: "a-tested-local-password" }),
    });
    assert.equal(signUp.status, 200);
    const cookie = signUp.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookie, "sign-up establishes the Better Auth session used by /home");

    const authenticated = await fetch(`${origin}/home`, { headers: { cookie } });
    assert.equal(authenticated.status, 200, await authenticated.clone().text());
    const html = await authenticated.text();
    assert.match(html, /SIN-003 home test/);
    assert.match(html, new RegExp(email));
    assert.match(html, /No projects yet/);
    assert.match(html, /href="\/home"/);
    assert.match(html, /<a href="\/home" aria-label="Project home" class="topbar-home">/);
    assert.match(html, /class="nav-disabled"/);
    assert.doesNotMatch(html, /Nadia Hartono|>Share<|>Logout<|owner access/i);

    const anonymous = await fetch(`${origin}/home`, { redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(anonymous.status));
    assert.equal(anonymous.headers.get("location"), "/sign-in");
    assert.doesNotMatch(await anonymous.text(), /SIN-003 home test|Nadia Hartono|No projects yet/);
  } finally {
    await stopServer(server);
  }
});
