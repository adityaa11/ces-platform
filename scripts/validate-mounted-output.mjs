import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = process.argv[2];
if (!root) {
  console.error("Usage: node scripts/validate-mounted-output.mjs <output-directory>");
  process.exitCode = 1;
} else {
  const expected = [
    "core/requirement-package.json",
    "core/policy-manifest.json",
    "adapters/laravel/implementation-plan.json",
    "adapters/laravel/implementation-task.md",
    "adapters/laravel/test-manifest.json",
    "adapters/laravel/verification-manifest.json",
  ];
  try {
    const contents = new Map();
    for (const relativePath of expected) {
      const path = resolve(root, relativePath);
      await access(path, constants.F_OK | constants.W_OK);
      contents.set(relativePath, await readFile(path, "utf8"));
    }
    const policy = JSON.parse(contents.get("core/policy-manifest.json"));
    const plan = JSON.parse(contents.get("adapters/laravel/implementation-plan.json"));
    if (policy.compilation_id !== plan.source_compilation_id) {
      throw new Error("Core and adapter compilation identities differ");
    }
    if (`${plan.adapter.id}@${plan.adapter.version}` !== "laravel@0.1.0") {
      throw new Error("Generated adapter identity does not match laravel@0.1.0");
    }
    for (const [relativePath, content] of contents) {
      if (/\/app|\/workspace/u.test(content)) {
        throw new Error(`Container-only path leaked into ${relativePath}`);
      }
    }
    console.log(`Validated ${expected.length} writable mounted artifacts at ${root}`);
  } catch (error) {
    console.error(`Mounted output validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
