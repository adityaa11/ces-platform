import {
  CandidateBusinessRuleSchema,
  CandidateRequirementSchema,
  ProjectIntentSchema,
} from "@company/ces-greenfield-contracts";
import { z } from "zod";

export const AGENT_PROVIDER_CONTRACT_VERSION = "1.0.0" as const;

const NonEmptyString = z.string().trim().min(1);
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

export const ProviderSourceDocumentSchema = z
  .object({
    document_id: NonEmptyString,
    path: NonEmptyString,
    content_hash: Sha256Schema,
    content: z.string().min(1),
  })
  .strict();

export const AtlasProviderRequestSchema = z
  .object({
    schema_version: z.literal(AGENT_PROVIDER_CONTRACT_VERSION),
    prompt_contract_version: NonEmptyString,
    source_documents: z.array(ProviderSourceDocumentSchema).min(1),
    project_intent: ProjectIntentSchema,
  })
  .strict();

export const AtlasUncertaintySchema = z
  .object({
    id: NonEmptyString,
    severity: z.enum(["blocking", "high", "medium", "low"]),
    field: NonEmptyString,
    reason: NonEmptyString,
    affected_requirement_ids: z.array(NonEmptyString).default([]),
  })
  .strict();

export const AtlasConflictSchema = z
  .object({
    id: NonEmptyString,
    severity: z.enum(["blocking", "high", "medium", "low"]),
    statement: NonEmptyString,
    source_requirement_ids: z.array(NonEmptyString).min(2),
  })
  .strict();

export const AtlasClarificationQuestionSchema = z
  .object({
    id: NonEmptyString,
    question: NonEmptyString,
    affected_requirement_ids: z.array(NonEmptyString).default([]),
    blocking: z.boolean(),
  })
  .strict();

export const AtlasProviderResultSchema = z
  .object({
    schema_version: z.literal(AGENT_PROVIDER_CONTRACT_VERSION),
    candidate_requirements: z.array(CandidateRequirementSchema).default([]),
    candidate_business_rules: z.array(CandidateBusinessRuleSchema).default([]),
    uncertainties: z.array(AtlasUncertaintySchema).default([]),
    conflicts: z.array(AtlasConflictSchema).default([]),
    clarification_questions: z.array(AtlasClarificationQuestionSchema).default([]),
  })
  .strict();

export type AtlasProviderRequest = z.infer<typeof AtlasProviderRequestSchema>;
export type AtlasProviderResult = z.infer<typeof AtlasProviderResultSchema>;

export interface AgentProviderMetadata {
  readonly provider: string;
  readonly model: string;
}

export interface AtlasAgentProvider {
  readonly metadata: AgentProviderMetadata;
  analyze(request: AtlasProviderRequest): Promise<unknown>;
}

export async function runAtlasProvider(
  provider: AtlasAgentProvider,
  request: AtlasProviderRequest,
): Promise<AtlasProviderResult> {
  const validatedRequest = AtlasProviderRequestSchema.parse(request);
  const raw = await provider.analyze(validatedRequest);
  const parsed = AtlasProviderResultSchema.parse(raw);
  assertProviderCandidatesRemainUnapproved(parsed);
  return stampExecutionMetadata(
    parsed,
    provider.metadata,
    validatedRequest.prompt_contract_version,
  );
}

function assertProviderCandidatesRemainUnapproved(
  result: AtlasProviderResult,
): void {
  const candidates = [
    ...result.candidate_requirements,
    ...result.candidate_business_rules,
  ];
  for (const candidate of candidates) {
    if (!["explicit", "inferred"].includes(candidate.inference.origin)) {
      throw new Error(
        `Atlas provider cannot claim ${candidate.inference.origin} candidate origin`,
      );
    }
    if (!["candidate", "needs_confirmation"].includes(
      candidate.inference.review.status,
    )) {
      throw new Error(
        `Atlas provider cannot return ${candidate.inference.review.status} review state`,
      );
    }
  }
}

export class FixtureAtlasProvider implements AtlasAgentProvider {
  readonly metadata: AgentProviderMetadata;

  constructor(
    private readonly result: unknown,
    metadata: AgentProviderMetadata = {
      provider: "fixture",
      model: "deterministic-fixture",
    },
  ) {
    this.metadata = metadata;
  }

  async analyze(_request: AtlasProviderRequest): Promise<unknown> {
    return this.result;
  }
}

export interface HttpTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export type HttpTransport = (
  endpoint: string,
  init: {
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  },
) => Promise<HttpTransportResponse>;

export interface HttpAtlasProviderConfig extends AgentProviderMetadata {
  readonly endpoint: string;
  readonly apiKey?: string;
  readonly transport?: HttpTransport;
}

export class HttpAtlasProvider implements AtlasAgentProvider {
  readonly metadata: AgentProviderMetadata;
  private readonly endpoint: string;
  private readonly apiKey: string | undefined;
  private readonly transport: HttpTransport;

  constructor(config: HttpAtlasProviderConfig) {
    const endpoint = new URL(config.endpoint);
    if (endpoint.protocol !== "https:") {
      throw new Error("Atlas HTTP provider endpoint must use HTTPS");
    }
    this.endpoint = endpoint.toString();
    this.apiKey = config.apiKey;
    this.metadata = { provider: config.provider, model: config.model };
    this.transport = config.transport ?? defaultHttpTransport;
  }

  async analyze(request: AtlasProviderRequest): Promise<unknown> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    const response = await this.transport(this.endpoint, {
      headers,
      body: JSON.stringify({
        contract: AGENT_PROVIDER_CONTRACT_VERSION,
        model: this.metadata.model,
        request,
      }),
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Atlas HTTP provider failed with status ${response.status}`);
    }
    return response.body;
  }
}

async function defaultHttpTransport(
  endpoint: string,
  init: {
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  },
): Promise<HttpTransportResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: init.headers,
    body: init.body,
    redirect: "error",
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

function stampExecutionMetadata(
  result: AtlasProviderResult,
  metadata: AgentProviderMetadata,
  promptContractVersion: string,
): AtlasProviderResult {
  const stamp = <
    T extends { readonly inference: AtlasProviderResult["candidate_requirements"][number]["inference"] },
  >(candidate: T): T => ({
    ...candidate,
    inference: {
      ...candidate.inference,
      agent: {
        provider: metadata.provider,
        model: metadata.model,
        prompt_contract_version: promptContractVersion,
      },
    },
  });
  return {
    ...result,
    candidate_requirements: result.candidate_requirements.map(stamp),
    candidate_business_rules: result.candidate_business_rules.map(stamp),
  };
}
