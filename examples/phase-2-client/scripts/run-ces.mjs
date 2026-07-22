#!/usr/bin/env node

// This file is client-owned and version-controlled separately from .ces/ces.lock.
import { resolve } from "node:path";
import { runCes } from "../../../packages/bootstrap-runner/dist/index.js";

const workspace = resolve(import.meta.dirname, "..");
process.exitCode = await runCes({
  workspace,
  requirement: ".ces/requirements/REQ-USER-014.yaml",
  output: ".ces/generated/REQ-USER-014",
});
