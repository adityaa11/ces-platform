import assert from "node:assert/strict";
import test from "node:test";
import { semanticExtractionSkill, semanticReconciliationSkill, getProductionSemanticSkill } from "../src/index.ts";
import { validateJsonSchema } from "@atlas/contracts";
test("only the two bounded model-neutral semantic skills are exported", () => { assert.equal(getProductionSemanticSkill("atlas.semantic.extract", "v1"), semanticExtractionSkill); assert.equal(getProductionSemanticSkill("atlas.semantic.reconcile", "v1"), semanticReconciliationSkill); assert.throws(() => getProductionSemanticSkill("atlas.semantic.extract", "v2")); assert.doesNotThrow(() => validateJsonSchema(semanticExtractionSkill.outputSchema, { version: "v1", candidate_assertions: [], source_statement_inventory: [], questions: [] })); });
