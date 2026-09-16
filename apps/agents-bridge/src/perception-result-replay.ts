import type { NormalizedDocument } from "@atlas/contracts";

type Database = { executeSql(query: string, parameters?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> };

/**
 * This short-lived Bridge-owned outbox contains normalized output only. It
 * never stores source bytes, source paths, grants, or service credentials.
 */
export function createPerceptionResultReplay(database: Database) {
  return {
    async load(idempotencyKey: string, executionId: string): Promise<NormalizedDocument | undefined> {
      const result = await database.executeSql("SELECT normalized_result FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]);
      if (!result.rows.length) return undefined;
      const value = result.rows[0]?.normalized_result;
      return (typeof value === "string" ? JSON.parse(value) : value) as NormalizedDocument;
    },
    async stage(idempotencyKey: string, executionId: string, result: NormalizedDocument): Promise<void> {
      await database.executeSql("INSERT INTO bridge.document_perception_result_delivery (idempotency_key, execution_id, normalized_result) VALUES ($1,$2,$3::jsonb) ON CONFLICT (idempotency_key) DO UPDATE SET normalized_result=EXCLUDED.normalized_result WHERE bridge.document_perception_result_delivery.execution_id=EXCLUDED.execution_id", [idempotencyKey, executionId, JSON.stringify(result)]);
    },
    async acknowledge(idempotencyKey: string, executionId: string): Promise<void> {
      await database.executeSql("DELETE FROM bridge.document_perception_result_delivery WHERE idempotency_key=$1 AND execution_id=$2", [idempotencyKey, executionId]);
    },
  };
}
