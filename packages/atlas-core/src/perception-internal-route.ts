import { timingSafeEqual } from "node:crypto";
import { parseDocumentPerceptionRequest, parseNormalizedDocument } from "@atlas/contracts";
import { readVerifiedPerceptionSource, type SourceReader } from "./source-handoff.js";
import type { PerceptionAuthority } from "./perception-authority.js";

export type InternalPerceptionResponse = { readonly status: number; readonly body: Uint8Array | { readonly error: string }; readonly contentType: string };

const constantTimeEqual = (actual: string | undefined, expected: string) => {
  if (!actual) return false;
  const left = Buffer.from(actual); const right = Buffer.from(expected);
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
};

/**
 * Framework-neutral implementation of Atlas's Bridge-only internal routes.
 * The web host must apply the stated request byte limit before JSON parsing.
 */
export function createPerceptionInternalRoutes(options: { readonly authority: PerceptionAuthority; readonly sources: SourceReader; readonly serviceCredential: string; readonly maximumSourceBytes?: number; readonly maximumResultBytes?: number }) {
  if (Buffer.byteLength(options.serviceCredential) < 32) throw new Error("Bridge service credential must be at least 32 bytes.");
  const maximumSourceBytes = options.maximumSourceBytes ?? 20 * 1024 * 1024;
  const maximumResultBytes = options.maximumResultBytes ?? 10 * 1024 * 1024;
  const exceedsBodyLimit = (body: unknown, maximumBytes: number) => {
    try { return Buffer.byteLength(JSON.stringify(body)) > maximumBytes; } catch { return true; }
  };
  const unauthorized = (): InternalPerceptionResponse => ({ status: 401, body: { error: "Unauthorized internal service request." }, contentType: "application/json" });
  const badRequest = (): InternalPerceptionResponse => ({ status: 400, body: { error: "Invalid perception internal request." }, contentType: "application/json" });
  return {
    async redeem(credential: string | undefined, body: unknown): Promise<InternalPerceptionResponse> {
      if (!constantTimeEqual(credential, options.serviceCredential)) return unauthorized();
      try {
        if (exceedsBodyLimit(body, 16 * 1024)) return badRequest();
        const request = parseDocumentPerceptionRequest(body);
        const source = await options.authority.redeem(request);
        const verified = await readVerifiedPerceptionSource(options.sources, source, maximumSourceBytes);
        return { status: 200, body: verified.bytes, contentType: verified.mimeType };
      } catch { return badRequest(); }
    },
    async deliver(credential: string | undefined, requestBody: unknown, resultBody: unknown): Promise<InternalPerceptionResponse> {
      if (!constantTimeEqual(credential, options.serviceCredential)) return unauthorized();
      try {
        if (exceedsBodyLimit(requestBody, 16 * 1024) || exceedsBodyLimit(resultBody, maximumResultBytes)) return badRequest();
        const request = parseDocumentPerceptionRequest(requestBody);
        const result = parseNormalizedDocument(resultBody);
        if (result.provider.executionId !== request.executionId) return badRequest();
        await options.authority.deliver(request, result);
        return { status: 204, body: new Uint8Array(), contentType: "application/json" };
      } catch { return badRequest(); }
    },
  };
}
