import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import createJiti from "jiti";

const jiti = createJiti(import.meta.url);

test("mounts the shared Better Auth handler without application auth state", async () => {
  const [server, route, manifest] = await Promise.all([
    readFile(new URL("../lib/auth-server.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/[...all]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(manifest, /"@atlas\/auth": "workspace:\*"/);
  assert.match(server, /createAtlasAuthFromEnvironment\(\)/);
  assert.match(server, /export const atlasAuthService = createAtlasAuthFromEnvironment\(\)/);
  assert.match(route, /createAuthRouteHandler\(auth\)/);
  assert.match(route, /export const GET = handle/);
  assert.match(route, /export const POST = handle/);
  assert.doesNotMatch(`${server}\n${route}`, /betterAuth\(|createDatabase\(|localStorage|sessionStorage|jwt|project_member|atlas\.project/i);
});

test("the mounted route preserves the established handler response and session cookie", async () => {
  const { createAuthRouteHandler } = await jiti.import("../lib/auth-route.ts");
  const request = new Request("http://localhost:3001/api/auth/sign-up/email", { method: "POST", body: "{}" });
  const delegatedResponse = new Response(JSON.stringify({ user: { id: "user-1" } }), {
    headers: { "content-type": "application/json", "set-cookie": "better-auth.session_token=opaque; HttpOnly; Path=/; SameSite=Lax" },
    status: 201,
  });
  let delegatedRequest;
  const handle = createAuthRouteHandler({
    handler: async (received) => {
      delegatedRequest = received;
      return delegatedResponse;
    },
  });

  const response = await handle(request);
  assert.strictEqual(delegatedRequest, request);
  assert.strictEqual(response, delegatedResponse);
  assert.equal(response.status, 201);
  assert.match(response.headers.get("set-cookie") ?? "", /better-auth\.session_token=.*HttpOnly.*SameSite=Lax/);
});

test("sign-up delegates identity creation to Better Auth without browser-owned session state", async () => {
  const [screen, form] = await Promise.all([
    readFile(new URL("../components/AuthScreen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SignUpForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(screen, /mode === "sign-up" \? <SignUpForm \/>/);
  assert.match(form, /name="name" required type="text"/);
  assert.match(form, /name="email" required type="email"/);
  assert.match(form, /name="password" required type="password"/);
  assert.match(form, /createSignUpSubmission/);
  assert.match(form, /disabled=\{isSubmitting\}/);
  assert.match(form, /role="alert"/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|document\.cookie|token|raw server|response\.text\(\)/i);
});

test("sign-up submission waits for success, restores retryability, and coalesces duplicate requests", async () => {
  const { createSignUpSubmission } = await jiti.import("../components/sign-up-submission.ts");
  const payload = { name: "Nadia Hartono", email: "nadia@example.test", password: "not-a-real-password" };
  let requestCount = 0;
  let resolveRequest;
  const navigation = [];
  const pending = new Promise((resolve) => { resolveRequest = resolve; });
  const submission = createSignUpSubmission(async (received) => {
    requestCount += 1;
    assert.deepEqual(received, payload);
    return pending;
  }, () => navigation.push("/demo"));

  const firstAttempt = submission.submit(payload);
  const duplicateAttempt = submission.submit(payload);
  assert.strictEqual(firstAttempt, duplicateAttempt);
  assert.equal(requestCount, 1);
  resolveRequest(new Response(JSON.stringify({ user: { id: "user-1" } }), { status: 200 }));
  assert.equal(await firstAttempt, "success");
  assert.deepEqual(navigation, ["/demo"]);

  const failedSubmission = createSignUpSubmission(async () => new Response("not exposed", { status: 400 }), () => navigation.push("unexpected"));
  assert.equal(await failedSubmission.submit(payload), "failure");
  assert.deepEqual(navigation, ["/demo"]);
  assert.equal(await failedSubmission.submit(payload), "failure");
});
