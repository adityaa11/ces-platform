import { createHash, randomUUID } from "node:crypto";
import {
  GenericHandoffIngressError,
  ghrHeaderV1Schema,
  parseGenericHandoffEnvelopeV1,
  type GenericHandoffHeaderV1,
} from "@atlas/contracts";
import { resolveMainRouteBinding } from "./main-route-index.js";
import { receiveVerifiedBatchPlan } from "./routes/semantic/index.js";

export type SqlDatabase = Readonly<{
  executeSql(statement: string, values?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }>;
}>;

export type GenericHandoffDeliveryJob = Readonly<{ handoffId: string }>;
export type DeliveryDisposition = "parsed_only" | "blocked" | "quarantined" | "retry_exhausted";
type DeliveryErrorClass = "invalid_job" | "corrupt_envelope" | "invalid_policy" | "invalid_route" | "receiver_rejected" | "transient_delivery";
type LoadedHandoff = Readonly<{ handoffId: string; header: unknown; bodyBytes: Uint8Array; bodySha256: string; bodyEncoding: string }>;
type Claim = Readonly<{ owner: string; generation: number }>;

const identity = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const terminal = new Set<DeliveryDisposition>(["parsed_only", "blocked", "quarantined", "retry_exhausted"]);

export class GenericHandoffDeliveryError extends Error {
  constructor(message: string, readonly classification: "quarantined" | "blocked" | "transient", readonly errorClass: DeliveryErrorClass) {
    super(message);
    this.name = "GenericHandoffDeliveryError";
  }
}

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GenericHandoffDeliveryError("Persisted generic handoff record is invalid.", "quarantined", "corrupt_envelope");
  return value as Record<string, unknown>;
};

function parseJob(value: unknown): GenericHandoffDeliveryJob {
  const job = asObject(value);
  if (Object.keys(job).length !== 2 || job.type !== "GenericHandoffJob/v1" || typeof job.handoffId !== "string" || !identity.test(job.handoffId)) {
    throw new GenericHandoffDeliveryError("Generic handoff job is invalid.", "quarantined", "invalid_job");
  }
  return { handoffId: job.handoffId };
}

function loaded(row: Record<string, unknown>): LoadedHandoff {
  if (typeof row.handoff_id !== "string" || typeof row.body_sha256 !== "string" || typeof row.body_encoding !== "string" || !(row.body_bytes instanceof Uint8Array)) {
    throw new GenericHandoffDeliveryError("Persisted generic handoff record is invalid.", "quarantined", "corrupt_envelope");
  }
  return { handoffId: row.handoff_id, header: typeof row.trusted_header === "string" ? JSON.parse(row.trusted_header) : row.trusted_header, bodyBytes: row.body_bytes, bodySha256: row.body_sha256, bodyEncoding: row.body_encoding };
}

function envelopeFromPersisted(row: LoadedHandoff) {
  if (row.bodyEncoding !== "canonical-json-v1") throw new GenericHandoffDeliveryError("Persisted generic handoff encoding is invalid.", "quarantined", "corrupt_envelope");
  const raw = Buffer.from(row.bodyBytes).toString("utf8");
  const serialized = `{"header":${JSON.stringify(row.header)},"body":${raw}}`;
  try {
    const parsed = parseGenericHandoffEnvelopeV1(serialized);
    if (parsed.envelope.header.handoffId !== row.handoffId || parsed.envelope.header.integrity.bodySha256 !== row.bodySha256 || createHash("sha256").update(row.bodyBytes).digest("hex") !== row.bodySha256) {
      throw new GenericHandoffDeliveryError("Persisted generic handoff identity or integrity does not match.", "quarantined", "corrupt_envelope");
    }
    return parsed;
  } catch (error) {
    if (error instanceof GenericHandoffDeliveryError) throw error;
    if (error instanceof GenericHandoffIngressError) throw new GenericHandoffDeliveryError("Persisted generic handoff envelope is invalid.", "quarantined", "corrupt_envelope");
    throw error;
  }
}

function selector(header: GenericHandoffHeaderV1) {
  return {
    main: header.route.main,
    branch: header.route.branch,
    producerProcessKey: header.producer.processKey,
    policyVersion: header.route.policyVersion,
    handlerVersion: header.route.handlerVersion,
    bodyContractType: header.bodyContract.type,
    bodyContractVersion: header.bodyContract.version,
  } as const;
}

function deliveryIdentity(header: GenericHandoffHeaderV1) {
  return [header.idempotencyKey, header.integrity.bodySha256, header.producer.executionId, header.route.main, header.route.branch, header.route.policyVersion, header.route.handlerVersion, header.bodyContract.type, header.bodyContract.version] as const;
}

async function loadHandoff(database: SqlDatabase, handoffId: string): Promise<LoadedHandoff> {
  const result = await database.executeSql("SELECT handoff_id, trusted_header, body_bytes, body_sha256, body_encoding FROM atlas.read_generic_handoff_dispatch_v1($1)", [handoffId]);
  if (result.rows.length !== 1) throw new GenericHandoffDeliveryError("Generic handoff is unavailable.", "blocked", "invalid_route");
  return loaded(result.rows[0]!);
}

async function policyIsActive(database: SqlDatabase, header: GenericHandoffHeaderV1): Promise<boolean> {
  const result = await database.executeSql("SELECT atlas.is_generic_handoff_dispatch_policy_active_v1($1::jsonb) AS active", [JSON.stringify(header)]);
  return result.rows.length === 1 && result.rows[0]!.active === true;
}

async function claim(database: SqlDatabase, header: GenericHandoffHeaderV1, leaseSeconds: number): Promise<Claim | DeliveryDisposition | "busy"> {
  const owner = randomUUID();
  const [idempotencyKey, bodySha256, executionId, main, branch, policyVersion, handlerVersion, bodyContractType, bodyContractVersion] = deliveryIdentity(header);
  const result = await database.executeSql(`
    INSERT INTO bridge.generic_handoff_delivery (
      handoff_id,idempotency_key,body_sha256,producer_execution_id,route_main,route_branch,policy_version,handler_version,body_contract_type,body_contract_version,
      lease_owner,lease_generation,lease_expires_at,claimed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,now() + make_interval(secs => $12),now())
    ON CONFLICT (handoff_id) DO UPDATE SET
      lease_owner=EXCLUDED.lease_owner,
      lease_generation=bridge.generic_handoff_delivery.lease_generation + 1,
      lease_expires_at=EXCLUDED.lease_expires_at,
      claimed_at=now()
    WHERE bridge.generic_handoff_delivery.disposition IS NULL
      AND bridge.generic_handoff_delivery.idempotency_key=EXCLUDED.idempotency_key
      AND bridge.generic_handoff_delivery.body_sha256=EXCLUDED.body_sha256
      AND bridge.generic_handoff_delivery.producer_execution_id=EXCLUDED.producer_execution_id
      AND bridge.generic_handoff_delivery.route_main=EXCLUDED.route_main
      AND bridge.generic_handoff_delivery.route_branch=EXCLUDED.route_branch
      AND bridge.generic_handoff_delivery.policy_version=EXCLUDED.policy_version
      AND bridge.generic_handoff_delivery.handler_version=EXCLUDED.handler_version
      AND bridge.generic_handoff_delivery.body_contract_type=EXCLUDED.body_contract_type
      AND bridge.generic_handoff_delivery.body_contract_version=EXCLUDED.body_contract_version
      AND bridge.generic_handoff_delivery.lease_expires_at < now()
    RETURNING lease_owner,lease_generation`, [header.handoffId, idempotencyKey, bodySha256, executionId, main, branch, policyVersion, handlerVersion, bodyContractType, bodyContractVersion, owner, leaseSeconds]);
  if (result.rows.length === 1) return { owner, generation: Number(result.rows[0]!.lease_generation) };
  const existing = await database.executeSql("SELECT disposition FROM bridge.generic_handoff_delivery WHERE handoff_id=$1", [header.handoffId]);
  const disposition = existing.rows[0]?.disposition;
  if (typeof disposition === "string" && terminal.has(disposition as DeliveryDisposition)) return disposition as DeliveryDisposition;
  return "busy";
}

async function terminalize(database: SqlDatabase, handoffId: string, claim: Claim, disposition: DeliveryDisposition, errorClass: DeliveryErrorClass | null): Promise<void> {
  let result: { readonly rows: readonly Record<string, unknown>[] };
  try {
    result = await database.executeSql("UPDATE bridge.generic_handoff_delivery SET disposition=$4,error_class=$5,completed_at=now(),lease_expires_at=NULL WHERE handoff_id=$1 AND lease_owner=$2 AND lease_generation=$3 AND disposition IS NULL RETURNING handoff_id", [handoffId, claim.owner, claim.generation, disposition, errorClass]);
  } catch {
    // A receipt-write transport/database fault is the narrow retryable case.
    // It never exposes the underlying error and pg-boss retains the original
    // pointer job; the final configured attempt records the sanitized terminal
    // outcome through the existing fence.
    throw new GenericHandoffDeliveryError("Generic handoff receipt persistence failed.", "transient", "transient_delivery");
  }
  if (result.rows.length !== 1) throw new GenericHandoffDeliveryError("Generic handoff delivery lease was superseded.", "transient", "transient_delivery");
}

/** Delivers a pointer-only job without interpreting the domain payload. */
export async function deliverGenericHandoffJob(input: Readonly<{ database: SqlDatabase; job: unknown; leaseSeconds: number; finalAttempt: boolean }>): Promise<DeliveryDisposition> {
  let job: GenericHandoffDeliveryJob;
  try { job = parseJob(input.job); } catch (error) {
    if (error instanceof GenericHandoffDeliveryError) return "quarantined";
    throw error;
  }
  let handoff: LoadedHandoff;
  try { handoff = await loadHandoff(input.database, job.handoffId); } catch (error) {
    if (error instanceof GenericHandoffDeliveryError && error.classification === "blocked") return "blocked";
    throw error;
  }
  let parsed: ReturnType<typeof envelopeFromPersisted>;
  try { parsed = envelopeFromPersisted(handoff); } catch (error) {
    // A known immutable handoff can retain a sanitized corruption result even
    // when its header can no longer be trusted enough to claim a normal lease.
    await input.database.executeSql("INSERT INTO bridge.generic_handoff_delivery(handoff_id,body_sha256,disposition,error_class,completed_at) VALUES ($1,$2,'quarantined','corrupt_envelope',now()) ON CONFLICT (handoff_id) DO NOTHING", [job.handoffId, handoff.bodySha256]);
    return "quarantined";
  }
  const header = parsed.envelope.header;
  // The generic schema makes these route-conditional; the frozen Test-1
  // binding requires both before a semantic/batch-plan delivery can claim.
  if (!header.scope.bundleId || !header.scope.documentId) {
    const activeClaim = await claim(input.database, header, input.leaseSeconds);
    if (typeof activeClaim === "object") await terminalize(input.database, header.handoffId, activeClaim, "quarantined", "corrupt_envelope");
    return activeClaim === "parsed_only" || activeClaim === "blocked" || activeClaim === "retry_exhausted" ? activeClaim : "quarantined";
  }
  if (!(await policyIsActive(input.database, header))) {
    const activeClaim = await claim(input.database, header, input.leaseSeconds);
    if (typeof activeClaim === "object") await terminalize(input.database, header.handoffId, activeClaim, "blocked", "invalid_policy");
    return activeClaim === "parsed_only" || activeClaim === "quarantined" || activeClaim === "retry_exhausted" ? activeClaim : "blocked";
  }
  let registration: ReturnType<typeof resolveMainRouteBinding>;
  try { registration = resolveMainRouteBinding(selector(header)); } catch {
    const activeClaim = await claim(input.database, header, input.leaseSeconds);
    if (typeof activeClaim === "object") await terminalize(input.database, header.handoffId, activeClaim, "blocked", "invalid_route");
    return activeClaim === "parsed_only" || activeClaim === "quarantined" || activeClaim === "retry_exhausted" ? activeClaim : "blocked";
  }
  if (parsed.rawBodyBytes.byteLength > registration.wrappedBodyByteLimit || parsed.envelope.body.can_continue !== registration.canContinue) {
    const activeClaim = await claim(input.database, header, input.leaseSeconds);
    if (typeof activeClaim === "object") await terminalize(input.database, header.handoffId, activeClaim, "quarantined", "corrupt_envelope");
    return activeClaim === "parsed_only" || activeClaim === "blocked" || activeClaim === "retry_exhausted" ? activeClaim : "quarantined";
  }
  const activeClaim = await claim(input.database, header, input.leaseSeconds);
  if (activeClaim === "busy") throw new GenericHandoffDeliveryError("Generic handoff delivery lease is active.", "transient", "transient_delivery");
  if (typeof activeClaim === "string") return activeClaim;
  try {
    const payload = parsed.envelope.body.payload;
    const rawPayload = JSON.stringify(payload);
    if (Buffer.byteLength(rawPayload, "utf8") > registration.payloadByteLimit) throw new GenericHandoffDeliveryError("Generic handoff payload exceeds the registered bound.", "quarantined", "corrupt_envelope");
    receiveVerifiedBatchPlan({ selector: selector(header), canContinue: parsed.envelope.body.can_continue, payload: rawPayload });
    await terminalize(input.database, header.handoffId, activeClaim, "parsed_only", null);
    return "parsed_only";
  } catch (error) {
    if (error instanceof GenericHandoffDeliveryError && error.classification === "transient") {
      if (input.finalAttempt) { await terminalize(input.database, header.handoffId, activeClaim, "retry_exhausted", "transient_delivery"); return "retry_exhausted"; }
      throw error;
    }
    await terminalize(input.database, header.handoffId, activeClaim, "quarantined", error instanceof GenericHandoffDeliveryError ? error.errorClass : "receiver_rejected");
    return "quarantined";
  }
}
