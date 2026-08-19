import assert from "node:assert/strict";
import test from "node:test";
import { executeAtlasCycle, parseOptions, uiTarget } from "./run-local-atlas.mjs";

test("derives a non-Safara UI target from a custom artifact directory", () => {
  const target = uiTarget("C:/work/custom-artifacts/warehouse", { project_id: "warehouse", revision: 4 });
  assert.equal(target.artifactRoot, "C:/work/custom-artifacts");
  assert.equal(target.url, "http://localhost:3000/?project=warehouse&revision=4");
});

test("parses pnpm-forwarded custom inputs and a no-UI run", () => {
  assert.deepEqual(parseOptions(["--", "--prd", "other.pdf", "--project-intent", "other.json",
    "--output", "generated/other", "--no-ui"]), {
    prd: "other.pdf", projectIntent: "other.json", output: "generated/other", startUi: false,
  });
});

test("builds, extracts, stops the bridge, then starts UI with generated identity", async () => {
  const events = []; const environments = [];
  const config = { prd: "other.pdf", projectIntent: "other.json",
    output: "C:/work/custom/warehouse", startUi: true,
    env: { GEMINI_MODEL: "test-model" } };
  const target = await executeAtlasCycle(config, {
    run: async (_command, args, options) => {
      events.push(args.includes("atlas") ? "extract" : args.includes("dev") ? "ui" : "build");
      environments.push(options.env); return args.includes("atlas") ? 7 : 0;
    },
    startBridge: () => { events.push("bridge-start"); return {}; },
    waitUntilReady: async () => { events.push("bridge-ready"); },
    stopBridge: async () => { events.push("bridge-stop"); },
    readManifest: async () => ({ project_id: "warehouse", revision: 3 }),
    log: () => {},
  });
  assert.deepEqual(events, ["build", "bridge-start", "bridge-ready", "extract", "bridge-stop", "ui"]);
  assert.equal(environments.at(-1).CES_ATLAS_ARTIFACT_ROOT, "C:/work/custom");
  assert.equal(target.url, "http://localhost:3000/?project=warehouse&revision=3");
});

test("always stops the bridge and does not start UI after a non-review extraction", async () => {
  const events = [];
  await assert.rejects(executeAtlasCycle({ prd: "x", projectIntent: "y", output: "z",
    startUi: true, env: { GEMINI_MODEL: "test" } }, {
    run: async (_command, args) => { events.push(args.includes("atlas") ? "extract" : "build");
      return args.includes("atlas") ? 8 : 0; },
    startBridge: () => ({}), waitUntilReady: async () => {},
    stopBridge: async () => { events.push("bridge-stop"); }, readManifest: async () => ({}), log: () => {},
  }), /expected 7/u);
  assert.deepEqual(events, ["build", "extract", "bridge-stop"]);
});
