import { createHash } from "node:crypto";
import {
  AtlasProviderRequestSchema,
  AtlasProviderResultSchema,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
import {
  AtlasIntermediateExtractionSchema,
  type AtlasIntermediateExtraction,
} from "./contracts.js";

interface TrustedAtlasExecution {
  readonly provider: string;
  readonly model: string;
}

interface SortableCandidate {
  readonly temporary_id: string;
  readonly source: {
    readonly document_id: string;
    readonly line_start?: number | undefined;
    readonly line_end?: number | undefined;
  };
}

const severityRank = { blocking: 0, high: 1, medium: 2, low: 3 } as const;

export function normalizeAtlasExtraction(
  intermediateValue: unknown,
  requestValue: unknown,
  execution: TrustedAtlasExecution,
): AtlasProviderResult {
  const intermediate = AtlasIntermediateExtractionSchema.parse(intermediateValue);
  const request = AtlasProviderRequestSchema.parse(requestValue);
  const documents = new Map(request.source_documents.map((document, index) => [
    document.document_id,
    { document, index, line_count: numberedLineCount(document.content) },
  ]));
  if (documents.size !== request.source_documents.length) {
    throw new Error("Atlas request contains duplicate source document IDs");
  }

  const requirements = sortCandidates(
    intermediate.candidate_requirements,
    "requirement",
    documents,
    (candidate) => candidate.title,
  );
  rejectDuplicateTemporaryIds(intermediate);
  rejectDuplicateSemanticCandidates(requirements, "requirement");
  const requirementIds = new Map(
    requirements.map((candidate, index) => [candidate.temporary_id, sequentialId("REQ-CAND", index)]),
  );

  const businessRules = sortCandidates(
    intermediate.candidate_business_rules.map((candidate) => ({
      ...candidate,
      source_requirement_ids: remapReferences(candidate.source_requirement_ids, requirementIds),
    })),
    "business_rule",
    documents,
    (candidate) => candidate.statement,
  );
  rejectDuplicateSemanticCandidates(businessRules, "business rule");

  const candidate_requirements = requirements.map((candidate, index) => ({
    schema_version: "1.0.0" as const,
    candidate_id: sequentialId("REQ-CAND", index),
    proposed_logical_id: normalizeText(candidate.proposed_logical_id),
    title: normalizeText(candidate.title),
    actor: candidate.actor,
    operation: candidate.operation,
    ...(candidate.state_transition ? { state_transition: candidate.state_transition } : {}),
    source: trustedSource(candidate.source, documents),
    inference: trustedInference(candidate.inference, execution, request.prompt_contract_version),
  }));

  const candidate_business_rules = businessRules.map((candidate, index) => ({
    schema_version: "1.0.0" as const,
    candidate_id: sequentialId("BR-CAND", index),
    proposed_logical_id: normalizeText(candidate.proposed_logical_id),
    type: candidate.type,
    statement: normalizeText(candidate.statement),
    source_requirement_ids: candidate.source_requirement_ids,
    source: trustedSource(candidate.source, documents),
    inference: trustedInference(candidate.inference, execution, request.prompt_contract_version),
  }));

  const uncertainties = intermediate.uncertainties
    .map((item) => ({
      severity: item.severity,
      field: normalizeText(item.field),
      reason: normalizeText(item.reason),
      affected_requirement_ids: remapReferences(item.affected_requirement_ids, requirementIds),
    }))
    .sort(compareUncertainty)
    .map((item, index) => ({ id: sequentialId("UNC", index), ...item }));

  const conflicts = intermediate.conflicts
    .map((item) => ({
      severity: item.severity,
      statement: normalizeText(item.statement),
      source_requirement_ids: remapReferences(item.source_requirement_ids, requirementIds),
    }))
    .sort(compareConflict)
    .map((item, index) => ({ id: sequentialId("CONFLICT", index), ...item }));

  const clarification_questions = intermediate.clarification_questions
    .map((item) => ({
      question: normalizeText(item.question),
      affected_requirement_ids: remapReferences(item.affected_requirement_ids, requirementIds),
      blocking: item.blocking,
    }))
    .sort(compareQuestion)
    .map((item, index) => ({ id: sequentialId("QUESTION", index), ...item }));

  return AtlasProviderResultSchema.parse({
    schema_version: "1.0.0",
    candidate_requirements,
    candidate_business_rules,
    uncertainties,
    conflicts,
    clarification_questions,
  });
}

function sortCandidates<T extends SortableCandidate>(
  candidates: readonly T[],
  kind: "requirement" | "business_rule",
  documents: ReadonlyMap<string, {
    readonly index: number;
    readonly line_count: number;
    readonly document: { readonly path: string; readonly content_hash: string };
  }>,
  text: (candidate: T) => string,
): T[] {
  for (const candidate of candidates) validateSource(candidate.source, documents);
  return [...candidates].sort((left, right) =>
    compareNumber(documentPosition(left, documents), documentPosition(right, documents))
    || compareOptionalNumber(left.source.line_start, right.source.line_start)
    || compareOptionalNumber(left.source.line_end, right.source.line_end)
    || compareText(kind, kind)
    || compareText(normalizeText(text(left)), normalizeText(text(right)))
    || compareText(semanticHash(left), semanticHash(right)));
}

function trustedSource(
  source: AtlasIntermediateExtraction["candidate_requirements"][number]["source"],
  documents: ReadonlyMap<string, {
    readonly index: number;
    readonly line_count: number;
    readonly document: { readonly path: string; readonly content_hash: string };
  }>,
) {
  validateSource(source, documents);
  const document = documents.get(source.document_id)!.document;
  return {
    document_id: source.document_id,
    path: document.path,
    ...(source.section ? { section: normalizeText(source.section) } : {}),
    ...(source.line_start === undefined ? {} : { line_start: source.line_start }),
    ...(source.line_end === undefined ? {} : { line_end: source.line_end }),
    content_hash: document.content_hash,
  };
}

function trustedInference(
  inference: AtlasIntermediateExtraction["candidate_requirements"][number]["inference"],
  execution: TrustedAtlasExecution,
  promptContractVersion: string,
) {
  return {
    origin: inference.origin,
    confidence: inference.confidence,
    agent: {
      provider: execution.provider,
      model: execution.model,
      prompt_contract_version: promptContractVersion,
    },
    review: { status: inference.review_status },
  };
}

function validateSource(
  source: SortableCandidate["source"],
  documents: ReadonlyMap<string, { readonly line_count: number }>,
): void {
  const document = documents.get(source.document_id);
  if (!document) throw new Error(`Unknown Atlas source document: ${source.document_id}`);
  if (source.line_start !== undefined && source.line_start > document.line_count) {
    throw new Error(`Atlas source line_start exceeds document ${source.document_id}`);
  }
  if (source.line_end !== undefined && source.line_end > document.line_count) {
    throw new Error(`Atlas source line_end exceeds document ${source.document_id}`);
  }
}

function documentPosition(
  candidate: SortableCandidate,
  documents: ReadonlyMap<string, { readonly index: number }>,
): number {
  return documents.get(candidate.source.document_id)!.index;
}

function remapReferences(values: readonly string[], ids: ReadonlyMap<string, string>): string[] {
  const remapped = values.map((value) => {
    const remapped = ids.get(value);
    if (!remapped) throw new Error(`Dangling Atlas requirement reference: ${value}`);
    return remapped;
  }).sort(compareText);
  if (new Set(remapped).size !== remapped.length) {
    throw new Error("Duplicate Atlas requirement reference");
  }
  return remapped;
}

function rejectDuplicateTemporaryIds(intermediate: AtlasIntermediateExtraction): void {
  const values = [
    ...intermediate.candidate_requirements,
    ...intermediate.candidate_business_rules,
    ...intermediate.uncertainties,
    ...intermediate.conflicts,
    ...intermediate.clarification_questions,
  ].map(({ temporary_id }) => temporary_id);
  if (new Set(values).size !== values.length) throw new Error("Duplicate Atlas temporary ID");
}

function rejectDuplicateSemanticCandidates(
  candidates: readonly object[],
  kind: string,
): void {
  const hashes = candidates.map(semanticHash);
  if (new Set(hashes).size !== hashes.length) {
    throw new Error(`Duplicate semantic Atlas ${kind} candidate`);
  }
}

function compareUncertainty(
  left: Omit<AtlasProviderResult["uncertainties"][number], "id">,
  right: Omit<AtlasProviderResult["uncertainties"][number], "id">,
): number {
  return compareText(left.affected_requirement_ids.join("\0"), right.affected_requirement_ids.join("\0"))
    || compareNumber(severityRank[left.severity], severityRank[right.severity])
    || compareText(left.field, right.field)
    || compareText(left.reason, right.reason)
    || compareText(semanticHash(left), semanticHash(right));
}

function compareConflict(
  left: Omit<AtlasProviderResult["conflicts"][number], "id">,
  right: Omit<AtlasProviderResult["conflicts"][number], "id">,
): number {
  return compareText(left.source_requirement_ids.join("\0"), right.source_requirement_ids.join("\0"))
    || compareNumber(severityRank[left.severity], severityRank[right.severity])
    || compareText(left.statement, right.statement)
    || compareText(semanticHash(left), semanticHash(right));
}

function compareQuestion(
  left: Omit<AtlasProviderResult["clarification_questions"][number], "id">,
  right: Omit<AtlasProviderResult["clarification_questions"][number], "id">,
): number {
  return compareText(left.affected_requirement_ids.join("\0"), right.affected_requirement_ids.join("\0"))
    || compareNumber(left.blocking ? 0 : 1, right.blocking ? 0 : 1)
    || compareText(left.question, right.question)
    || compareText(semanticHash(left), semanticHash(right));
}

function semanticHash(value: object): string {
  const semantic = { ...value } as Record<string, unknown>;
  delete semantic.temporary_id;
  delete semantic.candidate_id;
  delete semantic.id;
  return createHash("sha256").update(canonicalJson(semantic)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function numberedLineCount(content: string): number {
  return content.split(/\r\n|\n|\r/u).length;
}

function sequentialId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function compareOptionalNumber(left: number | undefined, right: number | undefined): number {
  if (left === undefined) return right === undefined ? 0 : 1;
  if (right === undefined) return -1;
  return compareNumber(left, right);
}

function compareNumber(left: number, right: number): number {
  return left - right;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
