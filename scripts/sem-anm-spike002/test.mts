import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { z } from "zod";
import { parseNormalizedDocument } from "@atlas/contracts";
import { buildPromptFromZod } from "../sem-anm-prompt001/prompt-builder.mts";
import { SemanticPromptSchema } from "../sem-anm-prompt001/semantic-schema.mts";
import { fixtureSha256, normalizedDocument } from "./fixture.mts";
import { prepareSourceSlots, makeUserPayload } from "./prepare-source-slots.mts";
import { normalizeProviderOutput, parseNormalizedProviderOutput } from "./normalize-provider-output.mts";
import { assertOracle, assertSourceAccounting, evaluateOracle, type Proposal } from "./semantic-oracle.mts";
import { finalizeProposal, snapshotProposal } from "./finalize.mts";
import { parseRootEnvValue, requireRootEnvValue } from "./anoman-client.mts";

const APPROVED_PROMPT_HASH = "5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4";
const APPROVED_SCHEMA_HASH = "b0316a004d4f1f94a0b9da240bfa730e3b1956e8f52808f3b6b07083dba97fa5";
const { jsonSchema, prompt } = buildPromptFromZod();
assert.equal(createHash("sha256").update(prompt).digest("hex"), APPROVED_PROMPT_HASH);
assert.equal(createHash("sha256").update(`${JSON.stringify(jsonSchema, null, 2)}\n`).digest("hex"), APPROVED_SCHEMA_HASH);
assert.equal(parseNormalizedDocument(normalizedDocument), normalizedDocument);
assert.equal(fixtureSha256.length, 64);

const slots = prepareSourceSlots(normalizedDocument);
assert.equal(slots.map(({ slot }) => slot).join(","), "S1,S2,S3,S4");
assert.equal(makeUserPayload(slots), "S1:\nThe customer submits an order.\n\nS2:\nSeorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.\n\nS3:\n3.2 Purchase Rules\n\nS4:\nApproval may be required before processing.");

const unit = (overrides: Record<string, unknown> = {}) => ({
  semantic_kind: "workflow_step", subject: "customer order submission", actor: "the customer", action: "submits", object: "an order", target: null,
  modality: "unspecified", applicability_conditions: [], temporal_constraints: [], quantitative_constraints: [], scope_constraints: [], resolution_status: "resolved", clarification_question: null, ...overrides,
});
const valid: Proposal = {
  source_results: [
    { slot: "S1", semantic_units: [unit() as Proposal["source_results"][number]["semantic_units"][number]] },
    { slot: "S2", semantic_units: [unit({ semantic_kind: "constraint", subject: "products", actor: "pelanggan", action: "buy", object: "produk", modality: "permitted", quantitative_constraints: ["maximum 2 products"], scope_constraints: ["per order"] }) as Proposal["source_results"][number]["semantic_units"][number]] },
    { slot: "S3", semantic_units: [] },
    { slot: "S4", semantic_units: [unit({ semantic_kind: "rule", subject: "approval", actor: null, action: null, object: null, modality: "possible", temporal_constraints: ["approval occurs before processing"], resolution_status: "needs_resolution", clarification_question: "Under what circumstances is approval required?" }) as Proposal["source_results"][number]["semantic_units"][number]] },
  ],
};
assert.deepEqual(SemanticPromptSchema.parse(valid), valid);
assertOracle(valid);

// The oracle accepts the ticket's harmless article, case, inflection, and temporal-surface variation.
for (const actor of ["customer", "the customer"]) for (const object of ["order", "an order", "the order"]) for (const action of ["submit", "submits", "submission"]) {
  const variant = structuredClone(valid);
  Object.assign(variant.source_results[0].semantic_units[0], { actor, object, action });
  assert.equal(evaluateOracle(variant).slots.S1.passed, true);
}
for (const temporal of ["before processing", "approval occurs before processing"]) {
  const variant = structuredClone(valid);
  variant.source_results[3].semantic_units[0].temporal_constraints = [temporal];
  assert.equal(evaluateOracle(variant).slots.S4.passed, true);
}

const invalidCases: Array<[string, Proposal]> = [
  ["S1 incidental clarification", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S1" ? { ...r, semantic_units: [unit({ resolution_status: "needs_resolution", clarification_question: "How is the order submitted?" }) as any] } : r) }],
  ["S1 actor change", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S1" ? { ...r, semantic_units: [unit({ actor: "supervisor" }) as any] } : r) }],
  ["S1 proposition change", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S1" ? { ...r, semantic_units: [unit({ action: "approve" }) as any] } : r) }],
  ["S2 wrong number", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S2" ? { ...r, semantic_units: [unit({ semantic_kind: "constraint", actor: "customer", subject: "products", quantitative_constraints: ["maximum 3 products"], scope_constraints: ["per order"] }) as any] } : r) }],
  ["S2 lost maximum", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S2" ? { ...r, semantic_units: [unit({ semantic_kind: "constraint", actor: "customer", subject: "products", quantitative_constraints: ["2 products"], scope_constraints: ["per order"] }) as any] } : r) }],
  ["S2 generic rule", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S2" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", actor: "customer", subject: "products", quantitative_constraints: ["maksimal 2 produk"], scope_constraints: ["per order"] }) as any] } : r) }],
  ["S2 lost scope", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S2" ? { ...r, semantic_units: [unit({ semantic_kind: "constraint", actor: "customer", subject: "products", quantitative_constraints: ["maximum 2 products"], scope_constraints: [] }) as any] } : r) }],
  ["S2 lost product", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S2" ? { ...r, semantic_units: [unit({ semantic_kind: "constraint", actor: "customer", subject: "purchase limit", quantitative_constraints: ["maximum 2"], scope_constraints: ["per order"] }) as any] } : r) }],
  ["S3 proposition", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S3" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", subject: "purchase rules" }) as any] } : r) }],
  ["S4 required", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "required", temporal_constraints: ["before processing"], resolution_status: "needs_resolution", clarification_question: "When is approval required?" }) as any] } : r) }],
  ["S4 permitted", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "permitted", temporal_constraints: ["before processing"], resolution_status: "needs_resolution", clarification_question: "When is approval required?" }) as any] } : r) }],
  ["S4 timing as applicability", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "possible", applicability_conditions: ["before processing"], temporal_constraints: [], resolution_status: "needs_resolution", clarification_question: "When is approval required?" }) as any] } : r) }],
  ["S4 resolved", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "possible", temporal_constraints: ["before processing"] }) as any] } : r) }],
  ["S4 missing clarification", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "possible", temporal_constraints: ["before processing"], resolution_status: "needs_resolution", clarification_question: null }) as any] } : r) }],
  ["S4 invented trigger", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", modality: "possible", applicability_conditions: ["for orders over $100"], temporal_constraints: ["before processing"], resolution_status: "needs_resolution", clarification_question: "When is approval required?" }) as any] } : r) }],
  ["S4 invented approver", { ...valid, source_results: valid.source_results.map((r) => r.slot === "S4" ? { ...r, semantic_units: [unit({ semantic_kind: "rule", subject: "manager approval", actor: "manager", modality: "possible", temporal_constraints: ["before processing"], resolution_status: "needs_resolution", clarification_question: "Under what circumstances is manager approval required?" }) as any] } : r) }],
];
for (const [name, proposal] of invalidCases) assert.equal(evaluateOracle(proposal).passed, false, name);

assert.throws(() => SemanticPromptSchema.parse({ source_results: [{ slot: "S1", semantic_units: [{ semantic_kind: "invented" }] }] }));
assert.throws(() => SemanticPromptSchema.parse({ source_results: [{ slot: "S1", semantic_units: [{ ...unit(), modality: "maybe" }] }] }));
assert.throws(() => SemanticPromptSchema.parse({ source_results: [{ slot: "S1", semantic_units: [{ semantic_kind: "rule" }] }] }));
assert.throws(() => parseNormalizedProviderOutput("Here is the JSON: {}"));
assert.deepEqual(normalizeProviderOutput('{"ok":true}'), { text: '{"ok":true}', removedFence: false });
assert.deepEqual(normalizeProviderOutput("```json\n{\"ok\":true}\n```"), { text: '{"ok":true}', removedFence: true });
assert.deepEqual(normalizeProviderOutput("```\n{\"ok\":true}\n```"), { text: '{"ok":true}', removedFence: true });
assert.throws(() => parseNormalizedProviderOutput("not json"));
assert.throws(() => normalizeProviderOutput("```json\n{}"));
assert.throws(() => normalizeProviderOutput("{}\n```"));
assert.throws(() => assertSourceAccounting({ source_results: [{ slot: "S1", semantic_units: [] }, { slot: "S1", semantic_units: [] }, ...valid.source_results.slice(2)] } as Proposal));
assert.throws(() => assertSourceAccounting({ source_results: [...valid.source_results, { slot: "S5", semantic_units: [] }] } as Proposal));
assert.throws(() => assertSourceAccounting({ source_results: valid.source_results.slice(1) } as Proposal));

const before = snapshotProposal(valid);
const finalized = finalizeProposal(valid, slots, normalizedDocument);
assert.equal(finalized.source_statement_inventory.length, 4);
assert.doesNotThrow(() => parseNormalizedDocument(normalizedDocument));
assert.equal(snapshotProposal(valid), before, "finalizer/oracle must not mutate the validated provider proposal");
assert.equal(parseRootEnvValue("OTHER_SECRET=keep-out", "ANOMAN_API_KEY"), undefined);
assert.throws(() => requireRootEnvValue("OTHER_SECRET=keep-out", "ANOMAN_API_KEY"), /ANOMAN_API_KEY is missing/);
assert.equal(parseRootEnvValue("ANOMAN_API_KEY=anm-placeholder\nOTHER_SECRET=keep-out", "ANOMAN_API_KEY"), "anm-placeholder");

console.log(JSON.stringify({ result: "PASS", promptHash: APPROVED_PROMPT_HASH, schemaHash: APPROVED_SCHEMA_HASH, fixtureSha256, oraclePositiveAndNegativeCases: invalidCases.length + 10, parser: "pass", redaction: "pass" }));
