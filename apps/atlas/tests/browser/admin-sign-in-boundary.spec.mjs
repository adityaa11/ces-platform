import { expect, test } from "@playwright/test";

const authPaths = new Set(["/api/auth/sign-in/email", "/api/admin/identity"]);

function observeAuthRequests(page) {
  const requests = [];
  page.on("request", (request) => {
    if (authPaths.has(new URL(request.url()).pathname)) requests.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });
  return requests;
}

async function expectOnlyAtlasThemeCookie(page, expectedTheme) {
  const cookies = await page.context().cookies();
  expect(cookies.map(({ name }) => name)).toEqual(["atlas-theme"]);
  expect(cookies[0]).toMatchObject({ name: "atlas-theme", value: expectedTheme });
}

test("ASI-003 directly renders and refreshes the isolated Admin sign-in route", async ({ page }) => {
  const initialResponse = await page.goto("/admin/sign-in");
  expect(initialResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByLabel("Atlas Admin Console")).toBeVisible();

  const refreshedResponse = await page.reload();
  expect(refreshedResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("ASI-003 preserves the shared theme authority and does not persist credentials", async ({ page }) => {
  const authRequests = observeAuthRequests(page);
  const passwordValue = "local-ui-boundary-value";
  const consoleMessages = [];
  page.on("console", (message) => consoleMessages.push(message.text()));

  await page.goto("/admin/sign-in");
  await page.waitForFunction(() => Boolean(window.__VINEXT_HYDRATED_AT));
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /^(light|dark)$/);
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  expect(await page.context().cookies()).toEqual([]);
  await page.getByRole("textbox", { name: /Email address/ }).fill("operator@example.test");
  await page.getByRole("textbox", { name: /Password/ }).fill(passwordValue);

  const storage = await page.evaluate(() => ({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }));
  expect(JSON.stringify(storage)).not.toContain(passwordValue);
  expect(consoleMessages.join("\n")).not.toContain(passwordValue);
  expect(authRequests).toEqual([]);

  await page.getByRole("button", { name: "Light theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("atlas-admin-login-theme"))).toBeNull();
  await expectOnlyAtlasThemeCookie(page, "light");

  await expect((await page.reload())?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Light theme", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("dark");
  await expectOnlyAtlasThemeCookie(page, "dark");
});

test("ASI-003 preserves public entry routes without Admin Console navigation", async ({ page }) => {
  const publicRoutes = [
    ["/", "Project understanding, made visible."],
    ["/sign-in", "Welcome back"],
    ["/sign-up", "Create your Atlas account"],
  ];

  for (const [pathname, expectedCopy] of publicRoutes) {
    const response = await page.goto(pathname);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(expectedCopy, { exact: true })).toBeVisible();
    await expect(page.locator('a[href="/admin/sign-in"]')).toHaveCount(0);
    await expect(page.getByText("Admin Console", { exact: true })).toHaveCount(0);
  }

  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "New to Atlas? Create an account", exact: true })).toBeVisible();

  await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Already have an account? Sign in", exact: true })).toBeVisible();
});
