import { parseSemanticResultEnvelope } from "@atlas/contracts";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };
export class SemanticReplayLeaseLostError extends Error {}

/** Immutable Bridge-owned outbox for validated semantic envelopes. */
export function createSemanticResultReplay(database: Database) {
  const load = async (idempotencyKey: string, executionId: string): Promise<unknown | undefined> => {
    const result = await database.executeSql("SELECT validated_envelope FROM bridge.semantic_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]);
    if (!result.rows.length) return undefined;
    const envelope = result.rows[0]?.validated_envelope;
    return parseSemanticResultEnvelope(typeof envelope === "string" ? JSON.parse(envelope) : envelope);
  };
  return {
    load,
    async stage(idempotencyKey: string, executionId: string, envelope: unknown, lease: { readonly owner: string; readonly generation: number }): Promise<unknown> {
      const valid = parseSemanticResultEnvelope(envelope);
      const stage = (valid as { skill: { id: string } }).skill.id === "atlas.semantic.extract" ? "extraction" : "reconciliation";
      const claim = await database.executeSql("SELECT status, lease_owner, lease_generation FROM bridge.background_effects WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]);
      if (!claim.rows.length || claim.rows[0]?.status !== "running" || claim.rows[0]?.lease_owner !== lease.owner || Number(claim.rows[0]?.lease_generation) !== lease.generation) throw new SemanticReplayLeaseLostError("Semantic replay claimant lease was superseded.");
      const inserted = await database.executeSql("INSERT INTO bridge.semantic_result_delivery (idempotency_key, execution_id, stage, validated_envelope, provenance, completion_fingerprint, lease_owner, lease_generation) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,'staged',$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING idempotency_key", [idempotencyKey, executionId, stage, JSON.stringify(valid), JSON.stringify((valid as { provider: unknown }).provider), lease.owner, lease.generation]);
      if (inserted.rows.length) return valid;
      const existing = await load(idempotencyKey, executionId);
      if (!existing) throw new Error("Semantic replay staging conflicts with a different execution identity.");
      return existing;
    },
    async acknowledge(idempotencyKey: string, executionId: string): Promise<void> { await database.executeSql("DELETE FROM bridge.semantic_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]); },
  };
}
