import { createHash } from "node:crypto";
import type { DerivedImageGrantAuthority, DerivedImageGrantIssuer, DerivedImageGrantScope } from "./derived-image-grant.js";

const maximumDerivedImageBytes = 10 * 1024 * 1024;
const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

export type DerivedImageManifest = {
  readonly documentId: string;
  readonly documentVersion: string;
  readonly sourceSha256: string;
  readonly profile: string;
  readonly pageNumber: number;
  readonly locatorId: string;
  readonly assetRef: string;
  readonly manifestSha256: string;
  readonly mediaType: "image/png";
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly sha256: string;
};

/** Atlas-owned storage boundary. It accepts only a redeemed grant scope, never a path or caller credential. */
export interface DerivedImageAssetReader {
  read(scope: DerivedImageGrantScope, signal: AbortSignal): Promise<{ readonly manifest: DerivedImageManifest; readonly bytes: Uint8Array }>;
}

export type HydratedDerivedImage = {
  readonly mediaType: "image/png";
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly sha256: string;
  /** Ephemeral caller-owned bytes. This hydrator retains no byte state. */
  readonly bytes: Uint8Array;
};

function canonicalManifest(manifest: Omit<DerivedImageManifest, "manifestSha256">): string {
  return JSON.stringify({
    documentId: manifest.documentId,
    documentVersion: manifest.documentVersion,
    sourceSha256: manifest.sourceSha256,
    profile: manifest.profile,
    pageNumber: manifest.pageNumber,
    locatorId: manifest.locatorId,
    assetRef: manifest.assetRef,
    mediaType: manifest.mediaType,
    width: manifest.width,
    height: manifest.height,
    byteLength: manifest.byteLength,
    sha256: manifest.sha256,
  });
}

/** Stable manifest identity used by both the scoped grant and the retained-image reader. */
export function createDerivedImageManifestSha256(manifest: Omit<DerivedImageManifest, "manifestSha256">): string {
  return createHash("sha256").update(canonicalManifest(manifest)).digest("hex");
}

function abortIfNeeded(signal: AbortSignal): void {
  if (signal.aborted) throw new Error("Ephemeral image hydration was cancelled.");
}

function pngDimensions(bytes: Uint8Array): { readonly width: number; readonly height: number } {
  if (bytes.byteLength < 24 || !pngSignature.every((value, index) => bytes[index] === value)) throw new Error("invalid PNG");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") throw new Error("invalid PNG");
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (!width || !height) throw new Error("invalid PNG");
  return { width, height };
}

function matchesScope(manifest: DerivedImageManifest, scope: DerivedImageGrantScope): boolean {
  return manifest.documentId === scope.documentId
    && manifest.documentVersion === scope.documentVersion
    && manifest.sourceSha256 === scope.sourceSha256
    && manifest.profile === scope.profile
    && manifest.pageNumber === scope.pageNumber
    && manifest.locatorId === scope.locatorId
    && manifest.assetRef === scope.assetRef
    && manifest.manifestSha256 === scope.manifestSha256
    && manifest.mediaType === scope.mediaType;
}

/**
 * Redeems an approved grant into one bounded, verified in-memory PNG.  It has
 * no persistence, logging, provider, job, or browser-session capability.
 */
export class EphemeralDerivedImageHydrator {
  constructor(
    private readonly grants: DerivedImageGrantIssuer,
    private readonly grantAuthority: DerivedImageGrantAuthority,
    private readonly assets: DerivedImageAssetReader,
    private readonly maximumBytes = maximumDerivedImageBytes,
  ) {
    if (!Number.isInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > maximumDerivedImageBytes) throw new Error("Derived image hydration limit is invalid.");
  }

  async hydrate(redemption: unknown, signal: AbortSignal): Promise<HydratedDerivedImage> {
    abortIfNeeded(signal);
    try {
      const scope = await this.grants.redeem(redemption, this.grantAuthority);
      abortIfNeeded(signal);
      const result = await this.assets.read(scope, signal);
      abortIfNeeded(signal);
      const { manifest, bytes } = result;
      if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > this.maximumBytes) throw new Error("invalid retained image");
      if (!matchesScope(manifest, scope)) throw new Error("manifest scope mismatch");
      const { manifestSha256: _manifestSha256, ...manifestIdentity } = manifest;
      const expectedManifestHash = createDerivedImageManifestSha256(manifestIdentity);
      if (manifest.manifestSha256 !== expectedManifestHash || manifest.byteLength !== bytes.byteLength || !/^[a-f0-9]{64}$/i.test(manifest.sha256)) throw new Error("manifest integrity mismatch");
      const actualHash = createHash("sha256").update(bytes).digest("hex");
      if (actualHash !== manifest.sha256) throw new Error("payload integrity mismatch");
      const dimensions = pngDimensions(bytes);
      if (dimensions.width !== manifest.width || dimensions.height !== manifest.height) throw new Error("payload dimensions mismatch");
      return { mediaType: "image/png", width: manifest.width, height: manifest.height, byteLength: bytes.byteLength, sha256: manifest.sha256, bytes };
    } catch (error) {
      if (signal.aborted) throw new Error("Ephemeral image hydration was cancelled.");
      // Do not expose grant, storage, manifest, or image details across this seam.
      throw new Error("Ephemeral image hydration failed.");
    }
  }
}
