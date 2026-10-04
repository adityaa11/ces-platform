import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createValidatedFixture, sources, userMessage } from "./fixture.mts";
import { FROZEN_INSTRUCTION_SHA256, instructionSha256, SYSTEM_INSTRUCTION } from "./prompt.mts";
import { parseEnvelope } from "./parser.mts";

assert.equal(instructionSha256(), FROZEN_INSTRUCTION_SHA256);
assert.equal(createHash("sha256").update(SYSTEM_INSTRUCTION, "utf8").digest("hex"), FROZEN_INSTRUCTION_SHA256);
const fixture = createValidatedFixture();
assert.equal(fixture.pages[0].textBlocks.length, 4);
assert.deepEqual(fixture.pages[0].textBlocks.map(({ text }) => text), sources.map(({ text }) => text));
assert.deepEqual(JSON.parse(userMessage), { sources });

const valid = {
  observations: [
    { slot: "S1", structural_only: false, meaning: "The customer submits an order.", qualifications: [], unspecified: [] },
    { slot: "S2", structural_only: false, meaning: "A customer may buy a maximum of 2 products per order.", qualifications: [], unspecified: [] },
    { slot: "S3", structural_only: true, meaning: "", qualifications: [], unspecified: [] },
    { slot: "S4", structural_only: false, meaning: "Approval may be required before processing.", qualifications: [], unspecified: [] },
  ],
};
assert.deepEqual(parseEnvelope(JSON.stringify(valid)), valid);
assert.throws(() => parseEnvelope("not JSON"), /not valid JSON/);
assert.throws(() => parseEnvelope(JSON.stringify({ ...valid, extra: true })), /only observations/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: valid.observations.slice(0, 3) })), /exactly four/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: [valid.observations[1], ...valid.observations.slice(1)] })), /source order/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: valid.observations.map((item, index) => index === 0 ? { ...item, extra: "forbidden" } : item) })), /additional fields/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: valid.observations.map((item, index) => index === 0 ? { ...item, qualifications: [2] } : item) })), /string array/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: valid.observations.map((item, index) => index === 2 ? { ...item, meaning: "Purchase rule" } : item) })), /S3/);
assert.throws(() => parseEnvelope(JSON.stringify({ observations: valid.observations.map((item, index) => index === 1 ? { ...item, meaning: "" } : item) })), /non-empty meaning/);
console.log("SEMSPIKE-004 fixture, frozen instruction hash, source-only request, and transport-envelope negative checks: PASS");
