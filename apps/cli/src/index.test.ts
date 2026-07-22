import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./index.js";

const requirement = {
  schema_version: "1.0.0",
  requirement: { id: "REQ-1", title: "Replace profile picture" },
  actor: { type: "authenticated_user" },
  operation: { action: "replace", resource: "profile_picture", target_scope: "own_resource" },
  inputs: [{ name: "picture", type: "binary_file", trust_boundary: "external", media_category: "image", constraints: { allowed_media_types: ["image/png"], maximum_size_bytes: 1024 } }],
  effects: ["persistent_write", "replaces_existing_resource"],
  business_rules: [{ id: "BR-1", type: "lifecycle", statement: "Delete replaced resource after commit" }],
};

const projectYaml = `schema_version: 1.0.0
project:
  id: sample
  name: Sample
assurance:
  exposure: public_internet
  criticality: business_critical
  data_classes: [personal]
technical:
  language: php
  framework: laravel
ces:
  baseline_version: 0.1.0
  adapter:
    id: unavailable-for-core-test
    version: 0.1.0
`;

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { stdout, stderr, io: { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) } };
}

describe("core CLI", () => {
  it("documents commands and exit codes", async () => {
    const output = capture();
    expect(await runCli(["--help"], output.io)).toBe(0);
    expect(output.stdout.join("")).toContain("validate-requirement");
    expect(output.stdout.join("")).toContain("4  registry or policy conflict");
  });

  it("validates JSON requirements and YAML projects", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    await writeFile(requirementPath, JSON.stringify(requirement));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["validate-requirement", "--input", requirementPath], capture().io)).toBe(0);
    expect(await runCli(["validate-project", "--input", projectPath], capture().io)).toBe(0);
  });

  it.each([
    ["input type", { ...requirement, inputs: [{ ...requirement.inputs[0], type: "binary-file" }] }],
    ["media category", { ...requirement, inputs: [{ ...requirement.inputs[0], media_category: "images" }] }],
    ["target scope", { ...requirement, operation: { ...requirement.operation, target_scope: "own" } }],
  ])("returns exit code 2 for invalid %s vocabulary", async (_, invalid) => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const inputPath = join(directory, "invalid-requirement.json");
    await writeFile(inputPath, JSON.stringify(invalid));
    const output = capture();
    expect(await runCli(["validate-requirement", "--input", inputPath], output.io)).toBe(2);
    expect(output.stderr.join("")).toContain(inputPath);
  });

  it("returns exit code 2 for ambiguous assurance vocabulary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const inputPath = join(directory, "invalid-project.yaml");
    await writeFile(inputPath, projectYaml.replace("public_internet", "public"));
    expect(await runCli(["validate-project", "--input", inputPath], capture().io)).toBe(2);
  });

  it("resolves policy without loading the configured adapter", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const outputPath = join(directory, "generated", "policy-manifest.json");
    await writeFile(requirementPath, JSON.stringify(requirement));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["resolve-policy", "--requirement", requirementPath, "--project", projectPath, "--output", outputPath], capture().io)).toBe(0);
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toMatchObject({ requirement_id: "REQ-1", policy_registry_hash: expect.stringMatching(/^sha256:/u) });
  });

  it("reports the file failure without a stack trace", async () => {
    const output = capture();
    expect(await runCli(["validate-project", "--input", "missing.json"], output.io)).toBe(2);
    expect(output.stderr.join("")).toContain("missing.json");
    expect(output.stderr.join("")).not.toContain("at runCli");
  });

  it("identifies the input file and failing schema field", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const inputPath = join(directory, "invalid-project.json");
    await writeFile(inputPath, JSON.stringify({ schema_version: "1.0.0" }));
    const output = capture();

    expect(await runCli(["validate-project", "--input", inputPath], output.io)).toBe(2);
    expect(output.stderr.join("")).toContain(inputPath);
    expect(output.stderr.join("")).toContain("project");
    expect(output.stderr.join("")).not.toContain("ZodError");
  });

  it("writes a blocked diagnostic manifest before returning 3", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const outputPath = join(directory, "policy-manifest.json");
    await writeFile(requirementPath, JSON.stringify({ ...requirement, business_rules: [] }));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["resolve-policy", "--requirement", requirementPath, "--project", projectPath, "--output", outputPath], capture().io)).toBe(3);
    expect(JSON.parse(await readFile(outputPath, "utf8")).obligations).toContainEqual(expect.objectContaining({ policy_id: "REPLACED_RESOURCE_LIFECYCLE", resolution_state: "blocked" }));
  });

  it("writes a conflict diagnostic manifest before returning 4", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const outputPath = join(directory, "policy-manifest.json");
    const secondInput = {
      ...requirement.inputs[0],
      name: "second_picture",
      constraints: { ...requirement.inputs[0]!.constraints, maximum_size_bytes: 2048 },
    };
    await writeFile(requirementPath, JSON.stringify({ ...requirement, inputs: [...requirement.inputs, secondInput] }));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["resolve-policy", "--requirement", requirementPath, "--project", projectPath, "--output", outputPath], capture().io)).toBe(4);
    expect(JSON.parse(await readFile(outputPath, "utf8")).obligations).toContainEqual(expect.objectContaining({ policy_id: "FILE_SIZE_LIMIT", resolution_state: "conflict" }));
  });

  it("orchestrates deterministic two-stage compilation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const first = join(directory, "first");
    const second = join(directory, "second");
    await writeFile(requirementPath, JSON.stringify(requirement));
    await writeFile(projectPath, projectYaml);
    const args = ["compile", "--requirement", requirementPath, "--project", projectPath, "--adapter", "test-fixture", "--output"];
    expect(await runCli([...args, first, "--test-mode", "true"], capture().io)).toBe(0);
    expect(await runCli([...args, second, "--test-mode", "true"], capture().io)).toBe(0);
    const expectedFiles = [
      "implementation-plan.json",
      "implementation-task.md",
      "policy-manifest.json",
      "requirement-package.json",
      "test-manifest.json",
      "verification-manifest.json",
    ];
    expect((await readdir(first)).sort()).toEqual(expectedFiles);
    for (const file of expectedFiles) {
      expect(await readFile(join(first, file), "utf8")).toBe(
        await readFile(join(second, file), "utf8"),
      );
    }
  });

  it("writes only core diagnostics when compile is blocked", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const outputPath = join(directory, "output");
    await writeFile(requirementPath, JSON.stringify({ ...requirement, business_rules: [] }));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["compile", "--requirement", requirementPath, "--project", projectPath, "--adapter", "missing-adapter", "--output", outputPath], capture().io)).toBe(3);
    expect((await readdir(outputPath)).sort()).toEqual([
      "policy-manifest.json",
      "requirement-package.json",
    ]);
  });

  it("writes only adapter-report.json when adapter compilation finds gaps", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const manifestPath = join(directory, "policy-manifest.json");
    const outputPath = join(directory, "output");
    await writeFile(requirementPath, JSON.stringify(requirement));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["resolve-policy", "--requirement", requirementPath, "--project", projectPath, "--output", manifestPath], capture().io)).toBe(0);
    expect(await runCli(["compile-adapter", "--policy-manifest", manifestPath, "--project", projectPath, "--adapter", "test-fixture-with-gap", "--output", outputPath, "--test-mode", "true"], capture().io)).toBe(5);
    expect(await readdir(outputPath)).toEqual(["adapter-report.json"]);
  });

  it("persists verification reports and returns exit code 6 on failure", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ces-cli-"));
    const requirementPath = join(directory, "requirement.json");
    const projectPath = join(directory, "project.yaml");
    const generated = join(directory, "generated");
    const projectRoot = join(directory, "client");
    await mkdir(join(projectRoot, ".ces"), { recursive: true });
    await writeFile(requirementPath, JSON.stringify(requirement));
    await writeFile(projectPath, projectYaml);
    expect(await runCli(["compile", "--requirement", requirementPath, "--project", projectPath, "--adapter", "test-fixture", "--output", generated, "--test-mode", "true"], capture().io)).toBe(0);
    await writeFile(join(projectRoot, "source.txt"), "no evidence markers");
    await writeFile(join(projectRoot, ".ces", "verification.json"), JSON.stringify({
      test_commands: [{ id: "CLIENT-TESTS", command: process.execPath, args: ["-e", "process.exit(9)"] }],
    }));

    expect(await runCli(["verify", "--manifest", join(generated, "verification-manifest.json"), "--project-root", projectRoot], capture().io)).toBe(6);
    expect(JSON.parse(await readFile(join(generated, "verification-report.json"), "utf8"))).toMatchObject({
      status: "failed",
      exit_code: 6,
    });
  });
});
