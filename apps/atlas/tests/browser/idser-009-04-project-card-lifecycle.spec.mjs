import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { test, expect } from "@playwright/test";

const origin = "http://localhost:3001";
const sizes = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
  // CSS viewport equivalent to a 1280px browser at 200% zoom.
  { name: "reflow", width: 640, height: 720 },
];

async function signUp(request, name, email) {
  const response = await request.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: { name, email, password: "idser-009-04-local-password" },
  });
  expect(response.status()).toBe(200);
}

async function createPersistedProject(sql, ownerId, prefix, state, options = {}) {
  const projectId = randomUUID();
  const masterId = randomUUID();
  const draftId = randomUUID();
  const bundleId = randomUUID();
  const documentCount = options.documentCount ?? 2;
  const stableId = options.stableId ?? `${prefix}-${state.replaceAll("_", "-")}-${randomUUID().slice(0, 8)}`;
  const name = options.name ?? `${state.replaceAll("_", " ")} project`;
  const description = options.description ?? "Persisted lifecycle evidence for the authenticated production home.";
  await sql.unsafe("INSERT INTO atlas.project (id,stable_id,name,description,created_by_user_id) VALUES ($1,$2,$3,$4,$5)", [projectId, stableId, name, description, ownerId]);
  await sql.unsafe("INSERT INTO atlas.project_member (project_id,user_id,role) VALUES ($1,$2,'owner')", [projectId, ownerId]);
  await sql.unsafe("INSERT INTO atlas.workspace (id,project_id,kind,state,display_name) VALUES ($1,$2,'master','empty','Master'),($3,$2,'initial_draft',$4,'Initial Draft')", [masterId, projectId, draftId, state === "ready_for_review" ? "ready_for_review" : "draft"]);
  const documents = Array.from({ length: documentCount }, () => randomUUID());
  for (const [index, documentId] of documents.entries()) {
    await sql.unsafe("INSERT INTO atlas.document (id,project_id,workspace_id,original_filename,storage_key,source_sha256,byte_size,media_type,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,1,'application/pdf',$7)", [documentId, projectId, draftId, `${index + 1}.pdf`, `private/${documentId}`, "a".repeat(64), ownerId]);
  }
  if (state === "legacy") return { projectId, stableId, documents };
  await sql.unsafe("INSERT INTO atlas.extraction_bundle (id,project_id,workspace_id,state,semantic_contract_version,reconciliation_contract_version,expected_document_count,completed_document_count) VALUES ($1,$2,$3,'waiting','v1','v1',$4,0)", [bundleId, projectId, draftId, documentCount]);
  for (const [index, documentId] of documents.entries()) {
    const memberState = state === "ready_for_review" ? "completed" : state === "needs_attention" && index === 0 ? "needs_attention" : state === "processing" && index === 0 ? "perceiving" : "pending";
    await sql.unsafe("INSERT INTO atlas.extraction_bundle_document (bundle_id,document_id,project_id,workspace_id,sequence,state,started_at,completed_at,last_failure_code,last_failure_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [bundleId, documentId, projectId, draftId, index + 1, memberState, memberState === "pending" ? null : new Date(), memberState === "completed" ? new Date() : null, memberState === "needs_attention" ? "private provider failure" : null, memberState === "needs_attention" ? new Date() : null]);
  }
  if (state !== "waiting") await sql.unsafe("UPDATE atlas.extraction_bundle SET state=$2, completed_document_count=$3, started_at=now(), completed_at=$4, last_failure_code=$5, last_failure_at=$6 WHERE id=$1", [bundleId, state, state === "ready_for_review" ? documentCount : 0, state === "ready_for_review" ? new Date() : null, state === "needs_attention" ? "technical_failure" : null, state === "needs_attention" ? new Date() : null]);
  return { projectId, stableId, bundleId, documents };
}

async function markSemanticUncertainty(sql, project, documentId) {
  const executionId = randomUUID();
  const resultId = randomUUID();
  await sql.unsafe("INSERT INTO atlas.semantic_execution (id,project_id,workspace_id,bundle_id,document_id,stage,contract_version,skill_version,logical_identity,lifecycle,authorized_context_identity,authorized_context_fingerprint,capability_valid_until,completion_fingerprint,completed_at) VALUES ($1,$2,(SELECT workspace_id FROM atlas.extraction_bundle WHERE id=$3),$3,$4,'extraction','v1','v1',$5,'completed','internal','fixture',now(),'complete',now())", [executionId, project.projectId, project.bundleId, documentId, `idser-009-04-semantic-${executionId}`]);
  await sql.unsafe("INSERT INTO atlas.semantic_extraction_result (id,execution_id,project_id,workspace_id,bundle_id,document_id,contract_version,source_sha256,provider_provenance,result_json,completion_fingerprint) VALUES ($1,$2,$3,(SELECT workspace_id FROM atlas.extraction_bundle WHERE id=$4),$4,$5,'v1',$6,'{}','{}','complete')", [resultId, executionId, project.projectId, project.bundleId, documentId, "a".repeat(64)]);
  await sql.unsafe("INSERT INTO atlas.semantic_candidate (id,extraction_result_id,project_id,workspace_id,bundle_id,document_id,semantic_key,kind,payload,normalized_meaning,needs_resolution,state) VALUES ($1,$2,$3,(SELECT workspace_id FROM atlas.extraction_bundle WHERE id=$4),$4,$5,'idser-009-04-uncertainty','fact','{}','bounded uncertainty',true,'candidate')", [randomUUID(), resultId, project.projectId, project.bundleId, documentId]);
}

async function assertNoOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => page.locator(".project-grid").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
}

async function deletePersistedProjects(sql, prefix) {
  const projectIds = "SELECT id FROM atlas.project WHERE stable_id LIKE $1";
  const params = [`${prefix}%`];
  await sql.unsafe(`DELETE FROM atlas.knowledge_index WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe(`DELETE FROM atlas.semantic_candidate WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe(`DELETE FROM atlas.reconciliation_relationship WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe(`DELETE FROM atlas.semantic_reconciliation_result WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe(`DELETE FROM atlas.semantic_extraction_result WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe(`DELETE FROM atlas.semantic_execution WHERE project_id IN (${projectIds})`, params);
  await sql.unsafe("DELETE FROM atlas.project WHERE stable_id LIKE $1", params);
}

test("IDSER-009-04 keeps authenticated persisted lifecycle cards scoped, refreshed, safe, and unavailable", async ({ browser }) => {
  expect(process.env.ATLAS_DOCKER, "browser checkpoint must run inside Compose").toBe("true");
  expect(process.env.DATABASE_URL, "browser checkpoint requires PostgreSQL").toBeTruthy();
  const admin = postgres(process.env.DATABASE_URL, { max: 1 });
  const suffix = randomUUID().slice(0, 10);
  const ownerEmail = `idser-009-04-owner-${suffix}@example.test`;
  const otherEmail = `idser-009-04-other-${suffix}@example.test`;
  const owner = await browser.newContext({ viewport: sizes[0] });
  const other = await browser.newContext({ viewport: sizes[0] });
  const ownerPage = await owner.newPage();
  const otherPage = await other.newPage();
  const prefix = `i904-${suffix}`;
  const created = [];
  try {
    await signUp(owner.request, "IDSER lifecycle owner", ownerEmail);
    await signUp(other.request, "IDSER lifecycle outsider", otherEmail);
    const [ownerRow] = await admin.unsafe('SELECT id FROM auth."user" WHERE email=$1', [ownerEmail]);
    const ownerId = ownerRow.id;
    created.push(
      await createPersistedProject(admin, ownerId, prefix, "legacy"),
      await createPersistedProject(admin, ownerId, prefix, "waiting"),
      await createPersistedProject(admin, ownerId, prefix, "processing"),
      await createPersistedProject(admin, ownerId, prefix, "needs_attention"),
      await createPersistedProject(admin, ownerId, prefix, "ready_for_review"),
      await createPersistedProject(admin, ownerId, prefix, "ready_for_review", { name: "semantic uncertainty project" }),
      await createPersistedProject(admin, ownerId, prefix, "waiting", { name: "invalid lifecycle project" }),
      await createPersistedProject(admin, ownerId, prefix, "waiting", {
        name: "MIXEDCase_".repeat(8),
        description: "UnbrokenDescription".repeat(16),
      }),
    );

    const fixtureRequests = [];
    ownerPage.on("request", (request) => { if (new URL(request.url()).pathname === "/api/local-fixtures") fixtureRequests.push(request.url()); });
    const semanticReady = created[5];
    const invalid = created[6];
    await markSemanticUncertainty(admin, semanticReady, semanticReady.documents[0]);
    // Contradictory persisted lifecycle data must be withheld, never guessed at.
    await admin.unsafe("UPDATE atlas.extraction_bundle SET completed_document_count=1 WHERE id=$1", [invalid.bundleId]);
    await ownerPage.goto("/home");
    await expect(ownerPage.getByRole("article")).toHaveCount(7);
    for (const [name, status, progress] of [
      ["legacy project", "Waiting for extraction", "0 of 2 PRDs processed"],
      ["waiting project", "Waiting for extraction", "0 of 2 PRDs processed"],
      ["processing project", "Extracting", "0 of 2 PRDs processed"],
      ["needs attention project", "Needs attention", "0 of 2 PRDs processed"],
      ["ready for review project", "Ready for review", "2 of 2 PRDs processed"],
    ]) {
      const card = ownerPage.getByRole("article", { name });
      await expect(card).toContainText(status);
      await expect(card.getByRole("progressbar")).toHaveAccessibleName(`Extraction progress: ${progress}`);
      await expect(card).toContainText("No published work");
      await expect(card.locator(".repository-metrics").getByText("published facts", { exact: true }).locator("..").getByRole("definition")).toHaveText("0");
      await expect(card.getByRole("button", { name: /Workspace unavailable/ })).toBeDisabled();
      await expect(card.getByRole("button", { name: /Sharing unavailable/ })).toBeDisabled();
      await expect(card.locator('a, [href*="/demo"]')).toHaveCount(0);
    }
    await expect(ownerPage.getByRole("article", { name: "needs attention project" })).toContainText("Processing needs attention.");
    await expect(ownerPage.getByRole("article", { name: "semantic uncertainty project" })).toContainText("Ready for review");
    await expect(ownerPage.getByRole("article", { name: "semantic uncertainty project" })).toContainText("Semantic uncertainty");
    await expect(ownerPage.getByRole("article", { name: "invalid lifecycle project" })).toHaveCount(0);
    await expect(ownerPage.locator("body")).not.toContainText("private provider failure");
    expect(fixtureRequests).toEqual([]);

    await otherPage.goto("/home");
    await expect(otherPage.getByText("No projects yet", { exact: true })).toBeVisible();
    await expect(otherPage.locator("body")).not.toContainText(prefix);

    const waiting = created[1];
    await admin.unsafe("UPDATE atlas.extraction_bundle SET state='processing', started_at=now() WHERE id=$1", [waiting.bundleId]);
    await admin.unsafe("UPDATE atlas.extraction_bundle_document SET state='perceiving', started_at=now() WHERE bundle_id=$1 AND document_id=$2", [waiting.bundleId, waiting.documents[0]]);
    await ownerPage.reload();
    await expect(ownerPage.getByRole("article", { name: "waiting project" })).toContainText("Extracting");
    await admin.unsafe("UPDATE atlas.extraction_bundle_document SET state='completed', completed_at=now() WHERE bundle_id=$1 AND document_id=$2", [waiting.bundleId, waiting.documents[0]]);
    await admin.unsafe("UPDATE atlas.extraction_bundle SET completed_document_count=1 WHERE id=$1", [waiting.bundleId]);
    await ownerPage.reload();
    await expect(ownerPage.getByRole("article", { name: "waiting project" })).toContainText("1 of 2 PRDs processed");
    await admin.unsafe("UPDATE atlas.extraction_bundle_document SET state='completed', completed_at=now() WHERE bundle_id=$1", [waiting.bundleId]);
    await admin.unsafe("UPDATE atlas.workspace SET state='ready_for_review' WHERE project_id=$1 AND kind='initial_draft'", [waiting.projectId]);
    await admin.unsafe("UPDATE atlas.extraction_bundle SET state='ready_for_review', completed_document_count=2, completed_at=now() WHERE id=$1", [waiting.bundleId]);
    await ownerPage.reload();
    const refreshed = ownerPage.getByRole("article", { name: "waiting project" });
    await expect(refreshed).toContainText("Ready for review");
    await expect(refreshed.getByRole("progressbar")).toHaveAttribute("value", "100");
  } finally {
    await deletePersistedProjects(admin, prefix);
    await admin.unsafe('DELETE FROM auth."user" WHERE email=$1 OR email=$2', [ownerEmail, otherEmail]);
    await Promise.all([owner.close(), other.close(), admin.end()]);
  }
});

test("IDSER-009-04 records the production card visual and keyboard matrix across themes and shell widths", async ({ browser }, info) => {
  const admin = postgres(process.env.DATABASE_URL, { max: 1 });
  const suffix = randomUUID().slice(0, 10);
  const email = `idser-009-04-visual-${suffix}@example.test`;
  const context = await browser.newContext();
  const page = await context.newPage();
  const prefix = `i904v-${suffix}`;
  const maximumId = `${prefix}-${"a".repeat(48 - prefix.length - 1)}`;
  try {
    await signUp(context.request, "IDSER visual owner", email);
    const [owner] = await admin.unsafe('SELECT id FROM auth."user" WHERE email=$1', [email]);
    await Promise.all([
      ...["waiting", "processing", "needs_attention", "ready_for_review"].map((state) => createPersistedProject(admin, owner.id, prefix, state)),
      createPersistedProject(admin, owner.id, prefix, "waiting", {
        stableId: maximumId,
        name: "MixedCase".repeat(8) + "MiXeCaSe",
        description: ("MixedCaseUnbrokenDescription".repeat(11)).slice(0, 280),
      }),
    ]);
    for (const theme of ["light", "dark"]) {
      await context.addInitScript((value) => localStorage.setItem("atlas-theme", value), theme);
      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.goto("/home");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByRole("article")).toHaveCount(5);
        const maximumCard = page.getByRole("article", { name: "MixedCase".repeat(8) + "MiXeCaSe" });
        await expect(maximumCard).toContainText(`project-id: ${maximumId}`);
        await expect(maximumCard).toContainText(("MixedCaseUnbrokenDescription".repeat(11)).slice(0, 280));
        await assertNoOverflow(page);
        const newProject = page.getByRole("button", { name: "+ New project", exact: true });
        await newProject.focus();
        await expect(newProject).toBeFocused();
        await expect(newProject).toHaveCSS("outline-style", /solid|auto/);
        if (size.width >= 960) {
          const sidebar = page.getByRole("button", { name: "Collapse sidebar" });
          await sidebar.click();
          await expect(page.locator(".app-shell")).toHaveClass(/sidebar-collapsed/);
          await assertNoOverflow(page);
          await page.screenshot({ path: info.outputPath(`project-cards-${theme}-${size.name}-collapsed.png`), fullPage: true });
          await page.getByRole("button", { name: "Expand sidebar" }).click();
          await expect(page.locator(".app-shell")).not.toHaveClass(/sidebar-collapsed/);
          await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
          await expect.poll(() => page.locator(".app-shell").evaluate((element) => getComputedStyle(element).gridTemplateColumns)).toMatch(/^256px /);
          await assertNoOverflow(page);
        } else {
          const menu = page.getByRole("button", { name: "Open navigation menu" });
          await menu.focus();
          await page.keyboard.press("Enter");
          await expect(page.getByRole("button", { name: "Close navigation menu" }).last()).toBeFocused();
          await page.keyboard.press("Escape");
        }
        await page.screenshot({ path: info.outputPath(`project-cards-${theme}-${size.name}.png`), fullPage: true });
      }
    }
  } finally {
    await deletePersistedProjects(admin, prefix);
    await admin.unsafe('DELETE FROM auth."user" WHERE email=$1', [email]);
    await Promise.all([context.close(), admin.end()]);
  }
});
