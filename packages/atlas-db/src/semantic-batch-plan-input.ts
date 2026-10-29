/**
 * The receiver-owned five-field body for the retained semantic batch-plan
 * endpoint. It is an integrity-bound reference only: parsing it does not
 * redeem a document or confer Atlas, GHR, BSS, or provider authority.
 */
export type SemanticBatchPlanInputV1 = Readonly<{
  normalizedDocumentRef: string;
  perceptionExecutionId: string;
  sourceSha256: string;
  normalizedDocumentVersion: "v1";
  normalizedDocumentFingerprint: string;
}>;

const maxBodyBytes = 2_048;
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

/** Parses only canonical JSON and rejects every noncanonical lookalike. */
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
