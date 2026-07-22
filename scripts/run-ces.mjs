#!/usr/bin/env node

import { resolve } from "node:path";
import { runCes } from "../packages/bootstrap-runner/dist/index.js";

const options = parseArguments(process.argv.slice(2));
process.exitCode = await runCes({ workspace: resolve(options.workspace ?? "."), requirement: required(options, "requirement"), output: required(options, "output") });

function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value) throw new Error("Usage: run-ces.mjs --requirement <path> --output <path> [--workspace <path>]");
    values[flag.slice(2)] = value;
  }
  return values;
}
function required(options, key) { if (!options[key]) throw new Error(`Missing --${key}`); return options[key]; }
