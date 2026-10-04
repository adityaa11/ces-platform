import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";
import { knownGood, mutations, accountingMutations } from "./semir-003-fixtures.mjs";

type Slot = { readonly caseId: string; readonly sourceSlot: string; readonly locatorId: string; readonly text: string };

const remapSourceSlots = (value: unknown, slots: ReadonlyMap<string, string>): unknown => {
  if (Array.isArray(value)) return value.map((item) => remapSourceSlots(item, slots));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "sourceSlot" && typeof item === "string" ? (slots.get(item) ?? item) : remapSourceSlots(item, slots)]));
};

/**
 * Materializes the authorized SEMIR-001 source strings as an actual v1
 * NormalizedDocument, then derives the harness slots only from parsed blocks.
 */
export function createNormalizedFixture() {
  const sourceText = knownGood.map(({ entry }) => entry.source.text).join("\n");
  const document = parseNormalizedDocument({
    version: "v1",
    executionId: "semir-004-fixture-perception",
    artifactId: "semir-004-fixture-document",
    sourceSha256: createHash("sha256").update(sourceText).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-semantic-ir-fixture", processor: "controlled-text", executionId: "semir-004-fixture-perception", processedAt: "2026-10-04T00:00:00.000Z" },
    pages: [{
      number: 1,
      textBlocks: knownGood.map(({ entry }, index) => ({ id: `semir-004-p1-b${String(index + 1).padStart(3, "0")}`, kind: "paragraph", text: entry.source.text })),
      tables: [],
      visualRegions: [],
    }],
  });
  const blocks = document.pages.flatMap((page) => page.textBlocks.map((block) => ({ page, block })));
  assert.equal(blocks.length, knownGood.length, "real normalized fixture must retain every authorized source unit");
  const slots: readonly Slot[] = knownGood.map(({ entry }, index) => {
    const { page, block } = blocks[index];
    assert.equal(block.text, entry.source.text, `${entry.id} must be derived from its parsed source unit`);
    return { caseId: entry.id, sourceSlot: `semir-004:${page.number}:${block.id}`, locatorId: block.id, text: block.text };
  });
  return { document, slots };
}

export function createQualificationFixtures() {
  const { document, slots } = createNormalizedFixture();
  const mappedSlots = new Map(slots.map((slot) => [slot.caseId, slot.sourceSlot]));
  const textBySlot = new Map(slots.map((slot) => [slot.sourceSlot, slot.text]));
  const remap = <T>(value: T): T => remapSourceSlots(structuredClone(value), mappedSlots) as T;
  return {
    document,
    slots,
    textBySlot,
    knownGood: knownGood.map((fixture) => ({ ...fixture, expected: remap(fixture.expected), observed: remap(fixture.observed) })),
    mutations: mutations.map((fixture) => ({ ...fixture, expected: remap(fixture.expected), observed: remap(fixture.observed) })),
    accountingMutations: accountingMutations.map((fixture) => ({ ...fixture, observed: remap(fixture.observed) })),
  };
}
