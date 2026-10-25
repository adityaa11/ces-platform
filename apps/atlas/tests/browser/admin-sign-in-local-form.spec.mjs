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

test("ASI successor integration validates, authenticates, and verifies the Admin identity", async ({ page }) => {
  const localEnv = readLocalEnv();
  expect(localEnv.ATLAS_ADMIN_EMAIL, "local Admin email is required for the real integration check").toBeTruthy();
  expect(localEnv.ATLAS_ADMIN_PASSWORD, "local Admin password is required for the real integration check").toBeTruthy();
  const credentialRequests = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (["/api/auth/sign-in/email", "/api/admin/identity"].includes(path)) credentialRequests.push(`${request.method()} ${path}`);
  });

  await page.goto("/admin/sign-in");
  await page.waitForFunction(() => Boolean(window.__VINEXT_HYDRATED_AT));
  const email = page.getByRole("textbox", { name: /Email address/ });
  const password = page.getByRole("textbox", { name: /Password/ });
  const submit = page.getByRole("button", { name: "Sign in to Admin Console", exact: true });

  await submit.click();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toContainText(["Enter your email address.", "Enter your password."]);
  await expect(email).toBeFocused();

  await email.fill("not-an-email");
  await password.fill("local-only-password");
  await submit.click();
  await expect(email).toHaveAccessibleDescription("Enter a valid email address.");
  await expect(password).not.toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();

  await email.fill(localEnv.ATLAS_ADMIN_EMAIL);
  await password.fill(localEnv.ATLAS_ADMIN_PASSWORD);
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("Admin access verified for Atlas Administrator.");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(submit).toBeEnabled();

  const storage = await page.evaluate(() => ({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }));
  expect(JSON.stringify(storage)).not.toContain(localEnv.ATLAS_ADMIN_PASSWORD);
  expect(credentialRequests).toEqual(["POST /api/auth/sign-in/email", "GET /api/admin/identity"]);
  await page.request.post("/api/auth/sign-out", { data: {} });
});
