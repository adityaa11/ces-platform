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

test("sign-in delegates credentials to Better Auth and navigates only after success", async () => {
  const [screen, form] = await Promise.all([
    readFile(new URL("../components/AuthScreen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SignInForm.tsx", import.meta.url), "utf8"),
  ]);
  const { createSignInSubmission, mapSignInFailure, validateSignInPayload } = await jiti.import("../components/sign-in-submission.ts");

  assert.match(screen, /mode === "sign-in" \? <SignInForm \/>/);
  assert.match(form, /fetch\("\/api\/auth\/sign-in\/email"/);
  assert.match(form, /credentials: "same-origin"/);
  assert.match(form, /router\.push\("\/home"\)/);
  assert.match(form, /disabled=\{isSubmitting\}/);
  assert.match(form, /role="alert"/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|document\.cookie|token|response\.text\(\)|\/demo/i);

  const payload = { email: "nadia@example.test", password: "not-a-real-password" };
  let requestCount = 0;
  let resolveRequest;
  const navigation = [];
  const pending = new Promise((resolve) => { resolveRequest = resolve; });
  const submission = createSignInSubmission(async (received) => {
    requestCount += 1;
    assert.deepEqual(received, payload);
    return pending;
  }, () => navigation.push("/home"));

  const firstAttempt = submission.submit(payload);
  const duplicateAttempt = submission.submit(payload);
  assert.strictEqual(firstAttempt, duplicateAttempt);
  assert.equal(requestCount, 1);
  resolveRequest(new Response(JSON.stringify({ user: { id: "user-1" } }), { status: 200 }));
  assert.equal((await firstAttempt)?.ok, true);
  assert.deepEqual(navigation, ["/home"]);

  const failure = createSignInSubmission(async () => new Response(JSON.stringify({ message: "sensitive detail" }), { status: 401 }), () => navigation.push("unexpected"));
  assert.equal((await failure.submit(payload))?.status, 401);
  assert.deepEqual(navigation, ["/home"]);
  assert.equal((await failure.submit(payload))?.status, 401);
  assert.deepEqual(validateSignInPayload({ email: "invalid", password: "" }).fieldErrors, {
    email: "Enter a valid email address.", password: "Enter your password.",
  });
  assert.equal((await mapSignInFailure(new Response(JSON.stringify({ message: "sensitive detail" }), { status: 500 }))).formError, "Atlas couldn't sign you in right now. Check your email and password, then try again.");
  const networkFailure = createSignInSubmission(async () => { throw new Error("network unreachable"); }, () => navigation.push("unexpected"));
  assert.equal(await networkFailure.submit(payload), null);
});

test("sign-out submission uses the approved endpoint, navigates after success, and stays retryable on failure", async () => {
  const [submissionSource] = await Promise.all([
    readFile(new URL("../components/sign-out-submission.ts", import.meta.url), "utf8"),
  ]);
  const { createSignOutSubmission, mapSignOutFailure, requestSignOut } = await jiti.import("../components/sign-out-submission.ts");

  assert.match(submissionSource, /fetch\("\/api\/auth\/sign-out"/);
  assert.match(submissionSource, /body: JSON\.stringify\(\{\}\)/);
  assert.match(submissionSource, /headers: \{ "content-type": "application\/json" \}/);
  assert.match(submissionSource, /method: "POST"/);
  assert.match(submissionSource, /credentials: "same-origin"/);
  assert.doesNotMatch(submissionSource, /localStorage|sessionStorage|document\.cookie|token|cookie|jwt|project|fixture|response\.text\(\)|console\./i);

  let requestCount = 0;
  let resolveRequest;
  const navigation = [];
  const pending = new Promise((resolve) => { resolveRequest = resolve; });
  const submission = createSignOutSubmission(async () => {
    requestCount += 1;
    return pending;
  }, () => navigation.push("/sign-in"));

  const firstAttempt = submission.submit();
  const duplicateAttempt = submission.submit();
  assert.strictEqual(firstAttempt, duplicateAttempt);
  assert.equal(requestCount, 1);
  resolveRequest(new Response(null, { status: 204 }));
  assert.equal((await firstAttempt)?.ok, true);
  assert.deepEqual(navigation, ["/sign-in"]);

  const rejected = createSignOutSubmission(async () => new Response("not exposed", { status: 500 }), () => navigation.push("unexpected"));
  assert.equal((await rejected.submit())?.status, 500);
  assert.equal((await rejected.submit())?.status, 500);
  assert.deepEqual(navigation, ["/sign-in"]);

  const networkFailure = createSignOutSubmission(async () => { throw new Error("network unreachable"); }, () => navigation.push("unexpected"));
  assert.equal(await networkFailure.submit(), null);
  assert.equal(mapSignOutFailure(), "Atlas couldn't sign you out right now. Try again.");
  assert.equal(typeof requestSignOut, "function");
});

test("production project-library mode stays empty and separate from fixture authority", async () => {
  const [library, profile, shell, home, demo] = await Promise.all([
    readFile(new URL("../components/ProjectLibrary.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ProfileMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/AppShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/home/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo/page.tsx", import.meta.url), "utf8"),
  ]);
  const [{ shouldHydrateFixtureRegistry }, { getAuthenticatedHomeUser }] = await Promise.all([
    jiti.import("../components/project-library-mode.ts"),
    jiti.import("../lib/home-session.ts"),
  ]);

  assert.equal(shouldHydrateFixtureRegistry("production"), false);
  assert.equal(shouldHydrateFixtureRegistry("production", "owner-ready"), false);
  assert.equal(shouldHydrateFixtureRegistry("fixture", "owner-ready"), true);
  assert.equal(shouldHydrateFixtureRegistry("fixture", "viewer-ready"), false);
  assert.match(library, /import \{ shouldHydrateFixtureRegistry, type ProjectLibraryMode \} from "\.\/project-library-mode"/);
  assert.match(library, /mode === "fixture" && \(projectRole === "owner" \|\| projectRole === "editor"\)/);
  assert.match(library, /mode === "fixture" && projectRole === "owner"/);
  assert.match(library, /shouldHydrateFixtureRegistry\(mode, scenario\)/);
  assert.match(library, /projectRole\?: ProjectRole/);
  assert.match(profile, /projectRole && <p><strong>\{projectRole\}<\/strong> access<\/p>/);
  assert.doesNotMatch(profile, /user\.role/);
  assert.match(demo, /<ProjectLibrary mode="fixture" projectRole=\{scenario\.session\.role\}/);
  const requestHeaders = new Headers({ cookie: "better-auth.session_token=opaque" });
  let receivedHeaders;
  assert.deepEqual(await getAuthenticatedHomeUser(async ({ headers }) => {
    receivedHeaders = headers;
    return { user: { name: "Nadia Hartono", email: "nadia@example.test" } };
  }, requestHeaders), { name: "Nadia Hartono", email: "nadia@example.test" });
  assert.strictEqual(receivedHeaders, requestHeaders);
  assert.equal(await getAuthenticatedHomeUser(async () => null, requestHeaders), null);
  assert.match(home, /getAuthenticatedHomeIdentity\(service\.auth\.api\.getSession, requestHeaders\)/);
  assert.match(home, /listHomeProjectCards\(requestHeaders\)/);
  assert.match(home, /if \(!identity\) redirect\("\/sign-in"\)/);
  assert.match(home, /<ProductionProjectLibrary projects=\{await listHomeProjectCards\(requestHeaders\)\} user=\{identity\.user\} \/>/);
  assert.doesNotMatch(home, /@atlas\/fixtures|localStorage|sessionStorage|local-fixtures|role|jwt/i);
  assert.match(library, /homeHref=\{mode === "production" \? "\/home" : "\/demo"\}/);
  assert.match(library, /signOutMode=\{mode === "production" \? "session" : "fixture-link"\}/);
  assert.match(shell, /homeHref = "\/demo", signOutMode = "fixture-link"/);
  assert.match(shell, /<AtlasBrand href=\{homeHref\} \/>/);
  assert.match(shell, /href=\{homeHref\}/);
  assert.match(shell, /<ProfileMenu projectRole=\{projectRole\} signOutMode=\{signOutMode\} user=\{user\} \/>/);
  assert.match(profile, /signOutMode === "session" && <div className="profile-session-action">/);
  assert.match(profile, /createSignOutSubmission\(requestSignOut, \(\) => router\.replace\("\/sign-in"\)\)/);
  assert.match(profile, /disabled=\{isSigningOut\}/);
  assert.match(profile, /Signing out\.\.\./);
  assert.match(profile, /role="alert"/);
  assert.match(profile, /signOutMode === "fixture-link" && <Link href="\/sign-in"/);
  assert.doesNotMatch(profile, /showSignOut|document\.cookie|localStorage|sessionStorage|auth\.session|project_member/i);
});
