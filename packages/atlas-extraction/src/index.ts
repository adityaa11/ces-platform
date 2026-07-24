import {
  AtlasProviderRequestSchema,
  runAtlasProvider,
  type AtlasAgentProvider,
  type AtlasProviderResult,
} from "@company/ces-agent-provider-sdk";
import {
  ingestMarkdownDocuments,
  type MarkdownDocumentInput,
  type SourceIndex,
} from "@company/ces-document-ingestion";
import {
  ProjectIntentSchema,
  type ProjectIntent,
  type SourceReference,
} from "@company/ces-greenfield-contracts";

export const ATLAS_EXTRACTION_VERSION = "1.0.0" as const;

export interface AtlasAnalysisInput {
  readonly documents: readonly MarkdownDocumentInput[];
  readonly projectIntent: ProjectIntent;
  readonly provider: AtlasAgentProvider;
  readonly promptContractVersion: string;
}

export interface AtlasExtractionReport {
  readonly schema_version: typeof ATLAS_EXTRACTION_VERSION;
  readonly provider: string;
  readonly model: string;
  readonly prompt_contract_version: string;
  readonly source_hashes: readonly {
    readonly document_id: string;
    readonly content_hash: string;
  }[];
}

export interface AtlasCandidateAnalysis {
  readonly schema_version: typeof ATLAS_EXTRACTION_VERSION;
  readonly source_index: SourceIndex;
  readonly analysis: AtlasProviderResult;
  readonly extraction_report: AtlasExtractionReport;
}

export async function analyzeAtlasCandidates(
  input: AtlasAnalysisInput,
): Promise<AtlasCandidateAnalysis> {
  const sourceIndex = ingestMarkdownDocuments(input.documents);
  const projectIntent = ProjectIntentSchema.parse(input.projectIntent);
  const request = AtlasProviderRequestSchema.parse({
    schema_version: "1.0.0",
    prompt_contract_version: input.promptContractVersion,
    source_documents: sourceIndex.documents.map((document) => ({
      document_id: document.document_id,
      path: document.path,
      content_hash: document.content_hash,
      content: document.content,
    })),
    project_intent: projectIntent,
  });
  const analysis = normalizeAnalysis(
    await runAtlasProvider(input.provider, request),
  );
  validateCandidateIdentities(analysis);
  validateProvenance(sourceIndex, analysis);
  return {
    schema_version: ATLAS_EXTRACTION_VERSION,
    source_index: sourceIndex,
    analysis,
    extraction_report: {
      schema_version: ATLAS_EXTRACTION_VERSION,
      provider: input.provider.metadata.provider,
      model: input.provider.metadata.model,
      prompt_contract_version: input.promptContractVersion,
      source_hashes: sourceIndex.documents.map(
        ({ document_id, content_hash }) => ({ document_id, content_hash }),
      ),
    },
  };
}

function validateCandidateIdentities(analysis: AtlasProviderResult): void {
  assertUnique(
    analysis.candidate_requirements.map(({ candidate_id }) => candidate_id),
    "candidate requirement ID",
  );
  assertUnique(
    analysis.candidate_requirements.map(
      ({ proposed_logical_id }) => proposed_logical_id,
    ),
    "proposed requirement logical ID",
  );
  assertUnique(
    analysis.candidate_business_rules.map(({ candidate_id }) => candidate_id),
    "candidate business-rule ID",
  );
}

function validateProvenance(
  sourceIndex: SourceIndex,
  analysis: AtlasProviderResult,
): void {
  const documents = new Map(
    sourceIndex.documents.map((document) => [document.document_id, document]),
  );
  const references: SourceReference[] = [
    ...analysis.candidate_requirements.map(({ source }) => source),
    ...analysis.candidate_business_rules.map(({ source }) => source),
  ];
  for (const reference of references) {
    const document = documents.get(reference.document_id);
    if (!document) {
      throw new Error(`Atlas candidate references unknown document ${reference.document_id}`);
    }
    if (
      reference.path !== document.path
      || reference.content_hash !== document.content_hash
    ) {
      throw new Error(
        `Atlas candidate source identity mismatch for ${reference.document_id}`,
      );
    }
    if (
      reference.line_start !== undefined
      && reference.line_start > document.line_count
    ) {
      throw new Error(
        `Atlas candidate source line exceeds ${reference.document_id}`,
      );
    }
    if (
      reference.line_end !== undefined
      && reference.line_end > document.line_count
    ) {
      throw new Error(
        `Atlas candidate source line exceeds ${reference.document_id}`,
      );
    }
  }
}

function normalizeAnalysis(result: AtlasProviderResult): AtlasProviderResult {
  return {
    ...result,
    candidate_requirements: sortBy(
      result.candidate_requirements,
      ({ candidate_id }) => candidate_id,
    ),
    candidate_business_rules: sortBy(
      result.candidate_business_rules,
      ({ candidate_id }) => candidate_id,
    ),
    uncertainties: sortBy(result.uncertainties, ({ id }) => id),
    conflicts: sortBy(result.conflicts, ({ id }) => id),
    clarification_questions: sortBy(
      result.clarification_questions,
      ({ id }) => id,
    ),
  };
}

function sortBy<T>(values: readonly T[], identify: (value: T) => string): T[] {
  return [...values].sort((left, right) =>
    compareText(identify(left), identify(right)));
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`Duplicate Atlas ${label}: ${duplicate}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
