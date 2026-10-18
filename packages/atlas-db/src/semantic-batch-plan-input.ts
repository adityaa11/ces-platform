import { createHash } from "node:crypto";

type Row = Record<string, unknown>;
type ReadOnlySql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };

/**
 * The receiver-owned body for the future semantic batch planner.  It is only
 * an integrity-bound reference: parsing it does not redeem a document or
 * confer any Atlas, GHR, BSS, or provider authority.
 */
export type SemanticBatchPlanInputV1 = Readonly<{
  normalizedDocumentRef: string;
  perceptionExecutionId: string;
  sourceSha256: string;
  normalizedDocumentVersion: "v1";
  normalizedDocumentFingerprint: string;
}>;

export type SemanticBatchPlanInputFixtureV1 = Readonly<{
  input: SemanticBatchPlanInputV1;
  canonicalJson: string;
  canonicalJsonSha256: string;
  provenance: Readonly<{
    repositoryPath: "atlas.document_perception_execution -> atlas.extraction_bundle_document -> atlas.document -> atlas.normalized_document_cache";
    perceptionExecutionId: string;
    normalizedDocumentRef: string;
    sourceSha256: string;
    normalizedDocumentVersion: "v1";
    completionFingerprint: string;
  }>;
}>;

const maxBodyBytes = 2048;
const maxExecutionIdentityBytes = 200;
const hex64 = /^[a-f0-9]{64}$/;
const expectedKeys = ["normalizedDocumentRef", "perceptionExecutionId", "sourceSha256", "normalizedDocumentVersion", "normalizedDocumentFingerprint"] as const;

function reject(message: string): never {
  throw new Error(`SemanticBatchPlanInput/v1 is invalid: ${message}`);
}

function validate(value: unknown): SemanticBatchPlanInputV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) reject("body must be a plain object");
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(body, key)) || keys.some((key) => !expectedKeys.includes(key as typeof expectedKeys[number]))) reject("body fields are not exact");
  const normalizedDocumentRef = body.normalizedDocumentRef;
  const perceptionExecutionId = body.perceptionExecutionId;
  const sourceSha256 = body.sourceSha256;
  const normalizedDocumentVersion = body.normalizedDocumentVersion;
  const normalizedDocumentFingerprint = body.normalizedDocumentFingerprint;
  if (typeof normalizedDocumentRef !== "string" || !hex64.test(normalizedDocumentRef)) reject("normalizedDocumentRef must be lowercase 64-hex");
  if (typeof perceptionExecutionId !== "string" || Buffer.byteLength(perceptionExecutionId, "utf8") < 1 || Buffer.byteLength(perceptionExecutionId, "utf8") > maxExecutionIdentityBytes) reject("perceptionExecutionId is not a bounded nonempty identity");
  if (typeof sourceSha256 !== "string" || !hex64.test(sourceSha256)) reject("sourceSha256 must be lowercase 64-hex");
  if (normalizedDocumentVersion !== "v1") reject("normalizedDocumentVersion must be v1");
  if (typeof normalizedDocumentFingerprint !== "string" || !hex64.test(normalizedDocumentFingerprint)) reject("normalizedDocumentFingerprint must be lowercase 64-hex");
  return { normalizedDocumentRef, perceptionExecutionId, sourceSha256, normalizedDocumentVersion, normalizedDocumentFingerprint };
}

/** Serializes the sole canonical, five-field transport body. */
export function canonicalSemanticBatchPlanInputV1(input: SemanticBatchPlanInputV1): string {
  const valid = validate(input);
  return JSON.stringify({
    normalizedDocumentRef: valid.normalizedDocumentRef,
    perceptionExecutionId: valid.perceptionExecutionId,
    sourceSha256: valid.sourceSha256,
    normalizedDocumentVersion: valid.normalizedDocumentVersion,
    normalizedDocumentFingerprint: valid.normalizedDocumentFingerprint,
  });
}

/**
 * Parses only canonical JSON. Comparing the raw body with its prescribed
 * serialization rejects duplicate keys, prototype-bearing keys, whitespace,
 * reordered fields, and every noncanonical JSON lookalike before a typed
 * reference can leave this boundary.
 */
export function parseSemanticBatchPlanInputV1(body: string | Uint8Array): SemanticBatchPlanInputV1 {
  const raw = typeof body === "string" ? body : Buffer.from(body).toString("utf8");
  if (Buffer.byteLength(raw, "utf8") < 1 || Buffer.byteLength(raw, "utf8") > maxBodyBytes) reject("body exceeds the bounded size");
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    reject("body is not JSON");
  }
  const valid = validate(decoded);
  if (raw !== canonicalSemanticBatchPlanInputV1(valid)) reject("body is not canonical");
  return valid;
}

/**
 * Read-only fixture repository. It deliberately exposes no normalized source
 * document, media reference, resolver, or authorization grant; it merely
 * derives a test body from already accepted Atlas facts.
 */
export class PostgresAcceptedSemanticBatchPlanInputFixtureRepository {
  constructor(private readonly sql: ReadOnlySql) {}

  async derive(perceptionExecutionId: string): Promise<SemanticBatchPlanInputFixtureV1> {
    if (Buffer.byteLength(perceptionExecutionId, "utf8") < 1 || Buffer.byteLength(perceptionExecutionId, "utf8") > maxExecutionIdentityBytes) throw new Error("Accepted fixture identity is invalid.");
    const rows = await this.sql.unsafe(`SELECT
        cache.cache_key AS normalized_document_ref,
        execution.id AS perception_execution_id,
        document.source_sha256,
        cache.contract_version AS normalized_document_version,
        execution.completion_fingerprint
      FROM atlas.document_perception_execution execution
      JOIN atlas.extraction_bundle_document member
        ON member.perception_execution_id=execution.id
        AND member.document_id=execution.artifact_id
      JOIN atlas.document document
        ON document.id=execution.artifact_id
        AND document.project_id=member.project_id
        AND document.workspace_id=member.workspace_id
        AND document.source_sha256=execution.source_sha256
      JOIN atlas.normalized_document_cache cache
        ON cache.source_sha256=document.source_sha256
        AND cache.contract_version=execution.contract_version
        AND cache.capability='atlas.document.perceive'
        AND cache.capability_identity=execution.capability_identity
        AND cache.invalidated_at IS NULL
      WHERE execution.id=$1
        AND execution.state='completed'
        AND member.state='perceived'
        AND execution.contract_version='v1'
        AND cache.contract_version='v1'
        AND execution.completion_fingerprint ~ '^[a-f0-9]{64}$'
      ORDER BY cache.created_at DESC
      LIMIT 2`, [perceptionExecutionId]);
    if (rows.length !== 1) throw new Error("Accepted NormalizedDocument v1 fixture facts are unavailable or ambiguous.");
    const row = rows[0]!;
    const input = validate({
      normalizedDocumentRef: row.normalized_document_ref,
      perceptionExecutionId: row.perception_execution_id,
      sourceSha256: row.source_sha256,
      normalizedDocumentVersion: row.normalized_document_version,
      normalizedDocumentFingerprint: row.completion_fingerprint,
    });
    const canonicalJson = canonicalSemanticBatchPlanInputV1(input);
    return {
      input,
      canonicalJson,
      canonicalJsonSha256: createHash("sha256").update(canonicalJson).digest("hex"),
      provenance: {
        repositoryPath: "atlas.document_perception_execution -> atlas.extraction_bundle_document -> atlas.document -> atlas.normalized_document_cache",
        perceptionExecutionId: input.perceptionExecutionId,
        normalizedDocumentRef: input.normalizedDocumentRef,
        sourceSha256: input.sourceSha256,
        normalizedDocumentVersion: input.normalizedDocumentVersion,
        completionFingerprint: input.normalizedDocumentFingerprint,
      },
    };
  }
}
