import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const slots = ["S1", "S2", "S3", "S4"] as const;
export type Slot = typeof slots[number];
export type FixtureSource = { readonly slot: Slot; readonly structuralKind: "paragraph" | "heading"; readonly text: string; readonly locatorId: string };

export const fixtureSources: readonly FixtureSource[] = [
  { slot: "S1", structuralKind: "paragraph", text: "The customer submits an order.", locatorId: "semspike-005-text-001" },
  { slot: "S2", structuralKind: "paragraph", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.", locatorId: "semspike-005-text-002" },
  { slot: "S3", structuralKind: "heading", text: "3.2 Purchase Rules", locatorId: "semspike-005-text-003" },
  { slot: "S4", structuralKind: "paragraph", text: "Approval may be required before processing.", locatorId: "semspike-005-text-004" },
];

export function createValidatedFixture() {
  return parseNormalizedDocument({
    version: "v1", executionId: "semspike-005-perception", artifactId: "semspike-005-fixture",
    sourceSha256: createHash("sha256").update(fixtureSources.map((source) => source.text).join("\n")).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-spike-fixture", processor: "controlled-text", executionId: "semspike-005-perception", processedAt: "2026-10-04T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: fixtureSources.map(({ structuralKind, text, locatorId }) => ({ id: locatorId, kind: structuralKind, text })), tables: [], visualRegions: [] }],
  });
}

export const providerInput = () => ({ sources: fixtureSources.map(({ slot, structuralKind, text }) => ({ sourceSlot: slot, structuralKind, text })) });
