import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { createAtlasAuth } from "../src/index.ts";

const databaseUrl = process.env.DATABASE_URL;
const skip = !databaseUrl;

test("email sign-up creates a durable session and sign-out invalidates it", { skip }, async () => {
  const email = `bss004-${randomUUID()}@example.test`;
  const config = {
    databaseUrl: databaseUrl!,
    secret: "0123456789abcdef0123456789abcdef",
    baseURL: "http://localhost:3001",
    trustedOrigins: ["http://localhost:3001"],
  };
  let service = createAtlasAuth(config);
  const admin = postgres(databaseUrl!, { max: 1 });
  try {
    const signUp = await service.auth.handler(new Request("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: config.baseURL },
      body: JSON.stringify({ name: "BSS-004 test", email, password: "a-tested-local-password" }),
    }));
    assert.equal(signUp.status, 200);
    const cookies = signUp.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    assert.ok(cookies, "sign-up returns a session cookie");

    await service.close();
    service = createAtlasAuth(config);
    const session = await service.auth.handler(new Request("http://localhost:3001/api/auth/get-session", { headers: { cookie: cookies } }));
    assert.equal(session.status, 200);
    const established = await session.json() as { user?: { email?: string } };
    assert.equal(established.user?.email, email);

    const signOut = await service.auth.handler(new Request("http://localhost:3001/api/auth/sign-out", {
      method: "POST",
      headers: { cookie: cookies, origin: config.baseURL },
    }));
    assert.equal(signOut.status, 200);
    const missing = await service.auth.handler(new Request("http://localhost:3001/api/auth/get-session", { headers: { cookie: cookies } }));
    assert.equal(await missing.json(), null);
  } finally {
    await service.close();
    await admin`DELETE FROM auth."user" WHERE email = ${email}`;
    await admin.end();
  }
});
