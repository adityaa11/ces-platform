import assert from "node:assert/strict";
import { createValidatedFixture, fixtureSources } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { assertSemanticOracle } from "./semantic-oracle.mts";
import { parseProposal, providerSchema } from "./schema.mts";

const valid = { sourceResults: [
  { sourceSlot: "S1", extraction: { kind: "workflow_step", actor: "customer", action: "submits", object: "order", condition: null } },
  { sourceSlot: "S2", extraction: { kind: "constraint", subject: "customer", restriction: "maximum purchase", quantity: 2, unit: "products", scope: "per order" } },
  { sourceSlot: "S3", extraction: { kind: "non_fact", reason: "Document heading." } },
  { sourceSlot: "S4", extraction: { kind: "unresolved", knownMeaning: "Approval may be required before processing.", missingInformation: "The condition under which approval is required.", clarificationQuestion: "Under what condition is approval required before processing?" } },
] };
assert.equal(createValidatedFixture().pages[0].textBlocks.length, 4);
assert.deepEqual(createValidatedFixture().pages[0].textBlocks.map(({ text }) => text), fixtureSources.map(({ text }) => text));
const descriptions = JSON.stringify(providerSchema); for (const phrase of ["workflow step represents", "constraint expresses", "Use when the source establishes", "Use for headings"]) assert.match(descriptions, new RegExp(phrase, "i"));
assert.deepEqual(parseProposal(valid), valid); assertSemanticOracle(valid); assert.doesNotThrow(() => finalize(valid));
assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.slice(0, 3) }), /Too small|Invalid provider proposal/);
assert.throws(() => parseProposal({ sourceResults: [valid.sourceResults[0], valid.sourceResults[0], valid.sourceResults[2], valid.sourceResults[3]] }), /duplicate source slot/);
assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.map((entry, index) => index === 0 ? { ...entry, sourceSlot: "S5" } : entry) }), /Invalid option/);
assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.map((entry, index) => index === 1 ? { ...entry, extraction: { kind: "constraint", subject: "customer" } } : entry) }));
console.log("SEMSPIKE-005 real fixture, Zod schema-description, parser/finalizer, semantic-oracle, and negative checks: PASS");
