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

test("sign-out invalidates only the current application session and preserves its account", { skip: !databaseUrl }, async () => {
  const server = spawn("corepack", ["pnpm", "exec", "vinext", "dev", "--port", "3001"], {
    cwd: new URL("../", import.meta.url),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const email = `sout003-sign-out-${randomUUID()}@example.test`;
  const password = "a-tested-local-password";
  const admin = postgres(databaseUrl, { max: 1 });

  try {
    await waitForServer(server);
    const signUp = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: "SOUT-003 sign-out test", email, password }),
    });
    assert.equal(signUp.status, 200);

    const signIn = await fetch(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(signIn.status, 200);
    const cookie = signIn.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookie, "sign-in establishes the normal Better Auth session cookie");

    const authenticatedHome = await fetch(`${origin}/home`, { headers: { cookie } });
    assert.equal(authenticatedHome.status, 200);
    const html = await authenticatedHome.text();
    assert.match(html, new RegExp(`<button[^>]*aria-label="SOUT-003 sign-out test, ${email}"`));
    assert.doesNotMatch(html, /<a[^>]*>Logout<\/a>|<a[^>]*>Sign out<\/a>/i);

    const signOut = await fetch(`${origin}/api/auth/sign-out`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie, origin },
      body: JSON.stringify({}),
    });
    assert.equal(signOut.status, 200);

    const oldSession = await fetch(`${origin}/api/auth/get-session`, { headers: { cookie } });
    assert.equal(await oldSession.json(), null, "the old session no longer resolves after sign-out");

    const rejectedHome = await fetch(`${origin}/home`, { headers: { cookie }, redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(rejectedHome.status));
    assert.equal(rejectedHome.headers.get("location"), "/sign-in");
    assert.equal((await admin`SELECT id FROM auth."user" WHERE email = ${email}`).length, 1, "sign-out preserves the Better Auth account");
  } finally {
    await stopServer(server);
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    assert.equal((await admin`SELECT id FROM auth."user" WHERE email = ${email}`).length, 0, "cleanup removes only the unique temporary identity");
    await admin.end();
  }
});
