import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  ImmutableSemanticCorpusPlanError,
  canonicalImmutableSemanticCorpusPlanV1,
  canonicalImmutableSemanticCorpusPlanV2,
  parseImmutableSemanticCorpusPlanInputV2,
  parseImmutableSemanticCorpusPlanRecord,
  parsePlannedSemanticCorpusHandoffRecord,
  replayImmutableSemanticCorpusPlanHashV2,
  type ImmutableSemanticCorpusPlanInputV1,
  type ImmutableSemanticCorpusPlanInputV2,
} from "../src/immutable-semantic-corpus-plan.ts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const locator = (suffix: string, localId: string, sourceKind: "text_block" | "table" = "text_block") => ({ documentId: `document-${suffix}`, pageNumber: 1, sourceKind, localId });
const identity = (name: string) => ({ identity: name, version: "v1" });

const input = (suffix: string): ImmutableSemanticCorpusPlanInputV2 => {
  const first = locator(suffix, "one");
  const second = locator(suffix, "two", "table");
  const packetHash = hash(`packet-${suffix}`);
  const trace = { sourceSpecificationSha256: packetHash, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" as const };
  return {
    version: "ImmutableSemanticCorpusPlan/v2",
    scope: { projectId: `project-${suffix}`, workspaceId: `workspace-${suffix}`, bundleId: `bundle-${suffix}`, documentId: `document-${suffix}` },
    source: { sourceSha256: hash(`source-${suffix}`), normalizedDocumentRef: `cache-${suffix}`, perceptionExecutionId: `execution-${suffix}`, normalizedDocumentFingerprint: hash(`fingerprint-${suffix}`), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", rel: { state: "unavailable" } },
    proposal: {
      proposalId: `proposal-${suffix}`, proposalHash: hash(`proposal-${suffix}`), sourceHash: hash(`source-proposal-${suffix}`), policyHash: hash(`policy-${suffix}`), estimatorHash: hash(`estimator-${suffix}`),
      structuralBound: { identity: "bound", version: "v1", maxRequestBytes: 4096, maxInputTokens: 1024, maxPromptBytes: 4096, maxContextTokens: 2048 },
      bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } },
      packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), eligibleDimensions: ["rpm", "tpm"], requestResourceEnvelope: { requestUnits: 2, tokenUnits: 40, dayUnits: 2, concurrencyUnits: 2 },
      inventory: [{ locator: first, classification: "eligible" }, { locator: second, classification: "eligible" }, { locator: locator(suffix, "visual", "text_block"), classification: "unexamined", reason: "image_accounting_unavailable" }],
      batches: [
        { batchId: "batch-0001", ownedLocators: [first], contextOnlyLocators: [], sourceSpecificationSha256: packetHash, packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 100 }, requestBytes: 100, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [trace] },
        { batchId: "batch-0002", ownedLocators: [second], contextOnlyLocators: [], sourceSpecificationSha256: hash(`packet-two-${suffix}`), packetProfile: identity("packet"), estimator: identity("estimator"), configuration: identity("configuration"), conservativeLogicalRequestBytes: { version: "ConservativeLogicalRequestBytes/v1", value: 101 }, requestBytes: 101, inputTokens: 20, reservedOutputTokens: 10, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ sourceSpecificationSha256: hash(`packet-two-${suffix}`), requestBytes: 101, inputTokens: 20, reservedOutputTokens: 10, outcome: "fit" }] },
      ],
    },
  };
};

test("v2 canonicalizes only locator metadata and replays deterministically", () => {
  const plan = input("canonical");
  const first = canonicalImmutableSemanticCorpusPlanV2(plan);
  const replay = canonicalImmutableSemanticCorpusPlanV2(plan);
  const stored = first.planContent as { version: string; source: Record<string, unknown>; proposal: Record<string, unknown> };
  assert.deepEqual(first, replay);
  assert.equal(replayImmutableSemanticCorpusPlanHashV2(stored), first.planHash);
  assert.equal(stored.version, "ImmutableSemanticCorpusPlan/v2");
  assert.deepEqual(Object.keys(stored.source).sort(), ["normalizedDocumentFingerprint", "normalizedDocumentRef", "normalizedDocumentVersion", "perceptionCapability", "perceptionContractVersion", "perceptionExecutionId", "rel", "sourceSha256"]);
  assert.deepEqual(Object.keys((stored.proposal.inventory as Array<Record<string, unknown>>)[0]!).sort(), ["classification", "locator"]);
  assert.equal(JSON.stringify(stored).includes("sourceSpecification"), false, "the parent does not persist source packet content");
  assert.equal(first.handoffContents.length, 2);
});

test("v2 parser rejects unknown, corpus-content, invalid accounting, and coverage fields", () => {
  const unknown = input("unknown") as any;
  unknown.proposal.inventory[0].text = "raw corpus";
  assert.throws(() => parseImmutableSemanticCorpusPlanInputV2(unknown), ImmutableSemanticCorpusPlanError);

  const malformedHash = input("hash") as any;
  malformedHash.proposal.batches[0].sourceSpecificationSha256 = "not-a-hash";
  assert.throws(() => canonicalImmutableSemanticCorpusPlanV2(malformedHash), /invalid or contains unapproved fields/);

  const duplicateOwner = input("duplicate") as any;
  duplicateOwner.proposal.batches[1].ownedLocators = [duplicateOwner.proposal.batches[0].ownedLocators[0]];
  assert.throws(() => canonicalImmutableSemanticCorpusPlanV2(duplicateOwner), ImmutableSemanticCorpusPlanError);

  const badTrace = input("trace") as any;
  badTrace.proposal.batches[0].fitTrace[0].reservedOutputTokens = 9;
  assert.throws(() => canonicalImmutableSemanticCorpusPlanV2(badTrace), ImmutableSemanticCorpusPlanError);
});

test("version dispatch accepts historical v1 unchanged and fails closed for unknown records", () => {
  const historical: ImmutableSemanticCorpusPlanInputV1 = {
    scope: { projectId: "project-v1", workspaceId: "workspace-v1", bundleId: "bundle-v1", documentId: "document-v1" },
    source: { sourceSha256: hash("source-v1"), normalizedDocumentRef: "cache-v1", perceptionExecutionId: "execution-v1", normalizedDocumentFingerprint: hash("fingerprint-v1"), normalizedDocumentVersion: "v1", perceptionCapability: "atlas.document.perceive", perceptionContractVersion: "v1", media: [], rel: { state: "unavailable" } },
    proposal: { proposalId: "proposal-v1", proposalHash: hash("proposal-v1"), sourceHash: hash("source-proposal-v1"), policyHash: hash("policy-v1"), estimatorHash: hash("estimator-v1"), structuralBound: { identity: "bound", version: "v1", maxRequestBytes: 100, maxInputTokens: 20 }, bssSnapshot: { source: { sourceId: "capacity", sourceVersion: "v1" }, enforcement: { policyId: "policy", policyVersion: "v1" }, process: { profileId: "semantic", profileVersion: "v1" }, workload: { planId: "workload", planVersion: "v1", estimator: identity("estimator") } }, eligibleDimensions: ["rpm"], requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, units: [{ locator: locator("v1", "one"), classification: "eligible", demand: { requestBytes: 100, inputTokens: 20, envelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 } } }], batches: [{ batchId: "batch-0001", ownedLocators: [locator("v1", "one")], contextOnlyLocators: [], requestBytes: 100, inputTokens: 20, requestResourceEnvelope: { requestUnits: 1, tokenUnits: 20, dayUnits: 1, concurrencyUnits: 1 }, fitTrace: [{ requestBytes: 100, inputTokens: 20, outcome: "fit" }] }] },
  };
  const v1 = canonicalImmutableSemanticCorpusPlanV1(historical);
  assert.equal(parseImmutableSemanticCorpusPlanRecord(v1.planContent).version, "ImmutableSemanticCorpusPlan/v1");
  const v2 = canonicalImmutableSemanticCorpusPlanV2(input("dispatch"));
  assert.equal(parseImmutableSemanticCorpusPlanRecord(v2.planContent).version, "ImmutableSemanticCorpusPlan/v2");
  assert.equal(parsePlannedSemanticCorpusHandoffRecord(v2.handoffContents[0]).version, "PlannedSemanticCorpusHandoff/v2");
  const childWithPayload = JSON.parse(JSON.stringify(v2.handoffContents[0])); childWithPayload.raw = "payload";
  assert.throws(() => parsePlannedSemanticCorpusHandoffRecord(childWithPayload), /invalid/);
  assert.throws(() => parseImmutableSemanticCorpusPlanRecord({ version: "ImmutableSemanticCorpusPlan/v3" }), /unsupported/);
});
