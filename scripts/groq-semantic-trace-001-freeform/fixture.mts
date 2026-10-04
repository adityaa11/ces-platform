import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const userMessage = `S1: The customer submits an order.

S2: Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.

S3: 3.2 Purchase Rules

S4: Approval may be required before processing.`;

const sources = [
  { id: "semtrace-001-freeform-source-1", kind: "paragraph", text: "The customer submits an order." },
  { id: "semtrace-001-freeform-source-2", kind: "paragraph", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan." },
  { id: "semtrace-001-freeform-source-3", kind: "heading", text: "3.2 Purchase Rules" },
  { id: "semtrace-001-freeform-source-4", kind: "paragraph", text: "Approval may be required before processing." },
] as const;

export function createValidatedFixture() {
  return parseNormalizedDocument({
    version: "v1", executionId: "semtrace-001-freeform-perception", artifactId: "semtrace-001-freeform-fixture",
    sourceSha256: createHash("sha256").update(sources.map(({ text }) => text).join("\n")).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: { name: "atlas-spike-fixture", processor: "controlled-text", executionId: "semtrace-001-freeform-perception", processedAt: "2026-10-04T00:00:00.000Z" },
    pages: [{ number: 1, textBlocks: sources.map(({ id, kind, text }) => ({ id, kind, text })), tables: [], visualRegions: [] }],
  });
}
