import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const serviceIdentity = /^[a-z][a-z0-9.-]{0,127}\/v[1-9][0-9]*$/;
const sha256 = /^[a-f0-9]{64}$/;
const assetRef = /^derived\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DerivedImageGrantAuthorization =
  | { readonly kind: "semantic_execution"; readonly executionId: string }
  | { readonly kind: "offline_grant"; readonly offlineGrantId: string };

/**
 * The complete identity a service must present before it can obtain an
 * ephemeral derived-image read. It intentionally has no user cookie,
 * storage key, filesystem path, or byte payload.
 */
export type DerivedImageGrantScope = {
  readonly serviceIdentity: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly sourceSha256: string;
  readonly profile: string;
  readonly pageNumber: number;
  readonly locatorId: string;
  readonly assetRef: string;
  readonly manifestSha256: string;
  readonly mediaType: "image/png";
  readonly authorization: DerivedImageGrantAuthorization;
};

/** Atlas persistence owns the current execution/offline-grant decision. */
export interface DerivedImageGrantAuthority {
  assertAuthorized(scope: DerivedImageGrantScope): Promise<void>;
}

export type IssuedDerivedImageGrant = {
  readonly grant: string;
  readonly replayFenceId: string;
  readonly expiresAt: number;
};

type GrantRecord = { readonly scope: DerivedImageGrantScope; readonly replayFenceId: string; readonly expiresAt: number; consumed: boolean };

function object(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], message: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error(message);
}

function requiredIdentifier(value: unknown, message: string): string {
  if (typeof value !== "string" || !identifier.test(value)) throw new Error(message);
  return value;
}

function parseAuthorization(value: unknown): DerivedImageGrantAuthorization {
  const candidate = object(value, "Derived image grant authorization is invalid.");
  if (candidate.kind === "semantic_execution") {
    exactKeys(candidate, ["kind", "executionId"], "Derived image grant authorization is invalid.");
    return { kind: "semantic_execution", executionId: requiredIdentifier(candidate.executionId, "Derived image grant execution identity is invalid.") };
  }
  if (candidate.kind === "offline_grant") {
    exactKeys(candidate, ["kind", "offlineGrantId"], "Derived image grant authorization is invalid.");
    return { kind: "offline_grant", offlineGrantId: requiredIdentifier(candidate.offlineGrantId, "Derived image grant offline identity is invalid.") };
  }
  throw new Error("Derived image grant authorization is invalid.");
}

function parseScope(value: unknown): DerivedImageGrantScope {
  const candidate = object(value, "Derived image grant scope is invalid.");
  exactKeys(candidate, ["serviceIdentity", "tenantId", "projectId", "documentId", "documentVersion", "sourceSha256", "profile", "pageNumber", "locatorId", "assetRef", "manifestSha256", "mediaType", "authorization"], "Derived image grant scope is invalid.");
  if (typeof candidate.serviceIdentity !== "string" || !serviceIdentity.test(candidate.serviceIdentity)) throw new Error("Derived image grant service identity is invalid.");
  if (typeof candidate.sourceSha256 !== "string" || !sha256.test(candidate.sourceSha256) || typeof candidate.manifestSha256 !== "string" || !sha256.test(candidate.manifestSha256)) throw new Error("Derived image grant hash identity is invalid.");
  if (typeof candidate.assetRef !== "string" || !assetRef.test(candidate.assetRef)) throw new Error("Derived image grant asset reference is invalid.");
  if (candidate.mediaType !== "image/png") throw new Error("Derived image grant media type is unsupported.");
  if (typeof candidate.pageNumber !== "number" || !Number.isInteger(candidate.pageNumber) || candidate.pageNumber < 1) throw new Error("Derived image grant page identity is invalid.");
  return {
    serviceIdentity: candidate.serviceIdentity,
    tenantId: requiredIdentifier(candidate.tenantId, "Derived image grant tenant identity is invalid."),
    projectId: requiredIdentifier(candidate.projectId, "Derived image grant project identity is invalid."),
    documentId: requiredIdentifier(candidate.documentId, "Derived image grant document identity is invalid."),
    documentVersion: requiredIdentifier(candidate.documentVersion, "Derived image grant document version is invalid."),
    sourceSha256: candidate.sourceSha256,
    profile: requiredIdentifier(candidate.profile, "Derived image grant profile identity is invalid."),
    pageNumber: candidate.pageNumber,
    locatorId: requiredIdentifier(candidate.locatorId, "Derived image grant locator identity is invalid."),
    assetRef: candidate.assetRef,
    manifestSha256: candidate.manifestSha256,
    mediaType: candidate.mediaType,
    authorization: parseAuthorization(candidate.authorization),
  };
}

function equalScope(left: DerivedImageGrantScope, right: DerivedImageGrantScope): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Issues and consumes opaque, single-use service grants. This is deliberately
 * an authorization seam only: it cannot open storage, resolve a browser
 * session, enqueue work, or retrieve media.
 */
export class DerivedImageGrantIssuer {
  readonly #grants = new Map<string, GrantRecord>();

  constructor(private readonly secret: Uint8Array | string, private readonly expectedServiceIdentity: string, private readonly now: () => number = Date.now) {
    if (Buffer.byteLength(secret) < 32) throw new Error("Derived image grant secret must be at least 32 bytes.");
    if (!serviceIdentity.test(expectedServiceIdentity)) throw new Error("Derived image grant service identity is invalid.");
  }

  async issue(input: unknown, authority: DerivedImageGrantAuthority, lifetimeMilliseconds = 60_000): Promise<IssuedDerivedImageGrant> {
    const scope = parseScope(input);
    if (scope.serviceIdentity !== this.expectedServiceIdentity) throw new Error("Derived image grant service identity is unauthorized.");
    if (!Number.isInteger(lifetimeMilliseconds) || lifetimeMilliseconds < 1 || lifetimeMilliseconds > 5 * 60_000) throw new Error("Derived image grant lifetime must be between 1ms and 5 minutes.");
    await authority.assertAuthorized(scope);
    const grantId = randomUUID();
    const replayFenceId = randomUUID();
    const expiresAt = this.now() + lifetimeMilliseconds;
    this.#grants.set(grantId, { scope, replayFenceId, expiresAt, consumed: false });
    return { grant: this.format(grantId), replayFenceId, expiresAt };
  }

  async redeem(input: unknown, authority: DerivedImageGrantAuthority): Promise<DerivedImageGrantScope> {
    const candidate = object(input, "Derived image grant redemption is invalid.");
    exactKeys(candidate, ["grant", "replayFenceId", "scope"], "Derived image grant redemption is invalid.");
    if (typeof candidate.grant !== "string" || typeof candidate.replayFenceId !== "string" || !uuid.test(candidate.replayFenceId)) throw new Error("Derived image grant redemption is invalid.");
    const scope = parseScope(candidate.scope);
    if (scope.serviceIdentity !== this.expectedServiceIdentity) throw new Error("Derived image grant service identity is unauthorized.");
    const grantId = this.verify(candidate.grant);
    const record = this.#grants.get(grantId);
    if (!record) throw new Error("Derived image grant is unavailable.");
    if (record.expiresAt <= this.now()) { this.#grants.delete(grantId); throw new Error("Derived image grant is expired."); }
    if (record.consumed || record.replayFenceId !== candidate.replayFenceId) throw new Error("Derived image grant replay is blocked.");
    if (!equalScope(record.scope, scope)) throw new Error("Derived image grant scope mismatch.");
    // Claim synchronously before authority validation yields to another redemption.
    // A failed recheck deliberately leaves this in-memory replay fence consumed.
    record.consumed = true;
    await authority.assertAuthorized(record.scope);
    return record.scope;
  }

  format(grantId: string): string {
    if (!uuid.test(grantId)) throw new Error("Derived image grant ID is invalid.");
    return `${grantId}.${createHmac("sha256", this.secret).update(grantId).digest("hex")}`;
  }

  private verify(grant: string): string {
    const [grantId, signature, ...extra] = grant.split(".");
    if (!grantId || !signature || extra.length || !uuid.test(grantId) || !/^[a-f0-9]{64}$/i.test(signature)) throw new Error("Derived image grant is invalid.");
    const expected = createHmac("sha256", this.secret).update(grantId).digest("hex");
    const actualBytes = Buffer.from(signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (actualBytes.byteLength !== expectedBytes.byteLength || !timingSafeEqual(actualBytes, expectedBytes)) throw new Error("Derived image grant is invalid.");
    return grantId;
  }
}
