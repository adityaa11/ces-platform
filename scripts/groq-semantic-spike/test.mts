import assert from "node:assert/strict";
import { createValidatedFixture, fixtureSources } from "./fixture.mts";
import { finalize } from "./finalize.mts";
import { validateIntermediate } from "./intermediate-schema.mts";

const proposal = { source_results: [
  { slot: 1, disposition: "candidate", candidates: [{ kind: "workflow_step", semantic_key: "customer order submission", normalized_meaning: "The customer submits an order.", needs_resolution: false }], non_fact_reason: "", question: "", question_reason: "" },
  { slot: 2, disposition: "candidate", candidates: [{ kind: "constraint", semantic_key: "customer maximum two products per order", normalized_meaning: "A customer may purchase at most 2 products per order.", needs_resolution: false }], non_fact_reason: "", question: "", question_reason: "" },
  { slot: 3, disposition: "non_fact", candidates: [], non_fact_reason: "Structural section heading only.", question: "", question_reason: "" },
  { slot: 4, disposition: "uncertain", candidates: [{ kind: "unresolved", semantic_key: "approval requirement before processing", normalized_meaning: "Approval may be required before processing.", needs_resolution: true }], non_fact_reason: "", question: "Under what condition is approval required before processing?", question_reason: "The triggering approval condition is not stated." },
] } as const;

assert.equal(createValidatedFixture().pages[0].textBlocks.length, 4);
const result = finalize(proposal);
assert.equal((result as any).candidate_assertions.length, 3);
assert.deepEqual((result as any).source_statement_inventory.map((item: any) => item.classification), ["candidate", "candidate", "non_fact", "candidate"]);
assert.equal((result as any).candidate_assertions[1].source_wording, fixtureSources[1].text);
assert.throws(() => validateIntermediate({ ...proposal, source_results: proposal.source_results.slice(0, 3) }));
assert.throws(() => validateIntermediate({ ...proposal, source_results: [...proposal.source_results.slice(0, 3), { ...proposal.source_results[3], slot: 3 }] }));
console.log("SEMSPIKE-001 local fixture, accounting, finalization, and real parser checks: PASS");
