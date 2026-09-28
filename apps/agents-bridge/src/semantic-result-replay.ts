import { parseSemanticResultEnvelope } from "@atlas/contracts";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };

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
    async stage(idempotencyKey: string, executionId: string, envelope: unknown): Promise<void> {
      const valid = parseSemanticResultEnvelope(envelope);
      const stage = (valid as { skill: { id: string } }).skill.id === "atlas.semantic.extract" ? "extraction" : "reconciliation";
      const inserted = await database.executeSql("INSERT INTO bridge.semantic_result_delivery (idempotency_key, execution_id, stage, validated_envelope, provenance, completion_fingerprint) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,'staged') ON CONFLICT (idempotency_key) DO NOTHING RETURNING idempotency_key", [idempotencyKey, executionId, stage, JSON.stringify(valid), JSON.stringify((valid as { provider: unknown }).provider)]);
      if (inserted.rows.length) return;
      const existing = await load(idempotencyKey, executionId);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(valid)) throw new Error("Semantic replay staging conflicts with the immutable execution result.");
    },
    async acknowledge(idempotencyKey: string, executionId: string): Promise<void> { await database.executeSql("DELETE FROM bridge.semantic_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]); },
  };
}
