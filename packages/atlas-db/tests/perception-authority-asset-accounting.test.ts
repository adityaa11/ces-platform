import assert from "node:assert/strict";
import test from "node:test";
import { collectVerifiedRun003Assets } from "../src/perception-authority.ts";

test("RUN-003 authority accepts a zero-visual normalized document with no derived assets", () => {
  const assets = collectVerifiedRun003Assets([{ number: 1, textBlocks: [{ id: "text-1", text: "Digital text" }], tables: [{ id: "table-1", content: "| A |" }], visualRegions: [] }]);
  assert.deepEqual(assets, []);
});

test("RUN-003 authority requires one asset reference for every visual region", () => {
  assert.throws(() => collectVerifiedRun003Assets([{ number: 1, textBlocks: [], tables: [], visualRegions: [{ id: "visual-1" }] }]), /one verified derived asset/i);
  assert.deepEqual(collectVerifiedRun003Assets([{ number: 1, textBlocks: [], tables: [], visualRegions: [{ id: "visual-1", assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" }] }]), [{ pageNumber: 1, locatorId: "visual-1", assetRef: "derived/123e4567-e89b-12d3-a456-426614174000" }]);
});
