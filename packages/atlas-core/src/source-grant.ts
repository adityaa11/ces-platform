import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type PerceptionSourceIdentity = { readonly executionId: string; readonly artifactId: string; readonly storageKey: string; readonly sourceSha256: string; readonly mimeType: "application/pdf"; readonly byteSize: number };
export type RedeemedPerceptionSource = Omit<PerceptionSourceIdentity, "storageKey"> & { readonly expiresAt: number };

type GrantPayload = PerceptionSourceIdentity & { readonly expiresAt: number };
const encode = (value: Uint8Array | string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url");

function assertIdentity(value: PerceptionSourceIdentity): void {
  if (!value.executionId || !value.artifactId || !value.storageKey || !/^[a-f0-9]{64}$/u.test(value.sourceSha256) || value.mimeType !== "application/pdf" || !Number.isInteger(value.byteSize) || value.byteSize < 1) throw new Error("Invalid immutable perception source identity.");
}

/** An Atlas-only issuer; the Bridge may redeem a grant but cannot enumerate source identities. */
export class PerceptionSourceGrantIssuer {
  readonly #grants = new Map<string, GrantPayload>();
  constructor(private readonly secret: Uint8Array | string, private readonly now: () => number = Date.now) {
    if (Buffer.byteLength(secret) < 32) throw new Error("Perception source-grant secret must be at least 32 bytes.");
  }

  issue(identity: PerceptionSourceIdentity, lifetimeMilliseconds = 5 * 60_000): string {
    assertIdentity(identity);
    if (!Number.isInteger(lifetimeMilliseconds) || lifetimeMilliseconds < 1 || lifetimeMilliseconds > 15 * 60_000) throw new Error("Source-grant lifetime must be between 1ms and 15 minutes.");
    const grantId = randomUUID();
    this.#grants.set(grantId, { ...identity, expiresAt: this.now() + lifetimeMilliseconds });
    return `${grantId}.${encode(createHmac("sha256", this.secret).update(grantId).digest())}`;
  }

  redeem(grant: string, expected: Pick<PerceptionSourceIdentity, "executionId" | "artifactId">): RedeemedPerceptionSource {
    const [grantId, encodedSignature, ...extra] = grant.split(".");
    if (!grantId || !encodedSignature || extra.length) throw new Error("Source grant is malformed.");
    const actual = decode(encodedSignature);
    const signature = createHmac("sha256", this.secret).update(grantId).digest();
    if (actual.byteLength !== signature.byteLength || !timingSafeEqual(actual, signature)) throw new Error("Source grant is invalid.");
    const candidate = this.#grants.get(grantId);
    if (!candidate) throw new Error("Source grant is invalid.");
    assertIdentity(candidate);
    if (!Number.isInteger(candidate.expiresAt) || candidate.expiresAt <= this.now()) { this.#grants.delete(grantId); throw new Error("Source grant is expired."); }
    if (candidate.executionId !== expected.executionId || candidate.artifactId !== expected.artifactId) throw new Error("Source grant scope mismatch.");
    const { storageKey: _storageKey, ...safeSource } = candidate;
    return safeSource;
  }
}
