import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const slots = ["S1", "S2", "S3", "S4"] as const;
export type Slot = typeof slots[number];
export type FixtureSource = { readonly slot: Slot; readonly structural_kind: "paragraph" | "heading"; readonly text: string; readonly locator_id: string };

export const fixtureSources: readonly FixtureSource[] = [
  { slot: "S1", structural_kind: "paragraph", text: "The customer submits an order.", locator_id: "spike-text-001" },
  { slot: "S2", structural_kind: "paragraph", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.", locator_id: "spike-text-002" },
  { slot: "S3", structural_kind: "heading", text: "3.2 Purchase Rules", locator_id: "spike-text-003" },
  { slot: "S4", structural_kind: "paragraph", text: "Approval may be required before processing.", locator_id: "spike-text-004" },
];

export function createValidatedFixture() {
  const document = {
    version: "v1", executionId: "semspike-001-perception", artifactId: "semspike-001-fixture",
    sourceSha256: createHash("sha256").update(fixtureSources.map((source) => source.text).join("\n")).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-spike-fixture", processor: "controlled-text", executionId: "semspike-001-perception", processedAt: "2026-10-03T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: fixtureSources.map(({ structural_kind, text, locator_id }) => ({ id: locator_id, text, kind: structural_kind })), tables: [], visualRegions: [] }],
  } as const;
  return parseNormalizedDocument(document);
}

export function providerInput() {
  return { sources: fixtureSources.map(({ slot, structural_kind, text }) => ({ slot: Number(slot.slice(1)), structural_kind, text })) };
}
