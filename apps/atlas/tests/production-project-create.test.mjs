import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { createProductionProjectSubmitter, ProductionProjectSubmissionError, submitProductionProject, validateProductionProject } = await jiti.import("../components/production-project-create.ts");
const pdf = new File(["%PDF-1.7"], "brief.pdf", { type: "application/pdf" });
const input = { projectId: "customer-portal", projectName: "Customer portal", projectDescription: "A project", files: [pdf] };
const createdResponse = () => new Response(JSON.stringify({ project: { projectId: "customer-portal", name: "Customer portal", documentCount: 1 } }), { status: 201 });

test("PCC-005 validates bounded production input without fixture authority", () => {
  assert.deepEqual(validateProductionProject(input), {});
  const errors = validateProductionProject({ projectId: "UPPERCASE", projectName: "", projectDescription: "x".repeat(281), files: [] });
  assert.match(errors.projectId, /lowercase/); assert.match(errors.projectName, /Enter/); assert.match(errors.projectDescription, /280/); assert.match(errors.prdFiles, /Select/);
  assert.match(validateProductionProject({ ...input, files: Array.from({ length: 11 }, () => pdf) }).prdFiles, /10/);
  assert.match(validateProductionProject({ ...input, files: [new File(["text"], "brief.txt", { type: "text/plain" })] }).prdFiles, /PDF/);
  assert.match(validateProductionProject({ ...input, files: [new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" })] }).prdFiles, /20 MiB/);
});

test("PCC-005 submits exactly one same-origin multipart request without base64 transport", async () => {
  let url, options;
  const result = await submitProductionProject(input, async (nextUrl, nextOptions) => { url = nextUrl; options = nextOptions; return createdResponse(); });
  assert.equal(url, "/api/projects"); assert.equal(options.method, "POST"); assert.equal(options.body.get("projectId"), "customer-portal"); assert.equal(options.body.get("projectName"), "Customer portal"); assert.equal(options.body.getAll("prdFiles[]").length, 1); assert.equal(options.headers, undefined); assert.equal(result.project.documentCount, 1);
});

test("PCC-005 rejects malformed success and maps bounded status failures", async () => {
  await assert.rejects(() => submitProductionProject(input, async () => new Response(JSON.stringify({ project: { name: "missing fields" } }), { status: 201 })), (error) => error instanceof ProductionProjectSubmissionError && error.errors.form === "The project response was incomplete. Please try again.");
  for (const [status, field, message] of [[409, "projectId", "That project ID is already in use."], [413, "prdFiles", "The project upload is too large."], [415, "prdFiles", "Only PDF files can be added."], [500, "form", "Unable to create the project. Please try again."]]) {
    await assert.rejects(() => submitProductionProject(input, async () => new Response(JSON.stringify({ error: "untrusted internal detail" }), { status })), (error) => error instanceof ProductionProjectSubmissionError && error.errors[field] === message);
  }
});

test("PCC-005 coalesces an in-flight request and permits retry after failure", async () => {
  let calls = 0, resolve;
  const submit = createProductionProjectSubmitter(async () => { calls += 1; return await new Promise((done) => { resolve = done; }); });
  const first = submit(input), second = submit({ ...input, projectId: "ignored-second-submit" });
  assert.equal(first, second); assert.equal(calls, 1); resolve(createdResponse()); await first;
  const retry = createProductionProjectSubmitter(async () => { calls += 1; return createdResponse(); }); await retry(input); assert.equal(calls, 2);
});

test("PCC-005 renders a safe form alert and preserves fixture authority", async () => {
  const [production, fixture] = await Promise.all([readFile(new URL("../components/ProductionProjectLibrary.tsx", import.meta.url), "utf8"), readFile(new URL("../components/ProjectLibrary.tsx", import.meta.url), "utf8")]);
  assert.match(production, /errors\.form.*role="alert"/); assert.match(production, /createProductionProjectSubmitter/); assert.doesNotMatch(production, /local-fixtures|createFixtureProject|base64/i);
  assert.match(fixture, /createFixtureProject/); assert.match(fixture, /\/api\/local-fixtures/);
});
