import { createHash } from "node:crypto";
import { ghrHeaderV1Schema, type GenericHandoffHeaderV1 } from "@atlas/contracts";
import { canonicalSemanticBatchPlanInputV1, type SemanticBatchPlanInputV1 } from "./semantic-batch-plan-input.js";

type Row = Record<string, unknown>;
type TransactionSql = { unsafe(query: string, parameters?: readonly unknown[]): Promise<readonly Row[]> };

export type TrustedAcceptedNdv1Facts = Readonly<{
  producer: Readonly<{ processKey: "perception.acceptance"; event: "NormalizedDocumentAccepted/v1"; executionId: string }>;
  scope: Readonly<{ projectId: string; workspaceId: string; bundleId: string; documentId: string }>;
  payload: SemanticBatchPlanInputV1;
  idempotencyKey: string;
  handoffId: string;
  workflowId: string;
  issuedAt: string;
}>;

export type IssuedGenericHandoffIntentV1 = Readonly<{
  handoffId: string;
  idempotencyKey: string;
  header: GenericHandoffHeaderV1;
  bodyBytes: Uint8Array;
  bodySha256: string;
}>;

const identity = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const bodyLimit = 2081;
const requireIdentity = (value: string, name: string): void => {
  if (!identity.test(value)) throw new Error(`Trusted GHR ${name} is invalid.`);
};

function fixedBody(payload: SemanticBatchPlanInputV1): Uint8Array {
  const canonicalPayload = canonicalSemanticBatchPlanInputV1(payload);
  const body = Buffer.from(`{"can_continue":true,"payload":${canonicalPayload}}`, "utf8");
  if (body.byteLength > bodyLimit) throw new Error("Trusted GHR planning wrapper exceeds the frozen byte limit.");
  return body;
}

function fixedHeader(facts: TrustedAcceptedNdv1Facts, bodySha256: string): GenericHandoffHeaderV1 {
  if (facts.producer.processKey !== "perception.acceptance" || facts.producer.event !== "NormalizedDocumentAccepted/v1") throw new Error("Trusted GHR producer facts do not match the frozen policy.");
  if (facts.payload.perceptionExecutionId !== facts.producer.executionId) throw new Error("Trusted GHR execution facts do not match the canonical payload.");
  for (const [name, value] of Object.entries({ handoffId: facts.handoffId, idempotencyKey: facts.idempotencyKey, workflowId: facts.workflowId, executionId: facts.producer.executionId, ...facts.scope })) requireIdentity(value, name);
  const header = {
    protocol: "GenericHandoffEnvelope/v1" as const,
    handoffId: facts.handoffId,
    idempotencyKey: facts.idempotencyKey,
    producer: { processKey: facts.producer.processKey, executionId: facts.producer.executionId },
    route: { main: "semantic" as const, branch: "batch-plan", policyVersion: "v2", handlerVersion: "v2" },
    bodyContract: { type: "SemanticBatchPlanInput", version: "v1" },
    scope: facts.scope,
    correlation: { workflowId: facts.workflowId },
    integrity: { bodyEncoding: "canonical-json-v1" as const, bodySha256 },
    issuedAt: facts.issuedAt,
  };
  const parsed = ghrHeaderV1Schema.safeParse(header);
  if (!parsed.success) throw new Error("Trusted GHR header facts are invalid.");
  return parsed.data;
}

/**
 * Transaction-bound Atlas issuer.  Its only input is server-composed accepted
 * NDV1 facts; production acceptance integration is intentionally deferred to
 * GHR-02B, as are all queue and delivery concerns.
 */
export class PostgresGenericHandoffIssuer {
  async issue(transaction: TransactionSql, facts: TrustedAcceptedNdv1Facts): Promise<IssuedGenericHandoffIntentV1> {
    const bodyBytes = fixedBody(facts.payload);
    const bodySha256 = createHash("sha256").update(bodyBytes).digest("hex");
    const header = fixedHeader(facts, bodySha256);
    const existing = await transaction.unsafe(`SELECT handoff_id, producer_execution_id, project_id, workspace_id, bundle_id, document_id,
        policy_version, handler_version, body_contract_type, body_contract_version, route_main, route_branch, can_continue,
        body_encoding, body_bytes, body_sha256, trusted_header
      FROM atlas.generic_handoff_intent WHERE idempotency_key=$1 FOR UPDATE`, [facts.idempotencyKey]);
    if (existing.length === 1) {
      const row = existing[0]!;
      const persisted = ghrHeaderV1Schema.safeParse(typeof row.trusted_header === "string" ? JSON.parse(row.trusted_header) : row.trusted_header);
      const persistedBody = Buffer.from(row.body_bytes as Uint8Array);
      if (!persisted.success) throw new Error("Persisted trusted GHR header is invalid.");
      let persistedPayload: unknown;
      try { persistedPayload = JSON.parse(persistedBody.toString("utf8")); } catch { throw new Error("Persisted trusted GHR body is invalid."); }
      const same = row.producer_execution_id === facts.producer.executionId && row.project_id === facts.scope.projectId
        && row.workspace_id === facts.scope.workspaceId && row.bundle_id === facts.scope.bundleId && row.document_id === facts.scope.documentId
        && row.body_encoding === "canonical-json-v1" && typeof row.body_sha256 === "string"
        && createHash("sha256").update(persistedBody).digest("hex") === row.body_sha256
        && persisted.data.idempotencyKey === facts.idempotencyKey && persisted.data.producer.executionId === facts.producer.executionId
        && typeof persistedPayload === "object" && persistedPayload !== null && !Array.isArray(persistedPayload)
        && (persistedPayload as Record<string, unknown>).payload !== undefined
        && JSON.stringify((persistedPayload as Record<string, unknown>).payload) === canonicalSemanticBatchPlanInputV1(facts.payload);
      if (!same) throw new Error("Trusted GHR idempotency key conflicts with immutable issuance truth.");
      return { handoffId: String(row.handoff_id), idempotencyKey: facts.idempotencyKey, header: persisted.data, bodyBytes: persistedBody, bodySha256: String(row.body_sha256) };
    }
    const policy = await transaction.unsafe(`SELECT 1 FROM atlas.generic_handoff_route_policy
      WHERE policy_version='v2' AND producer_process_key='perception.acceptance'
        AND producer_event='NormalizedDocumentAccepted/v1' AND route_main='semantic'
        AND route_branch='batch-plan' AND handler_version='v2'
        AND body_contract_type='SemanticBatchPlanInput' AND body_contract_version='v1'
        AND can_continue=true AND enabled=true AND revoked_at IS NULL LIMIT 1`);
    if (policy.length !== 1) throw new Error("Trusted GHR route policy is disabled, revoked, or unavailable.");

    await transaction.unsafe(`INSERT INTO atlas.generic_handoff_intent (
      handoff_id,idempotency_key,producer_execution_id,project_id,workspace_id,bundle_id,document_id,
      policy_version,handler_version,body_contract_type,body_contract_version,route_main,route_branch,can_continue,
      body_encoding,body_bytes,body_sha256,trusted_header,issued_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'v2','v2','SemanticBatchPlanInput','v1','semantic','batch-plan',true,
      'canonical-json-v1',$8,$9,$10::jsonb,$11::timestamptz)`, [
      facts.handoffId, facts.idempotencyKey, facts.producer.executionId, facts.scope.projectId, facts.scope.workspaceId,
      facts.scope.bundleId, facts.scope.documentId, bodyBytes, bodySha256, JSON.stringify(header), facts.issuedAt,
    ]);
    return { handoffId: facts.handoffId, idempotencyKey: facts.idempotencyKey, header, bodyBytes, bodySha256 };
  }
}
