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
  assert.match(server, /createAtlasAuthFromEnvironment\(environment\)/);
  assert.match(server, /export async function getAtlasAuthService/);
  assert.match(server, /cloudflare:workers/);
  assert.match(route, /createAuthRouteHandler\(service\.auth\)/);
  assert.match(route, /isWorkerAuthRuntime\(\)\) await service\.close\(\)/);
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
  assert.match(form, /id: "name"[\s\S]*type: "text"/);
  assert.match(form, /id: "email"[\s\S]*type: "email"/);
  assert.match(form, /id: "password"[\s\S]*type: "password"/);
  assert.match(form, /\* Required/);
  assert.match(form, /This is the name associated with your Atlas account\./);
  assert.match(form, /Use an email address you can access\./);
  assert.match(form, /8–128 characters\./);
  assert.match(form, /aria-describedby=/);
  assert.match(form, /aria-invalid=/);
  assert.match(form, /createSignUpSubmission/);
  assert.match(form, /disabled=\{isSubmitting\}/);
  assert.match(form, /role="alert"/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|document\.cookie|token|raw server|response\.text\(\)/i);
});

test("sign-up submission waits for success, restores retryability, and coalesces duplicate requests", async () => {
  const { createSignUpSubmission, mapSignUpFailure, validateSignUpPayload } = await jiti.import("../components/sign-up-submission.ts");
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
  assert.equal((await firstAttempt)?.ok, true);
  assert.deepEqual(navigation, ["/demo"]);

  const failedSubmission = createSignUpSubmission(async () => new Response("not exposed", { status: 400 }), () => navigation.push("unexpected"));
  assert.equal((await failedSubmission.submit(payload))?.status, 400);
  assert.deepEqual(navigation, ["/demo"]);
  assert.equal((await failedSubmission.submit(payload))?.status, 400);

  assert.deepEqual(validateSignUpPayload({ name: "", email: "invalid", password: "" }).fieldErrors, {
    name: "Enter your name.", email: "Enter a valid email address.", password: "Enter a password.",
  });
  assert.equal(validateSignUpPayload({ name: "Nadia", email: "nadia@example.test", password: "short" }).fieldErrors.password, "Password must be at least 8 characters.");
  assert.equal(validateSignUpPayload({ name: "Nadia", email: "nadia@example.test", password: "a".repeat(129) }).fieldErrors.password, "Password must be 128 characters or fewer.");

  const duplicate = await mapSignUpFailure(new Response(JSON.stringify({ code: "USER_ALREADY_EXISTS" }), { status: 409 }));
  assert.equal(duplicate.fieldErrors.email, "An account already exists for this email. Try signing in or use a different email.");
  const passwordPolicy = await mapSignUpFailure(new Response(JSON.stringify({ code: "password_too_short" }), { status: 400 }));
  assert.equal(passwordPolicy.fieldErrors.password, "Password must be at least 8 characters.");
  const unknown = await mapSignUpFailure(new Response(JSON.stringify({ message: "sensitive internal detail" }), { status: 500 }));
  assert.equal(unknown.formError, "Atlas couldn't create your account right now. Check your connection and try again.");
  const networkFailure = createSignUpSubmission(async () => { throw new Error("network unreachable"); }, () => navigation.push("unexpected"));
  assert.equal(await networkFailure.submit(payload), null);
});
