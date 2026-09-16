import { createHash } from "node:crypto";
import { documentPerceptionContractVersion, parseDocumentPerceptionRequest, parseNormalizedDocument, type DocumentPerceptionRequest, type NormalizedDocument } from "@atlas/contracts";
import { PerceptionSourceGrantIssuer, type PerceptionSourceIdentity } from "./source-grant.js";
import { readVerifiedPerceptionSource, type SourceReader } from "./source-handoff.js";

export type PerceptionOperationState = "queued" | "fetching_source" | "perceiving" | "normalizing" | "delivering_result" | "completed" | "failed" | "cancelled";
export type StartPerceptionOperation = PerceptionSourceIdentity & { readonly idempotencyKey: string };
export type PerceptionOperation = {
  readonly executionId: string;
  readonly artifactId: string;
  readonly sourceSha256: string;
  readonly state: PerceptionOperationState;
  readonly result?: NormalizedDocument;
};

type StoredOperation = StartPerceptionOperation & { readonly request: DocumentPerceptionRequest; state: PerceptionOperationState; completionFingerprint?: string; result?: NormalizedDocument };

/**
 * Atlas-owned operational handoff. HTTP route authentication is intentionally
 * outside this class: callers are given only the capability to redeem one
 * grant or deliver one schema-valid result for a known execution.
 */
export class AtlasPerceptionHandoff {
  readonly #operations = new Map<string, StoredOperation>();
  readonly #cache = new Map<string, NormalizedDocument>();

  constructor(private readonly grants: PerceptionSourceGrantIssuer, private readonly sources: SourceReader, private readonly maximumBytes = 20 * 1024 * 1024) {}

  start(input: StartPerceptionOperation): DocumentPerceptionRequest {
    if (!input.idempotencyKey || input.idempotencyKey.length > 200) throw new Error("Perception idempotency key must be between 1 and 200 characters.");
    const prior = this.#operations.get(input.executionId);
    if (prior) {
      if (prior.idempotencyKey !== input.idempotencyKey || prior.artifactId !== input.artifactId || prior.sourceSha256 !== input.sourceSha256) throw new Error("Perception execution identity conflicts with an existing operation.");
      return prior.request;
    }
    const grant = this.grants.issue(input);
    const request = parseDocumentPerceptionRequest({
      version: documentPerceptionContractVersion,
      executionId: input.executionId,
      artifact: { id: input.artifactId, sourceSha256: input.sourceSha256, mimeType: input.mimeType, byteSize: input.byteSize },
      source: { grant },
      perception: { capability: "atlas.document.perceive", contractVersion: documentPerceptionContractVersion },
    });
    this.#operations.set(input.executionId, { ...input, request, state: "queued" });
    return request;
  }

  async redeem(requestInput: unknown): Promise<{ readonly bytes: Uint8Array; readonly mimeType: "application/pdf" }> {
    const request = parseDocumentPerceptionRequest(requestInput);
    const operation = this.#operationFor(request);
    if (operation.state === "completed" || operation.state === "cancelled") throw new Error("Perception source redemption is stale.");
    const redeemed = this.grants.redeem(request.source.grant, { executionId: request.executionId, artifactId: request.artifact.id });
    if (redeemed.sourceSha256 !== request.artifact.sourceSha256 || redeemed.mimeType !== request.artifact.mimeType || redeemed.byteSize !== request.artifact.byteSize) throw new Error("Perception source grant identity mismatch.");
    operation.state = "fetching_source";
    return readVerifiedPerceptionSource(this.sources, operation, this.maximumBytes);
  }

  deliver(requestInput: unknown, resultInput: unknown): void {
    const request = parseDocumentPerceptionRequest(requestInput);
    const result = parseNormalizedDocument(resultInput);
    const operation = this.#operationFor(request);
    if (result.executionId !== request.executionId || result.artifactId !== request.artifact.id || result.sourceSha256 !== request.artifact.sourceSha256 || result.perception.capability !== request.perception.capability || result.perception.contractVersion !== request.perception.contractVersion) throw new Error("Perception result does not match its execution identity.");
    const fingerprint = createHash("sha256").update(JSON.stringify(result)).digest("hex");
    if (operation.state === "completed") {
      if (operation.completionFingerprint === fingerprint) return;
      throw new Error("Perception result is stale or conflicts with the completed execution.");
    }
    if (operation.state === "cancelled") throw new Error("Perception result is stale.");
    operation.state = "delivering_result";
    this.#cache.set(this.#cacheKey(result), result);
    operation.completionFingerprint = fingerprint;
    operation.result = result;
    operation.state = "completed";
  }

  getOperation(executionId: string): PerceptionOperation | undefined {
    const operation = this.#operations.get(executionId);
    return operation && { executionId: operation.executionId, artifactId: operation.artifactId, sourceSha256: operation.sourceSha256, state: operation.state, ...(operation.result ? { result: operation.result } : {}) };
  }

  getCached(result: Pick<NormalizedDocument, "sourceSha256" | "perception">): NormalizedDocument | undefined { return this.#cache.get(this.#cacheKey(result)); }

  #operationFor(request: DocumentPerceptionRequest): StoredOperation {
    const operation = this.#operations.get(request.executionId);
    if (!operation || operation.artifactId !== request.artifact.id || operation.sourceSha256 !== request.artifact.sourceSha256 || operation.request.source.grant !== request.source.grant) throw new Error("Perception execution is stale or unauthorized.");
    return operation;
  }

  #cacheKey(result: Pick<NormalizedDocument, "sourceSha256" | "perception">): string { return `${result.sourceSha256}:${result.perception.contractVersion}:${result.perception.capability}`; }
}
