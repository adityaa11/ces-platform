import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const slots = ["S1", "S2", "S3", "S4"] as const;
export type Slot = typeof slots[number];
export type FixtureSource = { readonly slot: Slot; readonly structuralKind: "paragraph" | "heading"; readonly text: string; readonly locatorId: string };

export const fixtureSources: readonly FixtureSource[] = [
  { slot: "S1", structuralKind: "paragraph", text: "The customer submits an order.", locatorId: "sem-anm-spike001-text-001" },
  { slot: "S2", structuralKind: "paragraph", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.", locatorId: "sem-anm-spike001-text-002" },
  { slot: "S3", structuralKind: "heading", text: "3.2 Purchase Rules", locatorId: "sem-anm-spike001-text-003" },
  { slot: "S4", structuralKind: "paragraph", text: "Approval may be required before processing.", locatorId: "sem-anm-spike001-text-004" },
];

export function createValidatedFixture() {
  return parseNormalizedDocument({
    version: "v1", executionId: "sem-anm-spike001-perception", artifactId: "sem-anm-spike001-fixture",
    sourceSha256: createHash("sha256").update(fixtureSources.map((source) => source.text).join("\n")).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-spike-fixture", processor: "controlled-text", executionId: "sem-anm-spike001-perception", processedAt: "2026-10-05T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: fixtureSources.map(({ structuralKind, text, locatorId }) => ({ id: locatorId, kind: structuralKind, text })), tables: [], visualRegions: [] }],
  });
}

export const providerInput = () => ({ sources: fixtureSources.map(({ slot, structuralKind, text }) => ({ sourceSlot: slot, structuralKind, text })) });
