import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BranchRegistryResolutionError, createBranchRegistry } from "../src/ghr/core/branch-registry.ts";
import { resolveMainRouteBinding } from "../src/ghr/main-route-index.ts";

const testOneRegistration = {
  branch: "batch-plan",
  producerProcessKey: "perception.acceptance",
  policyVersion: "v1",
  handlerVersion: "v1",
  bodyContractType: "SemanticBatchPlanInput",
  bodyContractVersion: "v1",
  canContinue: false,
  payloadByteLimit: 2_048,
  wrappedBodyByteLimit: 2_081,
  receiverIdentity: "semantic.batch-plan",
} as const;

test("the prospective Test-1 binding is exact, false-only metadata", () => {
  const registry = createBranchRegistry([testOneRegistration]);
  assert.deepEqual(registry.resolve(testOneRegistration), testOneRegistration);
  assert.equal(registry.resolve(testOneRegistration).payloadByteLimit, 2_048);
  assert.equal(registry.resolve(testOneRegistration).wrappedBodyByteLimit, 2_081);
  assert.equal(registry.resolve(testOneRegistration).canContinue, false);

  for (const mismatch of [
    { branch: "unknown-branch" },
    { producerProcessKey: "unknown.producer" },
    { policyVersion: "v2" },
    { handlerVersion: "v2" },
    { bodyContractType: "UnknownInput" },
    { bodyContractVersion: "v2" },
  ]) {
    assert.throws(() => registry.resolve({ ...testOneRegistration, ...mismatch }), BranchRegistryResolutionError);
  }
  assert.throws(() => resolveMainRouteBinding({ ...testOneRegistration, main: "unknown-main" as never }), /No registered main route/u);
});

test("a local registry rejects duplicate exact pins and invalid bounds", () => {
  assert.throws(() => createBranchRegistry([testOneRegistration, testOneRegistration]), /Duplicate exact branch registration/u);
  assert.throws(() => createBranchRegistry([{ ...testOneRegistration, wrappedBodyByteLimit: 2_047 }]), /wrapper bounds/u);
});

test("directory composition and registry core remain inert and domain-isolated", async () => {
  const root = fileURLToPath(new URL("../src/ghr/", import.meta.url));
  const mainIndex = await readFile(`${root}main-route-index.ts`, "utf8");
  assert.deepEqual([...mainIndex.matchAll(/^import .* from "(.+)";$/gmu)].map((match) => match[1]), [
    "./routes/projection/index.js",
    "./routes/reconciliation/index.js",
    "./routes/semantic/index.js",
  ]);
  assert.doesNotMatch(mainIndex, /branch-registry|bodies|receivers|switch/u);

  for (const domain of ["semantic", "reconciliation", "projection"]) {
    const entries = await readdir(`${root}routes/${domain}`);
    assert.deepEqual(entries.sort(), ["bodies", "branches", "index.ts", "receivers"]);
    const localIndex = await readFile(`${root}routes/${domain}/index.ts`, "utf8");
    assert.match(localIndex, /createBranchRegistry/u);
    assert.doesNotMatch(localIndex, /@atlas\/db|route-registry|pg-boss|queue|worker|dispatch|resolveBackground|import\(/u);
  }

  const core = await readFile(`${root}core/branch-registry.ts`, "utf8");
  assert.doesNotMatch(core, /@atlas\/db|route-registry|pg-boss|queue|worker|dispatch|resolveBackground|import\(/u);
  assert.doesNotMatch(mainIndex, /@atlas\/db|route-registry|pg-boss|queue|worker|dispatch|import\(/u);
  assert.doesNotMatch(core, /canContinue:\s*true/u);
});
