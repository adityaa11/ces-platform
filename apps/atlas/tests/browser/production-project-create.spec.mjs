import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { createJiti } from "jiti";
import { test, expect } from "@playwright/test";

const pdf = { name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nPCC-005 browser regression") };
const sizes = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
  // CSS viewport equivalent to a 1280px desktop at 200% browser zoom.
  { name: "reflow", width: 640, height: 720 },
];

async function capture(page, info, state) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dialog = page.getByRole("dialog");
  if (await dialog.count()) {
    await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath(`${state}.png`), fullPage: true });
}

async function libraryReady(page) {
  // SSR buttons precede hydration. The library's layout effect establishes its usable card width.
  await expect.poll(() => page.locator(".project-grid").evaluate((element) => element.style.getPropertyValue("--project-card-width"))).not.toBe("");
}

async function fillProduction(page, projectId) {
  await page.getByLabel(/^Project ID/).fill(projectId);
  await page.getByLabel(/^Project Name/).fill("PCC browser project");
  await page.getByLabel(/^Project Description/).fill("Server-backed browser regression");
  await page.getByLabel(/^PRD PDFs/).setInputFiles(pdf);
}

async function retainedInputs(page, projectId) {
  await expect(page.getByLabel(/^Project ID/)).toHaveValue(projectId);
  await expect(page.getByLabel(/^Project Name/)).toHaveValue("PCC browser project");
  await expect(page.getByLabel(/^Project Description/)).toHaveValue("Server-backed browser regression");
  expect(await page.getByLabel(/^PRD PDFs/).evaluate((element) => [...element.files].map((file) => file.name))).toEqual(["brief.pdf"]);
  await expect(page.getByRole("button", { name: "Create project", exact: true })).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
}

for (const theme of ["light", "dark"]) {
  for (const size of sizes) {
    test(`PCC-005 production transitions ${theme} ${size.name}`, async ({ page, context }, info) => {
      expect(process.env.ATLAS_DOCKER, "browser checkpoint must run inside Compose").toBe("true");
      expect(process.env.DATABASE_URL, "real authenticated /home integration requires PostgreSQL").toBeTruthy();
      const admin = postgres(process.env.DATABASE_URL, { max: 1 });
      const suffix = randomUUID().slice(0, 12);
      const projectId = `pcc-browser-${suffix}`;
      const email = `${projectId}@example.test`;
      const fixtureRequests = [];
      const posts = [];
      let homeReads = 0;
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/api/local-fixtures") fixtureRequests.push(request.method());
        if (url.pathname === "/api/projects" && request.method() === "POST") posts.push(request);
        if (url.pathname === "/home") homeReads += 1;
      });
      try {
        await page.setViewportSize({ width: size.width, height: size.height });
        await context.addInitScript((value) => localStorage.setItem("atlas-theme", value), theme);
        const signedUp = await context.request.post("/api/auth/sign-up/email", {
          headers: { origin: "http://localhost:3001" },
          data: { name: "PCC browser user", email, password: "pcc-browser-local-password" },
        });
        expect(signedUp.status()).toBe(200);
        await page.goto("/home");
        await libraryReady(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByText("No projects yet", { exact: true })).toBeVisible();
        const newProject = page.getByRole("button", { name: "+ New project", exact: true });
        await expect(page.locator(".library-heading-row").getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
        await expect(page.locator(".library-heading-row").getByRole("button", { name: "+ New project" })).toBeVisible();
        await newProject.hover();
        await capture(page, info, "empty-hover");
        await newProject.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: "Create a project" });
        await expect(dialog).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(page.getByRole("button", { name: "Create project", exact: true })).toBeFocused();
        await capture(page, info, "dialog-keyboard-focus");
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(newProject).toBeFocused();
        await newProject.click();
        await page.locator(".dialog-backdrop").click({ position: { x: 2, y: 2 } });
        await expect(dialog).toHaveCount(0);
        await newProject.click();
        const submit = page.getByRole("button", { name: "Create project", exact: true });
        await submit.click();
        await expect(dialog.getByRole("alert")).toHaveCount(3);
        await expect(page.getByLabel(/^Project ID/)).toHaveAttribute("aria-invalid", "true");
        await expect(page.getByLabel(/^Project ID/)).toHaveAccessibleDescription(/Enter a project ID/);
        expect(posts).toHaveLength(0);
        await capture(page, info, "validation-error");
        await fillProduction(page, projectId);
        const baselineReads = homeReads;

        // Hold the actual component's first fetch so loading and duplicate protection are observable.
        let release;
        const gate = new Promise((resolve) => { release = resolve; });
        await page.route("**/api/projects", async (route) => {
          await gate;
          await route.fulfill({ status: 409, json: { error: "private database detail" } });
        }, { times: 1 });
        await submit.click();
        await expect.poll(() => posts.length).toBe(1);
        await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
        for (const label of [/^Project ID/, /^Project Name/, /^Project Description/, /^PRD PDFs/]) await expect(page.getByLabel(label)).toBeDisabled();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Close dialog" }).click();
        await expect(dialog).toBeVisible();
        expect(posts).toHaveLength(1);
        await capture(page, info, "loading-disabled");
        release();
        await expect(dialog.getByRole("alert")).toHaveText("That project ID is already in use.");
        await expect(page.getByLabel(/^Project ID/)).toHaveAttribute("aria-invalid", "true");
        await retainedInputs(page, projectId);
        await capture(page, info, "field-error");

        for (const [status, body, message, field] of [
          [413, {}, "The project upload is too large.", "files"],
          [415, {}, "Only PDF files can be added.", "files"],
          [400, {}, "Review the project details and try again.", "form"],
          [500, { error: "private database detail" }, "Unable to create the project. Please try again.", "form"],
          [201, { project: { name: "Untrusted incomplete project" } }, "The project response was incomplete. Please try again.", "form"],
        ]) {
          await page.route("**/api/projects", (route) => route.fulfill({ status, json: body }), { times: 1 });
          await submit.click();
          await expect(dialog.getByRole("alert")).toHaveText(message);
          if (field === "files") await expect(page.getByLabel(/^PRD PDFs/)).toHaveAccessibleDescription(new RegExp(message.replaceAll(".", "\\.")));
          await retainedInputs(page, projectId);
          expect(homeReads, "failure or malformed success must not call router.refresh").toBe(baselineReads);
          await expect(page.getByRole("article")).toHaveCount(0);
          await expect(page.locator("body")).not.toContainText("private database detail");
          if (status === 500 || status === 201) await capture(page, info, status === 500 ? "request-error" : "malformed-success");
        }

        // No route mock now: the same mounted dialog retries against the production API.
        const createdResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/projects" && response.request().method() === "POST");
        await submit.click();
        expect((await createdResponse).status()).toBe(201);
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole("status")).toHaveText("PCC browser project was created. Its PRDs are waiting for extraction.");
        await expect.poll(() => homeReads).toBeGreaterThan(baselineReads);
        const card = page.getByRole("article", { name: "PCC browser project" });
        await expect(card).toBeVisible();
        for (const text of ["Waiting for extraction", "No published work", "0 of 1 PRDs processed", "0%", "PRDs uploaded"]) await expect(card).toContainText(text);
        await expect(card.locator(".repository-master-state .repository-state-icon")).toBeVisible();
        await expect(card.locator(".repository-metrics > div")).toHaveCount(3);
        await expect(card.locator(".repository-metrics div").filter({ hasText: "PRDs uploaded" }).locator("dd")).toHaveText("1");
        await expect(card.getByRole("button", { name: /Workspace unavailable/ })).toBeDisabled();
        await expect(card.locator('a[href^="/demo"]')).toHaveCount(0);
        await expect(card.getByRole("button", { name: /Sharing unavailable/ })).toBeDisabled();
        await expect(page.locator("body")).not.toContainText("Extraction has started");
        expect(fixtureRequests).toEqual([]);
        for (const request of posts) {
          expect(request.headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
        }
        await capture(page, info, "success-waiting-card");
        await newProject.click();
        for (const label of [/^Project ID/, /^Project Name/, /^Project Description/]) await expect(page.getByLabel(label)).toHaveValue("");
        expect(await page.getByLabel(/^PRD PDFs/).evaluate((element) => element.files.length)).toBe(0);
        await expect(dialog.getByRole("alert")).toHaveCount(0);
        await page.keyboard.press("Escape");
        await page.reload();
        await expect(card).toBeVisible();
        const rows = await admin`SELECT stable_id FROM atlas.project WHERE stable_id=${projectId}`;
        expect(rows).toHaveLength(1);
      } finally {
        await admin`DELETE FROM atlas.project WHERE stable_id=${projectId}`;
        await admin`DELETE FROM auth."user" WHERE email=${email}`;
        await admin.end();
      }
    });
  }
}

test("PCC-005 fixture creation, simulated processing, sharing and scenario hydration stay distinct", async ({ page, context }, info) => {
  const { getFixtureScenario } = await createJiti(import.meta.url).import("@atlas/fixtures");
  const fixtureCards = getFixtureScenario("owner-ready").projects;
  await context.addInitScript(() => { if (!localStorage.getItem("atlas-theme")) localStorage.setItem("atlas-theme", "light"); });
  let productionPosts = 0;
  let fixturePosts = 0;
  let fixtureReads = 0;
  page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/projects") productionPosts += 1; });
  // Isolate fixture persistence only. The actual fixture component and createFixtureProject execute.
  await page.route("**/api/local-fixtures", async (route) => {
    if (route.request().method() === "GET") {
      fixtureReads += 1;
      await route.fulfill({ json: { cards: fixtureCards, modalProjects: [] } });
      return;
    }
    expect(route.request().method()).toBe("POST");
    fixturePosts += 1;
    const body = route.request().postDataJSON();
    expect(body.files[0].base64).toBe(pdf.buffer.toString("base64"));
    expect(body.project.id).toBe("pcc-fixture-browser");
    await route.fulfill({ json: body });
  });
  await page.goto("/demo?scenario=empty-library");
  await libraryReady(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByText("No projects yet", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+ New project" }).click();
  await page.getByLabel(/^Project ID/).fill("pcc-fixture-browser");
  await page.getByLabel(/^Project Name/).fill("Fixture browser project");
  await page.getByLabel(/^PRD PDFs/).setInputFiles(pdf);
  await expect(page.getByText(/Files and processing are simulated/)).toBeVisible();
  await page.getByRole("button", { name: "Create and process" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".processing-notice")).toContainText("Extraction has started");
  await expect(page.getByRole("article", { name: "Fixture browser project" })).toBeVisible();
  expect(fixturePosts).toBe(1);
  expect(fixtureReads).toBe(0);
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(page.locator(".processing-notice")).toHaveCount(0);
  await page.goto("/demo?scenario=owner-ready");
  await libraryReady(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => fixtureReads).toBeGreaterThan(0);
  const card = page.getByRole("article").first();
  await expect(card.locator('a[href^="/demo?"]')).toHaveCount(1);
  await card.getByRole("button", { name: /Share/ }).click();
  await page.getByLabel("Email", { exact: true }).fill("pcc-invite@example.test");
  await page.locator(".invite-form").getByRole("combobox").selectOption("editor");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  const invited = page.locator(".collaborator").filter({ hasText: "pcc-invite@example.test" });
  await expect(invited).toContainText("Invite sent");
  await invited.getByRole("combobox").selectOption("viewer");
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(invited.getByRole("combobox")).toHaveValue("viewer");
  await invited.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Confirm change" }).click();
  await expect(invited).toContainText("Access removed");
  await page.keyboard.press("Escape");
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => localStorage.setItem("atlas-theme", value), theme);
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.reload();
      await libraryReady(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await capture(page, info, `fixture-library-${theme}-${size.name}`);
      await page.getByRole("button", { name: "+ New project" }).click();
      await expect(page.getByRole("dialog", { name: "Create a project" })).toBeVisible();
      await capture(page, info, `fixture-dialog-${theme}-${size.name}`);
      await page.getByRole("button", { name: "Close dialog" }).click();
    }
  }
  expect(productionPosts).toBe(0);
});
