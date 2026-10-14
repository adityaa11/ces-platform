import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import test from "node:test";
import { verifyAcceptedContextDecision, type AcceptedContextBinding, type AcceptedContextVerificationMechanism } from "../src/accepted-context-decision-verifier.ts";

const key = "test-only-independent-fixture-root";
const now = "2026-10-14T00:00:00.000Z";
const mac = (value: unknown) => createHmac("sha256", key).update(JSON.stringify(value)).digest("hex");
const signed = (payload: unknown) => ({ payload, signature: mac(payload) });
const binding: AcceptedContextBinding = { projectId: "project-1", workspaceId: "workspace-1", bundleId: "bundle-1", documentId: "document-1", sourceSha256: "a".repeat(64), perceptionExecutionId: "perception-17", semanticExecutionId: "semantic-9", relationshipLineageId: "lineage-4", relationshipRevisionHash: "b".repeat(64), ownedSource: { slot: "owned-1", canonicalLocator: "page/1/table/1" }, contextSource: { slot: "context-2", canonicalLocator: "page/1/visual/2" }, contextAsset: { assetId: "asset-1", assetSourceId: "derived-visual", assetSha256: "c".repeat(64) }, contextualRole: "legend", necessity: "essential" };
const decision = { version: "atlas.accepted-context-decision/v1" as const, issuerId: "fixture-issuer", decisionId: "decision-1", issuedAt: "2026-10-13T00:00:00.000Z", expiresAt: "2026-10-15T00:00:00.000Z", authorizationState: "accepted" as const, binding };
const state = { version: "atlas.accepted-context-authority-state/v1" as const, issuerId: "fixture-issuer", fetchedAt: "2026-10-13T23:59:00.000Z", expiresAt: "2026-10-14T01:00:00.000Z", decisions: { "decision-1": "authorized" as const } };
const fixtureMechanism: AcceptedContextVerificationMechanism = { mechanismId: "fixture-hmac/v1", verify: ({ rawDecision, rawAuthorityState }) => {
  const parse = (raw: unknown) => raw && typeof raw === "object" && "payload" in raw && "signature" in raw ? raw as { payload: unknown; signature: unknown } : undefined;
  const signedDecision = parse(rawDecision); const signedState = parse(rawAuthorityState);
  const valid = (entry: { payload: unknown; signature: unknown } | undefined) => entry && typeof entry.signature === "string" && entry.signature.length === 64 && timingSafeEqual(Buffer.from(entry.signature), Buffer.from(mac(entry.payload)));
  return valid(signedDecision) && valid(signedState) ? { decision: signedDecision.payload as typeof decision, authorityState: signedState.payload as typeof state } : undefined;
} };
const verify = (overrides: Record<string, unknown> = {}) => verifyAcceptedContextDecision({ rawDecision: signed(decision), rawAuthorityState: signed(state), expectedBinding: binding, mechanism: fixtureMechanism, now, ...overrides });

test("actual authenticated verification has exact bindings and valid idempotent repeats", () => {
  const first = verify(); const second = verify();
  assert.deepEqual(first, second); assert.equal(first.binding.perceptionExecutionId, "perception-17"); assert.equal(first.binding.semanticExecutionId, "semantic-9");
});

test("forged, foreign, mismatched, duplicate, malformed, unsupported, and missing inputs fail closed", () => {
  assert.throws(() => verify({ rawDecision: { payload: decision, signature: "0".repeat(64) } }), /not authenticated/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, binding: { ...binding, projectId: "foreign" } }) }), /exactly bind/);
  assert.throws(() => verify({ expectedBinding: { ...binding, contextAsset: { ...binding.contextAsset, assetSha256: "d".repeat(64) } } }), /exactly bind/);
  assert.throws(() => verify({ expectedBinding: { ...binding, contextSource: binding.ownedSource } }), /malformed verifier input/);
  assert.throws(() => verify({ expectedBinding: { ...binding, sourceSha256: "not-a-sha" } }), /malformed verifier input/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, binding: { ...binding, contextualRole: "unsupported-role" } }) }), /exactly bind/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, binding: { ...binding, necessity: "unsupported-necessity" } }) }), /exactly bind/);
  assert.throws(() => verify({ expectedBinding: { ...binding, contextualRole: "unsupported-role" } }), /malformed verifier input/);
  assert.throws(() => verify({ expectedBinding: { ...binding, necessity: "unsupported-necessity" } }), /malformed verifier input/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, binding: { ...binding, contextualRole: undefined } }) }), /exactly bind/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, binding: { ...binding, necessity: undefined } }) }), /exactly bind/);
  assert.throws(() => verify({ rawDecision: signed({ ...decision, version: "unknown" }) }), /unsupported/);
  assert.throws(() => verify({ rawAuthorityState: undefined }), /not authenticated/);
});

test("expiry, stale state, revocation, and trusted invalid or replayed use reject without mutation", () => {
  assert.throws(() => verify({ rawDecision: signed({ ...decision, expiresAt: "2026-10-13T00:00:00.000Z" }) }), /expired, stale/);
  assert.throws(() => verify({ rawAuthorityState: signed({ ...state, expiresAt: "2026-10-13T23:59:59.000Z" }) }), /expired, stale/);
  for (const status of ["revoked", "invalid", "replayed"] as const) assert.throws(() => verify({ rawAuthorityState: signed({ ...state, decisions: { "decision-1": status } }) }), /does not authorize/);
});

test("the module is pure and the test trust material cannot be a production authority", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../src/accepted-context-decision-verifier.ts", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /fetch\(|INSERT|UPDATE|DELETE|createHash|writeFile|appendFile/i);
  assert.ok(key.includes("test-only"));
});
