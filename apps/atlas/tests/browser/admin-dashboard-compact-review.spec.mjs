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

async function expectClosedCompactState(page) {
  const menu = page.getByRole("button", { name: "Open navigation menu", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#admin-sidebar")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("body")).not.toHaveClass(/admin-navigation-locked/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
  return menu;
}

async function openDrawer(page, { assertFocus = true } = {}) {
  const menu = page.getByRole("button", { name: "Open navigation menu", exact: true });
  await menu.click();
  const closeMenu = page.getByRole("button", { name: "Close navigation menu", exact: true }).first();
  await expect(closeMenu).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#admin-sidebar")).not.toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("body")).toHaveClass(/admin-navigation-locked/);
  await expect.poll(() => page.locator("#admin-sidebar").evaluate((element) => Math.abs(new DOMMatrix(getComputedStyle(element).transform).m41))).toBeLessThan(1);
  if (assertFocus) await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeFocused();
}

test("AAD-008 renders and operates compact Dashboard navigation across themes, reflow, and reduced motion", async ({ page }, testInfo) => {
  const localEnv = readLocalEnv();
  expect(localEnv.ATLAS_ADMIN_EMAIL, "local Admin email is required for the rendered Dashboard review").toBeTruthy();
  expect(localEnv.ATLAS_ADMIN_PASSWORD, "local Admin password is required for the rendered Dashboard review").toBeTruthy();

  try {
    await signIn(page, localEnv.ATLAS_ADMIN_EMAIL, localEnv.ATLAS_ADMIN_PASSWORD);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Light theme", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const menu = await expectClosedCompactState(page);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(menu).toBeFocused();
    await expect.poll(() => menu.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("3px");
    await page.screenshot({ path: testInfo.outputPath("aad-008-light-390-closed.png"), fullPage: true });

    await openDrawer(page);
    const dashboard = page.getByRole("link", { name: "Dashboard", exact: true });
    await expect(dashboard).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Provider Profiles", { exact: true })).toBeVisible();
    await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Projects", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeDisabled();
    await page.keyboard.press("Shift+Tab");
    await expect(dashboard).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("aad-008-light-390-open.png"), fullPage: true });

    await dashboard.click();
    await expectClosedCompactState(page);

    await openDrawer(page);
    await page.locator(".admin-drawer-backdrop").click({ position: { x: 350, y: 80 } });
    await expectClosedCompactState(page);
    await expect(page.getByRole("button", { name: "Open navigation menu", exact: true })).toBeFocused();

    await openDrawer(page);
    await page.keyboard.press("Escape");
    await expectClosedCompactState(page);
    await expect(page.getByRole("button", { name: "Open navigation menu", exact: true })).toBeFocused();

    await page.getByRole("button", { name: "Dark theme", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await openDrawer(page);
    await page.screenshot({ path: testInfo.outputPath("aad-008-dark-390-open.png"), fullPage: true });
    await page.keyboard.press("Escape");

    await page.setViewportSize({ width: 640, height: 720 });
    await expectClosedCompactState(page);
    await openDrawer(page);
    await page.screenshot({ path: testInfo.outputPath("aad-008-dark-640-reflow-open.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation menu", exact: true })).toBeFocused();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openDrawer(page, { assertFocus: false });
    await expect.poll(() => page.locator("#admin-sidebar").evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.001);
    await page.screenshot({ path: testInfo.outputPath("aad-008-dark-640-reduced-motion-open.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await expectClosedCompactState(page);
    await expect(page.getByRole("button", { name: "Open navigation menu", exact: true })).toBeFocused();
  } finally {
    await page.request.post("/api/auth/sign-out", { data: {} }).catch(() => undefined);
  }
});
