import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GenericHandoffIngressError, genericHandoffIngressLimits, ghrEnvelopeV1Schema, ghrHeaderV1Schema, ghrRoutedBodyV1Schema, guardGenericHandoffEnvelopeV1Raw, parseGenericHandoffEnvelopeV1, sha256GenericHandoffBody } from "../src/index.ts";

const encoder = new TextEncoder();
const byteLength = (value: string) => encoder.encode(value).byteLength;

const rawEnvelope = (body = '{"can_continue":false,"payload":{"accepted":"value"}}', headerOverride: Record<string, unknown> = {}) => {
  const header = {
    protocol: "GenericHandoffEnvelope/v1",
    handoffId: "handoff-1",
    idempotencyKey: "idempotency-1",
    producer: { processKey: "perception.acceptance", executionId: "execution-1" },
    route: { main: "semantic", branch: "batch-plan", policyVersion: "policy-1", handlerVersion: "handler-1" },
    bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
    scope: { projectId: "project-1", workspaceId: "workspace-1" },
    correlation: { workflowId: "workflow-1" },
    integrity: { bodyEncoding: "canonical-json-v1", bodySha256: sha256GenericHandoffBody(encoder.encode(body)) },
    issuedAt: "2026-10-24T09:30:00+07:00",
    ...headerOverride,
  };
  return `{"header":${JSON.stringify(header)},"body":${body}}`;
};

const rawObjectWithExactBytes = (target: number) => {
  const prefix = '{"pad":"';
  const suffix = '"}';
  return `${prefix}${"x".repeat(target - byteLength(prefix) - byteLength(suffix))}${suffix}`;
};

test("GHR strict schemas retain the v0.6 fixed header, exact wrapper, and documented boundaries", () => {
  const envelope = parseGenericHandoffEnvelopeV1(rawEnvelope());
  assert.equal(envelope.envelope.header.protocol, "GenericHandoffEnvelope/v1");
  assert.equal(new TextDecoder().decode(envelope.rawBodyBytes), '{"can_continue":false,"payload":{"accepted":"value"}}');
  assert.equal(new TextDecoder().decode(envelope.rawPayloadBytes), '{"accepted":"value"}');
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: envelope.envelope.header, body: { can_continue: false, payload: [] } }).success, false);
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: envelope.envelope.header, body: { payload: {} } }).success, false);
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: { ...envelope.envelope.header, unexpected: "rejected" }, body: envelope.envelope.body }).success, false);
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: envelope.envelope.header, body: { can_continue: "false", payload: {} } }).success, false);
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: { ...envelope.envelope.header, protocol: "GenericHandoffEnvelope/v2" }, body: envelope.envelope.body }).success, false);
  assert.equal(ghrEnvelopeV1Schema.safeParse({ header: { ...envelope.envelope.header, issuedAt: "2026-10-24" }, body: envelope.envelope.body }).success, false);
  assert.equal(ghrRoutedBodyV1Schema.safeParse({ can_continue: false, payload: {}, extra: "rejected" }).success, false);

  const descriptions = [
    ghrEnvelopeV1Schema, ghrHeaderV1Schema, ghrRoutedBodyV1Schema,
    ghrHeaderV1Schema.shape.protocol, ghrHeaderV1Schema.shape.handoffId, ghrHeaderV1Schema.shape.idempotencyKey,
    ghrHeaderV1Schema.shape.producer, ghrHeaderV1Schema.shape.producer.shape.processKey, ghrHeaderV1Schema.shape.producer.shape.executionId,
    ghrHeaderV1Schema.shape.route, ghrHeaderV1Schema.shape.route.shape.main, ghrHeaderV1Schema.shape.route.shape.branch, ghrHeaderV1Schema.shape.route.shape.policyVersion, ghrHeaderV1Schema.shape.route.shape.handlerVersion,
    ghrHeaderV1Schema.shape.bodyContract, ghrHeaderV1Schema.shape.bodyContract.shape.type, ghrHeaderV1Schema.shape.bodyContract.shape.version,
    ghrHeaderV1Schema.shape.scope, ghrHeaderV1Schema.shape.scope.shape.projectId, ghrHeaderV1Schema.shape.scope.shape.workspaceId, ghrHeaderV1Schema.shape.scope.shape.bundleId, ghrHeaderV1Schema.shape.scope.shape.documentId, ghrHeaderV1Schema.shape.scope.shape.batchId,
    ghrHeaderV1Schema.shape.correlation, ghrHeaderV1Schema.shape.correlation.shape.workflowId, ghrHeaderV1Schema.shape.correlation.shape.parentHandoffId, ghrHeaderV1Schema.shape.correlation.shape.groupId,
    ghrHeaderV1Schema.shape.integrity, ghrHeaderV1Schema.shape.integrity.shape.bodyEncoding, ghrHeaderV1Schema.shape.integrity.shape.bodySha256, ghrHeaderV1Schema.shape.issuedAt,
    ghrRoutedBodyV1Schema.shape.can_continue, ghrRoutedBodyV1Schema.shape.payload,
  ];
  for (const schema of descriptions) assert.ok(schema.description && schema.description.length > 20, "each v0.6 §3.1a schema node has a meaningful description");
});

test("GHR raw ingress rejects adversarial JSON before strict schema parsing", () => {
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw('{"header":{},"header":{},"body":{}}'), GenericHandoffIngressError);
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw('{"header":{},"body":{"payload":{"n":1e400}}}'), GenericHandoffIngressError);
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw('{"header":{},"body":{"payload":{"__proto__":"unsafe"}}}'), GenericHandoffIngressError);
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw('{"header":{},"body":'), GenericHandoffIngressError);
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw('{"header":{},"body":{}}'));
  assert.throws(() => parseGenericHandoffEnvelopeV1('{"header":{},"body":{}}'), GenericHandoffIngressError);
});

test("GHR raw ingress enforces every frozen byte and structural boundary", () => {
  const headerAtLimit = rawObjectWithExactBytes(genericHandoffIngressLimits.headerBytes);
  const bodyAtLimit = rawObjectWithExactBytes(genericHandoffIngressLimits.bodyBytes);
  assert.equal(byteLength(headerAtLimit), genericHandoffIngressLimits.headerBytes);
  assert.equal(byteLength(bodyAtLimit), genericHandoffIngressLimits.bodyBytes);
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(`{"header":${headerAtLimit},"body":{}}`));
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":${bodyAtLimit}}`));
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`{"header":${rawObjectWithExactBytes(genericHandoffIngressLimits.headerBytes + 1)},"body":{}}`), GenericHandoffIngressError);
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":${rawObjectWithExactBytes(genericHandoffIngressLimits.bodyBytes + 1)}}`), GenericHandoffIngressError);

  const envelopeAtLimit = '{"header":{},"body":{}}'.padEnd(genericHandoffIngressLimits.envelopeBytes, " ");
  assert.equal(byteLength(envelopeAtLimit), genericHandoffIngressLimits.envelopeBytes);
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(envelopeAtLimit));
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`${envelopeAtLimit} `), GenericHandoffIngressError);

  let depthAtLimit = "0";
  for (let index = 0; index < 14; index += 1) depthAtLimit = `{"n":${depthAtLimit}}`;
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":${depthAtLimit}}`));
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":{"n":{"n":${depthAtLimit}}}}`), GenericHandoffIngressError);

  const propertiesAtLimit = `{${Array.from({ length: genericHandoffIngressLimits.maxObjectProperties }, (_, index) => `"k${index}":0`).join(",")}}`;
  const elementsAtLimit = `[${Array.from({ length: genericHandoffIngressLimits.maxArrayElements }, () => "0").join(",")}]`;
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":${propertiesAtLimit}}`));
  assert.doesNotThrow(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":${elementsAtLimit}}`));
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":{${Array.from({ length: genericHandoffIngressLimits.maxObjectProperties + 1 }, (_, index) => `"k${index}":0`).join(",")}}}`), GenericHandoffIngressError);
  assert.throws(() => guardGenericHandoffEnvelopeV1Raw(`{"header":{},"body":[${Array.from({ length: genericHandoffIngressLimits.maxArrayElements + 1 }, () => "0").join(",")}]}`), GenericHandoffIngressError);
});

test("GHR integrity binds SHA-256 to the original wrapped-body bytes", () => {
  const body = '{"can_continue":false,"payload":{"text":"escaped \\u00e9"}}';
  const parsed = parseGenericHandoffEnvelopeV1(rawEnvelope(body));
  assert.deepEqual(parsed.rawBodyBytes, encoder.encode(body));
  assert.equal(parsed.envelope.header.integrity.bodySha256, sha256GenericHandoffBody(parsed.rawBodyBytes));
  assert.throws(() => parseGenericHandoffEnvelopeV1(rawEnvelope(body.replace("escaped", "altered"), { integrity: { bodyEncoding: "canonical-json-v1", bodySha256: sha256GenericHandoffBody(encoder.encode(body)) } })), GenericHandoffIngressError);
  assert.throws(() => parseGenericHandoffEnvelopeV1(rawEnvelope(body, { integrity: { bodyEncoding: "canonical-json-v1", bodySha256: "0".repeat(64) } })), GenericHandoffIngressError);
});

test("GHR remains package-local and independent from domain, storage, and dispatch surfaces", () => {
  const source = readFileSync(new URL("../src/ghr/generic-handoff-envelope.v1.schema.ts", import.meta.url), "utf8");
  for (const prohibitedDependency of ["from \"@atlas/db\"", "from \"pg-boss\"", "SemanticBatchPlanInput", "resolveBackground"]) assert.equal(source.includes(prohibitedDependency), false, `GHR generic source must not couple to ${prohibitedDependency}`);
});
