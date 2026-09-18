import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import createJiti from "jiti";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;
const jiti = createJiti(import.meta.url);

test("the application auth boundary creates a session without granting Atlas state", { skip }, async () => {
  const [{ createAtlasAuth }, { createAuthRouteHandler }, postgres] = await Promise.all([
    jiti.import("../../../packages/atlas-auth/src/index.ts"),
    jiti.import("../lib/auth-route.ts"),
    jiti.import("postgres"),
  ]);
  const email = `sus003-${randomUUID()}@example.test`;
  const applicationUrl = new URL(databaseUrl);
  applicationUrl.username = "atlas_app";
  applicationUrl.password = process.env.ATLAS_APP_PASSWORD ?? "atlas_app_local_dev_only";
  const config = {
    databaseUrl: applicationUrl.toString(),
    secret: process.env.BETTER_AUTH_SECRET ?? "0123456789abcdef0123456789abcdef",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "http://localhost:3001").split(","),
  };
  const service = createAtlasAuth(config);
  const handle = createAuthRouteHandler(service.auth);
  const admin = postgres.default(databaseUrl, { max: 1 });

  try {
    const signUp = await handle(new Request(`${config.baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: config.baseURL },
      body: JSON.stringify({ name: "SUS-003 test", email, password: "a-tested-local-password" }),
    }));
    assert.equal(signUp.status, 200);
    assert.equal(signUp.headers.get("location"), null, "the auth route does not invent browser navigation");
    const cookies = signUp.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookies, "sign-up returns Better Auth's session cookie");

    const session = await handle(new Request(`${config.baseURL}/api/auth/get-session`, { headers: { cookie: cookies } }));
    assert.equal(session.status, 200);
    const established = await session.json();
    assert.equal(established.user?.email, email);
    assert.equal(established.user?.name, "SUS-003 test");

    const failed = await handle(new Request(`${config.baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: config.baseURL },
      body: JSON.stringify({ name: "", email: "not-an-email", password: "short" }),
    }));
    assert.notEqual(failed.status, 200);
    assert.equal(failed.headers.get("location"), null);
    assert.doesNotMatch(await failed.text(), /a-tested-local-password|postgres|stack trace/i);
  } finally {
    await service.close();
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    await admin.end();
  }
});
