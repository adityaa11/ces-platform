import { expect, test } from "@playwright/test";
import fs from "node:fs";

function readLocalEnv() {
  const values = {};
  const envPath = new URL("../../../../.env", import.meta.url);
  const source = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return { ...process.env, ...values };
}

async function signIn(page, email, password) {
  await page.goto("/admin/sign-in");
  await page.waitForFunction(() => Boolean(window.__VINEXT_HYDRATED_AT));
  await page.getByRole("textbox", { name: /Email address/ }).fill(email);
  await page.getByRole("textbox", { name: /Password/ }).fill(password);
  await page.getByRole("button", { name: "Sign in to Admin Console", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

async function expectDesktopReviewState(page, name) {
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Admin Console navigation" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Provider Profiles", { exact: true })).toBeVisible();
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Projects" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Settings" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: `Welcome, ${name}.`, exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
}

test("AAD-007 renders the authenticated desktop Dashboard with theme, keyboard, semantic, and constrained-width evidence", async ({ page }, testInfo) => {
  const localEnv = readLocalEnv();
  expect(localEnv.ATLAS_ADMIN_EMAIL, "local Admin email is required for the rendered Dashboard review").toBeTruthy();
  expect(localEnv.ATLAS_ADMIN_PASSWORD, "local Admin password is required for the rendered Dashboard review").toBeTruthy();

  const longName = "Alexandria Montgomery-Windsor the Authorized Atlas Platform Administrator";
  try {
    await signIn(page, localEnv.ATLAS_ADMIN_EMAIL, localEnv.ATLAS_ADMIN_PASSWORD);
    const identityResponse = await page.request.get("/api/admin/identity");
    expect(identityResponse.ok()).toBe(true);
    const identity = await identityResponse.json();
    expect(identity?.user?.name).toEqual(expect.any(String));
    await expect(page.getByRole("heading", { name: `Welcome, ${identity.user.name}.`, exact: true })).toBeVisible();

    // AAD-005 proves that this heading receives the persisted authorized name.
    // This isolated substitution exercises the shared long-name fit policy
    // without mutating the durable Admin account used by the live app.
    await page.locator(".admin-welcome-card h2").evaluate((element, value) => { element.textContent = `Welcome, ${value}.`; }, longName);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Light theme", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Light theme", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expectDesktopReviewState(page, longName);
    await page.screenshot({ path: testInfo.outputPath("aad-007-light-1440.png"), fullPage: true });

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Dark theme", exact: true })).toBeFocused();
    await expect.poll(() => page.getByRole("button", { name: "Dark theme", exact: true }).evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("3px");

    await page.getByRole("button", { name: "Dark theme", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Dark theme", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("dark");
    await expectDesktopReviewState(page, longName);
    await page.screenshot({ path: testInfo.outputPath("aad-007-dark-1440.png"), fullPage: true });

    await page.setViewportSize({ width: 900, height: 1000 });
    await expectDesktopReviewState(page, longName);
    await page.screenshot({ path: testInfo.outputPath("aad-007-dark-900.png"), fullPage: true });
  } finally {
    await page.request.post("/api/auth/sign-out", { data: {} }).catch(() => undefined);
  }
});
