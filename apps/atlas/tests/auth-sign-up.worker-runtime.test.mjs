import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";

const runtimeUrl = process.env.ATLAS_RUNTIME_URL;
const databaseUrl = process.env.DATABASE_URL;
const skip = !runtimeUrl || !databaseUrl;

const cookieHeader = (response) => response.headers.getSetCookie()
  .map((value) => value.split(";", 1)[0])
  .join("; ");

test("Vinext worker runtime signs up and reads a Better Auth session safely", { skip }, async () => {
  const origin = new URL(runtimeUrl).origin;
  const email = `sus004-${randomUUID()}@example.test`;
  const invalidEmail = `sus004-invalid-${randomUUID()}@example.test`;
  const password = "a-tested-local-password";
  const database = postgres(databaseUrl, { max: 1 });

  try {
    const signUp = await fetch(new URL("/api/auth/sign-up/email", origin), {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: "SUS-004 runtime test", email, password }),
    });
    assert.equal(signUp.status, 200);
    const cookies = cookieHeader(signUp);
    assert.ok(cookies, "the worker response returns Better Auth's session cookie");

    const session = await fetch(new URL("/api/auth/get-session", origin), { headers: { cookie: cookies } });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).user?.email, email);

    const invalid = await fetch(new URL("/api/auth/sign-up/email", origin), {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: "", email: invalidEmail, password: "short" }),
    });
    assert.notEqual(invalid.status, 200);
    assert.equal(cookieHeader(invalid), "", "invalid input cannot establish a session");
    assert.doesNotMatch(await invalid.text(), new RegExp(`${password}|code generation|unsafe-eval|stack trace|postgres`, "i"));
    assert.equal((await database`SELECT id FROM auth."user" WHERE email = ${invalidEmail}`).length, 0);
  } finally {
    await database`DELETE FROM auth."user" WHERE email IN (${email}, ${invalidEmail})`;
    await database.end();
  }
});
