import { canonicalSemanticBatchPlanInputV1, parseSemanticBatchPlanInputV1, type AcceptedDocumentPlannerResultV1, type SemanticBatchPlanInputV1 } from "@atlas/db";
import type { CompleteSemCandidateRequestEstimatorConfiguration } from "./complete-sem-candidate-request-estimator.js";
import { proposeStructuralFitCorpusPartition, type StructuralFitCapacityConsumer, type StructuralFitCorpusPartitionResult } from "./idser-structural-fit-corpus-partition.js";

export const semanticBatchPlanQueue = "bridge-semantic-batch-plan-v1";

export type TrustedPlanningScope = Readonly<{ projectId: string; workspaceId: string; bundleId: string; documentId: string }>;
export type BatchPlanAcceptance = Readonly<{ handoffId: string; bodySha256: string; input: SemanticBatchPlanInputV1; trustedScope: TrustedPlanningScope }>;
export type SqlDatabase = Readonly<{ executeSql(statement: string, values?: readonly unknown[]): Promise<{ readonly rows: readonly Record<string, unknown>[] }> }>;
export type BatchPlanAcceptedDocumentResolver = Readonly<{ resolveBackground(input: SemanticBatchPlanInputV1): Promise<AcceptedDocumentPlannerResultV1> }>;
export type BatchPlanPlanningDependencies = Readonly<{
  acceptedDocumentResolver: BatchPlanAcceptedDocumentResolver;
  estimatorConfiguration: CompleteSemCandidateRequestEstimatorConfiguration;
  capacityConsumer: StructuralFitCapacityConsumer;
}>;

export function parseSemanticBatchPlanJob(value: unknown): Readonly<{ handoffId: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("semantic batch-plan job is invalid");
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).length !== 1 || typeof candidate.handoffId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(candidate.handoffId)) throw new Error("semantic batch-plan job is invalid");
  return { handoffId: candidate.handoffId };
}

export class BatchPlanAcceptanceConflictError extends Error {
  constructor() { super("handoffId is already bound to a different immutable planning handoff"); this.name = "BatchPlanAcceptanceConflictError"; }
}

export class BatchPlanAcceptanceUnavailableError extends Error {
  constructor() { super("durable semantic batch-plan acceptance is unavailable"); this.name = "BatchPlanAcceptanceUnavailableError"; }
}

const scope = (value: unknown): TrustedPlanningScope => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("trusted planning scope is invalid");
  const item = value as Record<string, unknown>;
  const result = { projectId: item.projectId, workspaceId: item.workspaceId, bundleId: item.bundleId, documentId: item.documentId };
  if (!Object.values(result).every((part) => typeof part === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(part))) throw new Error("trusted planning scope is invalid");
  return result as TrustedPlanningScope;
};

const sameScope = (left: TrustedPlanningScope, right: TrustedPlanningScope): boolean => left.projectId === right.projectId && left.workspaceId === right.workspaceId && left.bundleId === right.bundleId && left.documentId === right.documentId;

/** The HTTP receiver owns only this atomic acceptance call. It never resolves a document or invokes a planner. */
export function createPostgresSemanticBatchPlanAcceptanceStore(database: SqlDatabase): Readonly<{ accept(acceptance: BatchPlanAcceptance): Promise<void> }> {
  return Object.freeze({
    async accept(acceptance) {
      const canonicalInput = canonicalSemanticBatchPlanInputV1(acceptance.input);
      try {
        await database.executeSql("SELECT bridge.accept_semantic_batch_plan($1,$2,$3,$4::jsonb)", [acceptance.handoffId, acceptance.bodySha256, canonicalInput, JSON.stringify(acceptance.trustedScope)]);
      } catch (error) {
        if (error instanceof Error && /different immutable planning handoff/i.test(error.message)) throw new BatchPlanAcceptanceConflictError();
        throw new BatchPlanAcceptanceUnavailableError();
      }
    },
  });
}

type ClaimedJob = Readonly<{ input: SemanticBatchPlanInputV1; trustedScope: TrustedPlanningScope }>;

function claimed(value: unknown): ClaimedJob | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (typeof row.canonicalInput !== "string") throw new Error("durable planning job payload is invalid");
  return { input: parseSemanticBatchPlanInputV1(row.canonicalInput), trustedScope: scope(row.trustedScope) };
}

/** Runs only from the pg-boss consumer. Throwing leaves the durable job retryable. */
export async function runSemanticBatchPlanJob(input: Readonly<{
  database: SqlDatabase;
  handoffId: string;
  planning: BatchPlanPlanningDependencies;
}>): Promise<void> {
  const result = await input.database.executeSql("SELECT bridge.claim_semantic_batch_plan($1) AS job", [input.handoffId]);
  const job = claimed(result.rows[0]?.job);
  if (!job) return;
  const acceptedDocument = await input.planning.acceptedDocumentResolver.resolveBackground(job.input);
  if (!sameScope(acceptedDocument.scope, job.trustedScope)) throw new Error("accepted document scope no longer matches the durable handoff scope");
  const proposal = await proposeStructuralFitCorpusPartition({
    acceptedDocument,
    estimatorConfiguration: input.planning.estimatorConfiguration,
    capacityConsumer: input.planning.capacityConsumer,
  });
  await persistOutcome(input.database, input.handoffId, proposal);
}

async function persistOutcome(database: SqlDatabase, handoffId: string, outcome: StructuralFitCorpusPartitionResult): Promise<void> {
  const completed = await database.executeSql("SELECT bridge.complete_semantic_batch_plan($1,$2,$3::jsonb) AS completed", [handoffId, outcome.disposition, JSON.stringify(outcome)]);
  if (completed.rows[0]?.completed !== true) throw new Error("semantic batch-plan job completion was not durably persisted");
}
