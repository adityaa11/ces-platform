import assert from "node:assert/strict";
import test from "node:test";
import { PerceptionSourceGrantIssuer } from "../src/index.ts";

const identity = { executionId: "exec-1", artifactId: "artifact-1", storageKey: "documents/never-leaves-atlas", sourceSha256: "c".repeat(64), mimeType: "application/pdf" as const, byteSize: 42 };

test("source grant is opaque, short-lived, and execution/document scoped", () => {
  let now = 1_000;
  const issuer = new PerceptionSourceGrantIssuer("s".repeat(32), () => now);
  const grant = issuer.issue(identity, 100);
  assert.equal(grant.includes(identity.storageKey), false);
  assert.equal(issuer.redeem(grant, { executionId: "exec-1", artifactId: "artifact-1" }).sourceSha256, identity.sourceSha256);
  assert.throws(() => issuer.redeem(grant, { executionId: "exec-2", artifactId: "artifact-1" }), /scope mismatch/);
  now = 1100;
  assert.throws(() => issuer.redeem(grant, { executionId: "exec-1", artifactId: "artifact-1" }), /expired/);
});

test("source grant rejects tampering and oversized lifetimes", () => {
  const issuer = new PerceptionSourceGrantIssuer("s".repeat(32));
  const grant = issuer.issue(identity);
  assert.throws(() => issuer.redeem(`${grant}x`, { executionId: "exec-1", artifactId: "artifact-1" }), /invalid/);
  assert.throws(() => issuer.issue(identity, 16 * 60_000), /lifetime/);
});
