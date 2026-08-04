import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SourceEvidenceProjectionSchema, type SourceEvidenceProjection } from "@company/ces-atlas-model-review-contracts";
import { readWorkspace } from "./workspace";

type JsonObject = Record<string, unknown>;
const objects = (value: unknown): JsonObject[] => Array.isArray(value)
  ? value.filter((item): item is JsonObject => typeof item === "object" && item !== null) : [];
const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string") : [];

export async function readEvidence(input: {
  root: string;
  projectId: string;
  artifactProjectId?: string;
  canonicalConceptId: string;
  revision: number;
  lifecycle?: "proposed" | "approved";
}): Promise<SourceEvidenceProjection> {
  const artifactProjectId = input.artifactProjectId ?? input.projectId;
  const workspace = await readWorkspace({ ...input, projectId: artifactProjectId });
  if (workspace.project_id !== input.projectId) throw new Error("Evidence project identity mismatch");
  if (workspace.revision !== input.revision) throw new Error("Evidence revision is stale");
  const projected = workspace.overview.nodes.find(({ node }) =>
    node.identity_kind === "canonical_concept"
      && node.canonical_concept_id === input.canonicalConceptId)?.node;
  const directory = resolve(input.root, artifactProjectId);
  const [sourceUnitsValue, claimsValue, modelValue] = await Promise.all([
    readFile(resolve(directory, "source-units.json"), "utf8"),
    readFile(resolve(directory, "atomic-claims.json"), "utf8"),
    readFile(resolve(directory, "proposed-project-model.json"), "utf8"),
  ]).then((values) => values.map((value) => JSON.parse(value) as unknown));
  const sourceUnits = objects(sourceUnitsValue);
  const claims = objects((claimsValue as JsonObject).claims);
  const model = modelValue as JsonObject;
  const records = objects(model.records);
  const operations = objects(model.operations);
  const directRecord = records.find(({ id }) => id === input.canonicalConceptId);
  const directOperation = operations.find(({ operation_id }) => operation_id === input.canonicalConceptId);
  const evidenceIds = projected?.evidence_ids
    ?? (directRecord ? strings(directRecord.source_unit_ids)
      : strings(directOperation?.source_unit_ids));
  if (evidenceIds.length === 0) throw new Error("Concept is not present in this workspace revision");
  const representations = evidenceIds.flatMap((sourceUnitId) => {
    const unit = sourceUnits.find(({ id }) => id === sourceUnitId);
    const claim = claims.find(({ source_unit_id }) => source_unit_id === sourceUnitId);
    const record = records.find(({ source_unit_ids }) => strings(source_unit_ids).includes(sourceUnitId));
    if (!unit || !claim || !record || typeof unit.exact_text !== "string"
      || typeof unit.document_revision_id !== "string" || typeof claim.claim_id !== "string"
      || typeof record.id !== "string") return [];
    const operation = operations.find(({ semantic_record_ids }) =>
      strings(semantic_record_ids).includes(record.id as string));
    const representation_id = `${sourceUnitId}.representation`;
    const document_id = unit.document_revision_id.replace(/\.rev\..*$/u, "");
    return [{ representation: { representation_id, exact_text: unit.exact_text,
      language: typeof (unit.language_detection as JsonObject | undefined)?.detected_language === "string"
        ? (unit.language_detection as JsonObject).detected_language as string : "und",
      document_id, source_unit_id: sourceUnitId,
      text_span: { start: 0, end: unit.exact_text.length } },
      trace: { representation_id, document_id, source_unit_id: sourceUnitId,
      atomic_claim_id: claim.claim_id, canonical_record_id: record.id,
      ...(typeof operation?.workflow_id === "string" ? { workflow_id: operation.workflow_id } : {}),
      ...(typeof operation?.operation_id === "string" ? { operation_id: operation.operation_id } : {}) } }];
  });
  if (representations.length === 0) throw new Error("Exact traced evidence is unavailable");
  return SourceEvidenceProjectionSchema.parse({
    evidence_id: `${input.canonicalConceptId}.evidence`,
    canonical_concept_id: input.canonicalConceptId,
    representations: representations.map(({ representation }) => representation),
    traces: representations.map(({ trace }) => trace),
  });
}
