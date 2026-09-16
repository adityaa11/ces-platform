import { parseDocumentPerceptionRequest, type DocumentPerceptionRequest } from "@atlas/contracts";

export const documentPerceptionQueue = "atlas-document-perception-v1";
export type DocumentPerceptionJob = { readonly idempotencyKey: string; readonly request: DocumentPerceptionRequest };

/** Parse the only supported perception queue payload; no raw source transport is permitted. */
export function parseDocumentPerceptionJob(value: unknown): DocumentPerceptionJob {
  if (!value || typeof value !== "object") throw new Error("Document perception job must be an object.");
  if (Object.keys(value).some((key) => key !== "idempotencyKey" && key !== "request")) throw new Error("Document perception job contains unsupported fields.");
  const candidate = value as { idempotencyKey?: unknown; request?: unknown };
  if (typeof candidate.idempotencyKey !== "string" || candidate.idempotencyKey.length < 1 || candidate.idempotencyKey.length > 200) throw new Error("Document perception job idempotencyKey must be between 1 and 200 characters.");
  const request = parseDocumentPerceptionRequest(candidate.request);
  return { idempotencyKey: candidate.idempotencyKey, request };
}
