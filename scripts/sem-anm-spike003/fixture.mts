import { createHash } from "node:crypto";
import { parseNormalizedDocument } from "@atlas/contracts";

export const SOURCES = [
  { slot: "S1", text: "The customer submits an order.", locatorId: "anm3-s1" },
  { slot: "S2", text: "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.", locatorId: "anm3-s2" },
  { slot: "S3", text: "3.2 Purchase Rules", locatorId: "anm3-s3" },
  { slot: "S4", text: "Approval may be required before processing.", locatorId: "anm3-s4" },
] as const;

export const normalizedDocument = parseNormalizedDocument({
  version: "v1", executionId: "sem-anm-spike003-fixture-execution", artifactId: "sem-anm-spike003-fixture-document",
  sourceSha256: createHash("sha256").update(SOURCES.map(({ text }) => text).join("\n")).digest("hex"),
  perception: { capability: "atlas.document.perceive", contractVersion: "v1" },
  provider: { name: "synthetic", processor: "sem-anm-spike003-fixture", executionId: "sem-anm-spike003-fixture-execution", processedAt: "2026-10-05T00:00:00.000Z" },
  pages: [{ number: 1, textBlocks: SOURCES.map(({ text, locatorId }) => ({ id: locatorId, text })), tables: [], visualRegions: [] }],
});

export const slots = SOURCES.map(({ slot, text }) => ({ slot, text }));
export const userPayload = slots.map(({ slot, text }) => `${slot}:\n${text}`).join("\n\n");
export const fixtureSha256 = createHash("sha256").update(JSON.stringify(normalizedDocument)).digest("hex");
