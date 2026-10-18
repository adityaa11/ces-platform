import { createHash } from "node:crypto";
import { parseNormalizedDocument, type NormalizedDocument } from "@atlas/core";

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
const opaqueIdentity = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalize(item)]));
  return value;
}

function normalizedFingerprint(value: NormalizedDocument): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

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

export type AcceptedDocumentResolverScope = Readonly<{
  /** Set only by the authenticated Atlas boundary, never by the five-field body. */
  callerUserId: string;
  /** Opaque authenticated Atlas session; checked for expiry on every redemption. */
  callerSessionToken: string;
  projectId: string;
  workspaceId: string;
  bundleId: string;
  documentId: string;
}>;

export type AcceptedDocumentPlannerResultV1 = Readonly<{
  scope: Omit<AcceptedDocumentResolverScope, "callerUserId" | "callerSessionToken">;
  normalizedDocument: NormalizedDocument;
  source: Readonly<{ documentId: string; sourceSha256: string }>;
  media: ReadonlyArray<Readonly<{ assetRef: string; locatorId: string; pageNumber: number; mediaType: "image/png"; sha256: string; byteLength: number }>>;
  /** NormalizedDocument v1 has no REL graph. Do not fabricate one. */
  rel: Readonly<{ state: "unavailable" }>;
}>;

/**
 * Atlas-owned, authenticated redemption of a previously parsed five-field
 * body. The only authorization input is the server-authenticated caller and
 * explicit project/workspace/bundle/document scope; hashes are integrity
 * bindings, never permissions. This adapter performs SELECTs only.
 */
export class PostgresAcceptedSemanticBatchPlanDocumentResolver {
  constructor(private readonly sql: ReadOnlySql) {}

  async resolve(scope: AcceptedDocumentResolverScope, input: SemanticBatchPlanInputV1): Promise<AcceptedDocumentPlannerResultV1> {
    if (![scope.callerUserId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId].every((value) => opaqueIdentity.test(value)) || Buffer.byteLength(scope.callerSessionToken, "utf8") < 1 || Buffer.byteLength(scope.callerSessionToken, "utf8") > 500) throw new Error("Accepted document resolver scope is invalid.");
    const valid = validate(input);
    const rows = await this.sql.unsafe(`SELECT cache.normalized_document, cache.derived_assets
      FROM atlas.document_perception_execution execution
      JOIN atlas.extraction_bundle_document member
        ON member.perception_execution_id=execution.id
        AND member.document_id=execution.artifact_id
      JOIN atlas.extraction_bundle bundle
        ON bundle.id=member.bundle_id AND bundle.project_id=member.project_id AND bundle.workspace_id=member.workspace_id
      JOIN atlas.document document
        ON document.id=member.document_id AND document.project_id=member.project_id AND document.workspace_id=member.workspace_id
      JOIN atlas.project_member membership
        ON membership.project_id=document.project_id AND membership.user_id=$1
      JOIN auth."session" session
        ON session."userId"=membership.user_id AND session.token=$10 AND session."expiresAt">now()
      JOIN atlas.normalized_document_cache cache
        ON cache.cache_key=$6 AND cache.source_sha256=document.source_sha256
        AND cache.contract_version='v1' AND cache.capability='atlas.document.perceive'
        AND cache.capability_identity=execution.capability_identity AND cache.invalidated_at IS NULL
      WHERE execution.id=$7 AND execution.state='completed'
        AND execution.completion_fingerprint=$8
        AND execution.source_sha256=$9 AND document.source_sha256=$9
        AND member.project_id=$2 AND member.workspace_id=$3 AND member.bundle_id=$4 AND member.document_id=$5
        AND member.state='perceived'
        AND bundle.state='processing'
      LIMIT 2`, [scope.callerUserId, scope.projectId, scope.workspaceId, scope.bundleId, scope.documentId, valid.normalizedDocumentRef, valid.perceptionExecutionId, valid.normalizedDocumentFingerprint, valid.sourceSha256, scope.callerSessionToken]);
    if (rows.length !== 1) throw new Error("Accepted normalized document is unavailable or unauthorized.");
    const normalized = parseNormalizedDocument(typeof rows[0]!.normalized_document === "string" ? JSON.parse(String(rows[0]!.normalized_document)) : rows[0]!.normalized_document);
    if (normalized.executionId !== valid.perceptionExecutionId || normalized.artifactId !== scope.documentId || normalized.sourceSha256 !== valid.sourceSha256 || normalized.version !== valid.normalizedDocumentVersion || normalizedFingerprint(normalized) !== valid.normalizedDocumentFingerprint) throw new Error("Accepted normalized document integrity binding is invalid.");
    const expectedAssets = normalized.pages.flatMap((page) => page.visualRegions.flatMap((region) => region.assetRef ? [{ assetRef: region.assetRef, locatorId: region.id, pageNumber: page.number }] : []));
    if (new Set(expectedAssets.map((asset) => asset.assetRef)).size !== expectedAssets.length) throw new Error("Accepted normalized document has duplicate media references.");
    const cachedAssets = typeof rows[0]!.derived_assets === "string" ? JSON.parse(String(rows[0]!.derived_assets)) : rows[0]!.derived_assets;
    if (!Array.isArray(cachedAssets) || cachedAssets.length !== expectedAssets.length || new Set(cachedAssets).size !== cachedAssets.length || cachedAssets.some((asset) => typeof asset !== "string") || [...cachedAssets].sort().join("\n") !== expectedAssets.map((asset) => asset.assetRef).sort().join("\n")) throw new Error("Accepted normalized document media binding is invalid.");
    const mediaRows = expectedAssets.length ? await this.sql.unsafe(`SELECT manifest.asset_ref, manifest.locator_id, manifest.page_number, manifest.media_type, manifest.sha256, manifest.byte_size
      FROM atlas.document_perception_derived_manifest manifest
      JOIN atlas.document_perception_derived_asset asset ON asset.cache_key=$1 AND asset.asset_ref=manifest.asset_ref AND asset.deleted_at IS NULL
      WHERE manifest.execution_id=$2 AND manifest.artifact_id=$3 AND manifest.source_sha256=$4
        AND manifest.asset_ref=ANY($5::text[]) AND manifest.accepted_at IS NOT NULL
      ORDER BY manifest.asset_ref`, [valid.normalizedDocumentRef, valid.perceptionExecutionId, scope.documentId, valid.sourceSha256, expectedAssets.map((asset) => asset.assetRef)]) : [];
    if (mediaRows.length !== expectedAssets.length || mediaRows.some((row) => row.media_type !== "image/png" || !expectedAssets.some((asset) => asset.assetRef === row.asset_ref && asset.locatorId === row.locator_id && asset.pageNumber === Number(row.page_number)))) throw new Error("Accepted normalized document media is unavailable or unauthorized.");
    return {
      scope: { projectId: scope.projectId, workspaceId: scope.workspaceId, bundleId: scope.bundleId, documentId: scope.documentId },
      normalizedDocument: normalized,
      source: { documentId: scope.documentId, sourceSha256: valid.sourceSha256 },
      media: mediaRows.map((row) => ({ assetRef: String(row.asset_ref), locatorId: String(row.locator_id), pageNumber: Number(row.page_number), mediaType: "image/png" as const, sha256: String(row.sha256), byteLength: Number(row.byte_size) })),
      rel: { state: "unavailable" },
    };
  }
}
