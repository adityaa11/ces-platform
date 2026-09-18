import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import createJiti from "jiti";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../", import.meta.url).pathname } });

test("the application auth boundary creates a session without granting Atlas state", { skip }, async () => {
  const [{ POST }, { atlasAuthService }, postgres] = await Promise.all([
    jiti.import("../app/api/auth/[...all]/route.ts"),
    jiti.import("../lib/auth-server.ts"),
    jiti.import("postgres"),
  ]);
  const email = `sus003-${randomUUID()}@example.test`;
  const invalidEmail = `sus003-invalid-${randomUUID()}`;
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  const admin = postgres.default(databaseUrl, { max: 1 });

  try {
    const signUp = await POST(new Request(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseURL },
      body: JSON.stringify({ name: "SUS-003 test", email, password: "a-tested-local-password" }),
    }));
    assert.equal(signUp.status, 200);
    assert.equal(signUp.headers.get("location"), null, "the auth route does not invent browser navigation");
    const cookies = signUp.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookies, "sign-up returns Better Auth's session cookie");

    const session = await POST(new Request(`${baseURL}/api/auth/get-session`, { headers: { cookie: cookies } }));
    assert.equal(session.status, 200);
    const established = await session.json();
    assert.equal(established.user?.email, email);
    assert.equal(established.user?.name, "SUS-003 test");

    const failed = await POST(new Request(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseURL },
      body: JSON.stringify({ name: "", email: invalidEmail, password: "short" }),
    }));
    assert.notEqual(failed.status, 200);
    assert.equal(failed.headers.get("location"), null);
    assert.equal(failed.headers.get("set-cookie"), null, "a failed sign-up cannot establish a session");
    assert.doesNotMatch(await failed.text(), /a-tested-local-password|postgres|stack trace/i);
    const anonymous = await POST(new Request(`${baseURL}/api/auth/get-session`));
    assert.equal(await anonymous.json(), null, "a failed sign-up cannot create authenticated state");
    assert.equal((await admin`SELECT id FROM auth."user" WHERE email = ${invalidEmail}`).length, 0);
    const authorizationTables = await admin`SELECT to_regclass(name) AS relation FROM unnest(ARRAY['atlas.project', 'atlas.workspace', 'atlas.membership', 'atlas.role', 'atlas.permission', 'atlas.ownership', 'atlas.master', 'atlas.initial_draft']) AS name`;
    assert.ok(authorizationTables.every(({ relation }) => relation === null), "the established Atlas schema has no auth-owned project or authorization tables");
  } finally {
    await atlasAuthService.close();
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    await admin.end();
  }
});
