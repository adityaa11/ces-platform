import { expect, test } from "@playwright/test";

test("ASI-002 keeps Admin sign-in local while exposing validation and password states", async ({ page }) => {
  const credentialRequests = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (["/api/auth/sign-in/email", "/api/admin/identity"].includes(path)) credentialRequests.push(`${request.method()} ${path}`);
  });

  await page.goto("/admin/sign-in");
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

  await email.fill("operator@example.test");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await submit.click();
  await expect(page.getByRole("status")).toHaveText("This is a UI-only prototype. Your credentials were not sent or stored.");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);

  await email.fill("operator+edited@example.test");
  await expect(page.getByRole("status")).toHaveCount(0);

  const visibility = page.getByRole("button", { name: "Show password", exact: true });
  await visibility.focus();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide password", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(password).toBeFocused();

  await page.getByRole("button", { name: "Hide password", exact: true }).focus();
  await page.keyboard.press(" ");
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Show password", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(password).toBeFocused();
  expect(credentialRequests).toEqual([]);
});
