import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { submitProductionProject, validateProductionProject } = await jiti.import("../components/production-project-create.ts");
const pdf = new File(["%PDF-1.7"], "brief.pdf", { type: "application/pdf" });

test("PCC-005 validates production project input without fixture authority", () => {
  assert.deepEqual(validateProductionProject({ projectId: "customer-portal", projectName: "Customer portal", projectDescription: "", files: [pdf] }), {});
  const errors = validateProductionProject({ projectId: "UPPERCASE", projectName: "", projectDescription: "x".repeat(281), files: [] });
  assert.match(errors.projectId, /lowercase/); assert.match(errors.projectName, /Enter/); assert.match(errors.projectDescription, /280/); assert.match(errors.prdFiles, /Select/);
});

test("PCC-005 submits exactly one same-origin multipart request", async () => {
  let url, options;
  const result = await submitProductionProject({ projectId: "customer-portal", projectName: "Customer portal", projectDescription: "A project", files: [pdf] }, async (nextUrl, nextOptions) => {
    url = nextUrl; options = nextOptions; return new Response(JSON.stringify({ project: { projectId: "customer-portal", name: "Customer portal", documentCount: 1 } }), { status: 201 });
  });
  assert.equal(url, "/api/projects"); assert.equal(options.method, "POST"); assert.equal(options.body.get("projectId"), "customer-portal"); assert.equal(options.body.get("projectName"), "Customer portal"); assert.equal(options.body.getAll("prdFiles[]").length, 1); assert.equal(result.project.documentCount, 1);
});
