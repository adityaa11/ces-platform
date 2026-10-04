import assert from "node:assert/strict";
import { createValidatedFixture, providerInput } from "./fixture.mts";
import { FROZEN_SYSTEM_INSTRUCTION, instructionHash } from "./groq-client.mts";
import { validateSemanticTrace } from "./schema.mts";

assert.equal(instructionHash, "9d00f115bfe5d6c3e08edfb6aa577917386fe6ffb0b9210ad9d53fccc326550c");
assert.equal(createValidatedFixture().pages[0].textBlocks.length, 4);
assert.deepEqual(providerInput(), { sources: [{ slot: "S1", text: "The customer submits an order." }, { slot: "S2", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan." }, { slot: "S3", text: "3.2 Purchase Rules" }, { slot: "S4", text: "Approval may be required before processing." }] });
assert.equal(FROZEN_SYSTEM_INSTRUCTION.includes("workflow_step"), true); // Frozen instruction's prohibition is retained verbatim.
const valid = { observations: [{ slot: "S1", semantic_role: "business_proposition", proposition: "The customer submits an order.", epistemic_status: "certain", polarity: "positive", stated_conditions: [], unresolved_information: [] }, { slot: "S2", semantic_role: "business_proposition", proposition: "A customer may buy at most 2 products in one order.", epistemic_status: "certain", polarity: "positive", stated_conditions: [], unresolved_information: [] }, { slot: "S3", semantic_role: "structural_text", proposition: "", epistemic_status: "not_applicable", polarity: "not_applicable", stated_conditions: [], unresolved_information: [] }, { slot: "S4", semantic_role: "business_proposition", proposition: "Approval may be required before processing.", epistemic_status: "possible", polarity: "positive", stated_conditions: [], unresolved_information: ["Whether approval is required."] }] };
assert.doesNotThrow(() => validateSemanticTrace(valid));
assert.throws(() => validateSemanticTrace({ ...valid, observations: valid.observations.slice(0, 3) }));
assert.throws(() => validateSemanticTrace({ ...valid, observations: [...valid.observations.slice(0, 3), { ...valid.observations[3], slot: "S3" }] }));
assert.throws(() => validateSemanticTrace({ ...valid, observations: [...valid.observations.slice(0, 3), { ...valid.observations[3], candidate: true }] }));
assert.throws(() => validateSemanticTrace({ ...valid, observations: [...valid.observations.slice(0, 2), { ...valid.observations[2], proposition: "Purchase rules", epistemic_status: "certain" }, valid.observations[3]] }));
console.log("SEMTRACE-001 fixture, frozen-instruction hash, neutral-schema, source-accounting, and structural invariants: PASS");
