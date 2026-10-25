import { expect, test } from "@playwright/test";

const signInPath = "**/api/auth/sign-in/email";
const identityPath = "**/api/admin/identity";
const signOutPath = "**/api/auth/sign-out";

async function openReadyForm(page) {
  await page.goto("/admin/sign-in");
  await page.waitForFunction(() => Boolean(window.__VINEXT_HYDRATED_AT));
  await page.getByRole("textbox", { name: /Email address/ }).fill("admin@example.test");
  await page.getByRole("textbox", { name: /Password/ }).fill("browser-test-password");
}

test("AAD-006 replaces Admin sign-in only after a verified Admin identity", async ({ page }) => {
  const dashboardRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/admin/dashboard") dashboardRequests.push(request.url());
  });
  await page.route(signInPath, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route(identityPath, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ user: { id: "admin-1", email: "admin@example.test", name: "Atlas Administrator" }, role: "admin" }),
  }));

  await openReadyForm(page);
  await page.getByRole("button", { name: "Sign in to Admin Console", exact: true }).click();
  await expect.poll(() => dashboardRequests.length).toBe(1);
  expect(new URL(dashboardRequests[0]).pathname).toBe("/admin/dashboard");
});

test("AAD-006 does not navigate for invalid credentials or unverified Admin identity outcomes", async ({ page }) => {
  const dashboardRequests = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest() && new URL(request.url()).pathname === "/admin/dashboard") dashboardRequests.push(request.url());
  });

  await page.route(signOutPath, (route) => route.fulfill({ status: 204 }));
  const scenarios = [
    {
      name: "invalid credentials",
      signIn: { status: 401, body: {} },
      expected: "Atlas couldn't sign you in right now. Check your email and password, then try again.",
    },
    {
      name: "identity 401",
      signIn: { status: 200, body: {} },
      identity: { status: 401, body: {} },
      expected: "Your Admin session could not be verified. Please sign in again.",
    },
    {
      name: "identity 403 with cleanup",
      signIn: { status: 200, body: {} },
      identity: { status: 403, body: {} },
      expected: "This account is not authorized for Atlas administration.",
      cleanup: true,
    },
    {
      name: "malformed identity",
      signIn: { status: 200, body: {} },
      identity: { status: 200, body: { user: { id: "admin-1" }, role: "admin" } },
      expected: "Atlas couldn't verify your Admin session right now. Please try again.",
    },
    {
      name: "identity server failure",
      signIn: { status: 200, body: {} },
      identity: { status: 500, body: {} },
      expected: "Atlas couldn't verify your Admin session right now. Please try again.",
    },
  ];

  for (const scenario of scenarios) {
    let cleanupRequests = 0;
    await page.route(signInPath, (route) => route.fulfill({ status: scenario.signIn.status, contentType: "application/json", body: JSON.stringify(scenario.signIn.body) }));
    if (scenario.identity) {
      await page.route(identityPath, (route) => route.fulfill({ status: scenario.identity.status, contentType: "application/json", body: JSON.stringify(scenario.identity.body) }));
    }
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/auth/sign-out") cleanupRequests += 1;
    });

    await openReadyForm(page);
    await page.getByRole("button", { name: "Sign in to Admin Console", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(scenario.expected);
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    expect(cleanupRequests, scenario.name).toBe(scenario.cleanup ? 1 : 0);
    await page.unroute(signInPath);
    if (scenario.identity) await page.unroute(identityPath);
  }

  expect(dashboardRequests).toEqual([]);
});

test("AAD-006 keeps the form disabled and coalesces the in-flight verified submission", async ({ page }) => {
  let releaseIdentity;
  let signInRequests = 0;
  let identityRequests = 0;
  const pendingIdentity = new Promise((resolve) => { releaseIdentity = resolve; });
  await page.route(signInPath, (route) => {
    signInRequests += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route(identityPath, async (route) => {
    identityRequests += 1;
    await pendingIdentity;
    await route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
  });

  await openReadyForm(page);
  const submit = page.getByRole("button", { name: "Sign in to Admin Console", exact: true });
  await submit.click();
  await expect(page.getByRole("button", { name: "Signing in…", exact: true })).toBeDisabled();
  await expect.poll(() => signInRequests).toBe(1);
  await expect.poll(() => identityRequests).toBe(1);

  releaseIdentity();
  await expect(page.getByRole("alert")).toHaveText("Your Admin session could not be verified. Please sign in again.");
  await expect(page.getByRole("button", { name: "Sign in to Admin Console", exact: true })).toBeEnabled();
  expect(signInRequests).toBe(1);
  expect(identityRequests).toBe(1);
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});

test("AAD-006 leaves public sign-in and sign-up navigation unchanged", async ({ page }) => {
  for (const [path, heading, button] of [
    ["/sign-in", "Welcome back", "Sign in"],
    ["/sign-up", "Create your Atlas account", "Create account"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: button, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('a[href="/admin/sign-in"]')).toHaveCount(0);
  }
});
