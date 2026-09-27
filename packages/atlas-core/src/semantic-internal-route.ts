import { timingSafeEqual } from "node:crypto";
import { parseSemanticBackgroundJob, parseSemanticResultEnvelope, parseSemanticTechnicalFailure, semanticLimits } from "@atlas/contracts";
import type { SemanticAcceptanceHandler, SemanticAuthority } from "./semantic-authority.js";

export type InternalSemanticResponse = { readonly status: number; readonly body: unknown; readonly contentType: "application/json" };
const equal = (actual: string | undefined, expected: string) => {
  if (!actual) return false;
  const left = Buffer.from(actual); const right = Buffer.from(expected);
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
};
const bounded = (value: unknown, maximum: number) => { try { return Buffer.byteLength(JSON.stringify(value)) <= maximum; } catch { return false; } };

/** Framework-neutral Bridge-only semantic boundary. All failures are redacted. */
export function createSemanticInternalRoutes(options: { readonly authority: SemanticAuthority; readonly handler: SemanticAcceptanceHandler; readonly serviceCredential: string }) {
  if (Buffer.byteLength(options.serviceCredential) < 32) throw new Error("Bridge service credential must be at least 32 bytes.");
  const unauthorized = (): InternalSemanticResponse => ({ status: 401, body: { error: "Unauthorized internal service request." }, contentType: "application/json" });
  const invalid = (): InternalSemanticResponse => ({ status: 400, body: { error: "Invalid semantic internal request." }, contentType: "application/json" });
  const unavailable = (): InternalSemanticResponse => ({ status: 409, body: { error: "Semantic delivery cannot be accepted." }, contentType: "application/json" });
  return {
    async context(credential: string | undefined, body: unknown): Promise<InternalSemanticResponse> {
      if (!equal(credential, options.serviceCredential)) return unauthorized();
      try {
        if (!bounded(body, semanticLimits.jobBytes)) return invalid();
        const context = await options.authority.redeem(parseSemanticBackgroundJob(body));
        if (!bounded(context.context, semanticLimits.contextBytes)) return invalid();
        return { status: 200, body: context.context, contentType: "application/json" };
      } catch { return invalid(); }
    },
    async deliver(credential: string | undefined, body: unknown): Promise<InternalSemanticResponse> {
      if (!equal(credential, options.serviceCredential)) return unauthorized();
      try { if (!bounded(body, semanticLimits.resultEnvelopeBytes)) return invalid(); await options.authority.deliver(parseSemanticResultEnvelope(body), options.handler); return { status: 204, body: null, contentType: "application/json" }; } catch { return unavailable(); }
    },
    async fail(credential: string | undefined, body: unknown): Promise<InternalSemanticResponse> {
      if (!equal(credential, options.serviceCredential)) return unauthorized();
      try { if (!bounded(body, semanticLimits.jobBytes)) return invalid(); await options.authority.fail(parseSemanticTechnicalFailure(body)); return { status: 204, body: null, contentType: "application/json" }; } catch { return invalid(); }
    },
  };
}
