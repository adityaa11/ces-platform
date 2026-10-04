import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "../../packages/atlas-contracts/src/index.ts";

export const sources = [
  { slot: "S1", text: "The customer submits an order." },
  { slot: "S2", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan." },
  { slot: "S3", text: "3.2 Purchase Rules" },
  { slot: "S4", text: "Approval may be required before processing." },
] as const;

export const userMessage = JSON.stringify({ sources });

export function createValidatedFixture() {
  const blocks = sources.map((source, index) => ({
    id: `semspike-004-source-${index + 1}`,
    kind: index === 2 ? "heading" : "paragraph",
    text: source.text,
  }));
  const sourceText = sources.map(({ text }) => text).join("\n");
  return parseNormalizedDocument({
    version: "v1",
    executionId: "semspike-004-perception",
    artifactId: "semspike-004-fixture",
    sourceSha256: createHash("sha256").update(sourceText).digest("hex"),
    perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
    provider: {
      name: "atlas-spike-fixture",
      processor: "controlled-text",
      executionId: "semspike-004-perception",
      processedAt: "2026-10-04T00:00:00.000Z",
    },
    pages: [{ number: 1, textBlocks: blocks, tables: [], visualRegions: [] }],
  });
}
