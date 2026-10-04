import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const slots = ["S1", "S2", "S3", "S4"] as const;
export type Slot = (typeof slots)[number];

const fixtureSources = [
  { slot: "S1", kind: "paragraph", text: "The customer submits an order.", id: "semtrace-001-source-1" },
  { slot: "S2", kind: "paragraph", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.", id: "semtrace-001-source-2" },
  { slot: "S3", kind: "heading", text: "3.2 Purchase Rules", id: "semtrace-001-source-3" },
  { slot: "S4", kind: "paragraph", text: "Approval may be required before processing.", id: "semtrace-001-source-4" },
] as const;

export function createValidatedFixture() {
  return parseNormalizedDocument({
    version: "v1", executionId: "semtrace-001-perception", artifactId: "semtrace-001-fixture",
    sourceSha256: createHash("sha256").update(fixtureSources.map(({ text }) => text).join("\n")).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-spike-fixture", processor: "controlled-text", executionId: "semtrace-001-perception", processedAt: "2026-10-04T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: fixtureSources.map(({ id, kind, text }) => ({ id, kind, text })), tables: [], visualRegions: [] }],
  });
}

/** This is intentionally data-only: no policy, instruction, or oracle reaches the provider here. */
export function providerInput() {
  return { sources: fixtureSources.map(({ slot, text }) => ({ slot, text })) };
}
