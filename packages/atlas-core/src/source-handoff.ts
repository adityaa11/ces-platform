import { createHash } from "node:crypto";

export type ImmutablePerceptionSource = { readonly storageKey: string; readonly sourceSha256: string; readonly mimeType: "application/pdf"; readonly byteSize: number };
export type SourceReader = { read(storageKey: string): Promise<Uint8Array> };

/** Atlas-only source boundary. Callers receive no storage key and bytes are checked before provider submission. */
export async function readVerifiedPerceptionSource(reader: SourceReader, source: ImmutablePerceptionSource, maximumBytes: number): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> {
  if (source.mimeType !== "application/pdf") throw new Error("Unsupported perception source MIME type.");
  if (!Number.isInteger(source.byteSize) || source.byteSize < 1 || source.byteSize > maximumBytes) throw new Error("Perception source exceeds the configured byte limit.");
  const bytes = await reader.read(source.storageKey);
  if (bytes.byteLength !== source.byteSize) throw new Error("Perception source byte-size mismatch.");
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== source.sourceSha256) throw new Error("Perception source SHA-256 mismatch.");
  return { bytes, mimeType: source.mimeType };
}
