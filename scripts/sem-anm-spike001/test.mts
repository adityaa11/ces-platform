import assert from "node:assert/strict";
import { buildStrictRequest, loadAnomanApiKey, sanitizeTelemetry } from "./anoman-client.mts";
import { createValidatedFixture, fixtureSources } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { assertSemanticOracle } from "./semantic-oracle.mts";
import { parseProposal, providerSchema, transportProviderSchema } from "./schema.mts";

const valid = { sourceResults: [
  { sourceSlot: "S1", extraction: { kind: "workflow_step", actor: "customer", action: "submits", object: "order", target: null, temporalConstraint: null } },
  { sourceSlot: "S2", extraction: { kind: "constraint", subject: "customer", restriction: "maximum purchase", quantity: 2, unit: "products", scope: "per order" } },
  { sourceSlot: "S3", extraction: { kind: "non_fact", reason: "Document heading." } },
  { sourceSlot: "S4", extraction: { kind: "rule", subject: "approval", modality: "possible", temporalConstraint: "before processing", applicabilityCondition: null, missingInformation: ["The condition under which approval is required."] } },
] };
assert.equal(createValidatedFixture().pages[0].textBlocks.length, 4); assert.deepEqual(createValidatedFixture().pages[0].textBlocks.map(({ text }) => text), fixtureSources.map(({ text }) => text));
assert.match(JSON.stringify(providerSchema), /Preserve uncertainty/i); assert.match(JSON.stringify(transportProviderSchema), /ANOMAN_OK/);
const request = buildStrictRequest("semantic"); assert.equal(request.model, "gemini-2.5-flash"); assert.equal(request.temperature, 0); assert.equal(request.response_format.type, "json_schema"); assert.equal(request.response_format.json_schema.strict, true);
assert.equal(await loadAnomanApiKey({ ANOMAN_API_KEY: "test-key" }), "test-key"); await assert.rejects(() => loadAnomanApiKey({}, ".missing-anoman-env"), /ANOMAN_API_KEY/);
assert.deepEqual(sanitizeTelemetry({ authorization: "Bearer secret", nested: { api_key: "secret", provider_region: "id" } }), { nested: { provider_region: "id" } });
assert.deepEqual(parseProposal(valid), valid); assertSemanticOracle(valid); assert.doesNotThrow(() => finalize(valid));
assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.slice(0, 3) })); assert.throws(() => parseProposal({ sourceResults: [valid.sourceResults[0], valid.sourceResults[0], valid.sourceResults[2], valid.sourceResults[3]] }), /duplicate source slot/); assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.map((entry, index) => index === 0 ? { ...entry, sourceSlot: "S5" } : entry) })); assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.map((entry, index) => index === 1 ? { ...entry, extraction: { kind: "constraint", subject: "customer" } } : entry) }));
assert.throws(() => assertSemanticOracle({ sourceResults: valid.sourceResults.map((entry) => entry.sourceSlot === "S4" ? { ...entry, extraction: { ...entry.extraction, modality: "required" } } : entry) }));
assert.throws(() => assertSemanticOracle({ sourceResults: valid.sourceResults.map((entry) => entry.sourceSlot === "S4" ? { ...entry, extraction: { ...entry.extraction, applicabilityCondition: "before processing" } } : entry) }));
assert.throws(() => assertSemanticOracle({ sourceResults: valid.sourceResults.map((entry) => entry.sourceSlot === "S4" ? { ...entry, extraction: { ...entry.extraction, missingInformation: [] } } : entry) }));
assert.throws(() => parseProposal({ sourceResults: valid.sourceResults.map((entry) => entry.sourceSlot === "S1" ? { ...entry, extraction: { ...entry.extraction, missingInformation: ["submission method"] } } : entry) }), /Unrecognized key/);
assert.doesNotThrow(() => assertSemanticOracle(valid));
console.log("SEM-ANM-SPIKE001 deterministic fixture, strict schema, credential, finalizer, oracle, and negative checks: PASS");
