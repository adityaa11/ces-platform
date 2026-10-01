import { parseSemanticBackgroundJob, parseSemanticResultEnvelope, parseSemanticTechnicalFailure, parseSemanticExtractionContext, parseSemanticReconciliationContext, semanticLimits, type SemanticBackgroundJob } from "@atlas/contracts";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type AtlasSemanticClientConfig = { readonly baseUrl: string; readonly contextPath: string; readonly resultPath: string; readonly failurePath: string; readonly serviceCredential: string; readonly timeoutMilliseconds: number };
export class AtlasSemanticClientError extends Error { constructor(readonly operation: "context" | "result" | "failure", message: string, readonly status?: number) { super(message); } }

const path = (value: string | undefined, fallback: string, name: string) => { const result = value ?? fallback; if (!result.startsWith("/") || result.includes("..") || result.length > 200) throw new Error(`${name} must be a bounded absolute internal path.`); return result; };
const positive = (value: string | undefined, fallback: number, name: string) => { const result = Number(value ?? fallback); if (!Number.isInteger(result) || result < 1 || result > 120_000) throw new Error(`${name} must be an integer between 1 and 120000.`); return result; };

export function loadAtlasSemanticClientConfig(environment: NodeJS.ProcessEnv = process.env): AtlasSemanticClientConfig {
  const baseUrl = environment.AGENTS_BRIDGE_ATLAS_URL ?? "http://localhost:3001";
  let parsed: URL; try { parsed = new URL(baseUrl); } catch { throw new Error("AGENTS_BRIDGE_ATLAS_URL must be an absolute HTTP(S) URL."); }
  if (!/^https?:$/u.test(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("AGENTS_BRIDGE_ATLAS_URL must be an absolute HTTP(S) URL without credentials or query parameters.");
  const serviceCredential = environment.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
  if (!serviceCredential || Buffer.byteLength(serviceCredential) < 32) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL must be at least 32 bytes.");
  return { baseUrl: baseUrl.replace(/\/$/u, ""), contextPath: path(environment.AGENTS_BRIDGE_ATLAS_SEMANTIC_CONTEXT_PATH, "/internal/semantic/context", "AGENTS_BRIDGE_ATLAS_SEMANTIC_CONTEXT_PATH"), resultPath: path(environment.AGENTS_BRIDGE_ATLAS_SEMANTIC_RESULT_PATH, "/internal/semantic/result", "AGENTS_BRIDGE_ATLAS_SEMANTIC_RESULT_PATH"), failurePath: path(environment.AGENTS_BRIDGE_ATLAS_SEMANTIC_FAILURE_PATH, "/internal/semantic/failure", "AGENTS_BRIDGE_ATLAS_SEMANTIC_FAILURE_PATH"), serviceCredential, timeoutMilliseconds: positive(environment.AGENTS_BRIDGE_ATLAS_TIMEOUT_MS, 30_000, "AGENTS_BRIDGE_ATLAS_TIMEOUT_MS") };
}

export function createAtlasSemanticClient(config: AtlasSemanticClientConfig, fetcher: FetchLike = fetch) {
  const request = async (operation: AtlasSemanticClientError["operation"], target: string, body: unknown, maximumBytes: number, signal: AbortSignal): Promise<Response> => {
    const serialized = JSON.stringify(body);
    if (Buffer.byteLength(serialized) > maximumBytes) throw new AtlasSemanticClientError(operation, `Atlas semantic ${operation} handoff exceeded its configured byte limit.`);
    const deadline = AbortSignal.timeout(config.timeoutMilliseconds); const requestSignal = AbortSignal.any([signal, deadline]);
    try {
      const response = await fetcher(new URL(target, `${config.baseUrl}/`).toString(), { method: "POST", headers: { authorization: `Bearer ${config.serviceCredential}`, "content-type": "application/json" }, body: serialized, signal: requestSignal });
      if (!response.ok) throw new AtlasSemanticClientError(operation, `Atlas semantic ${operation} handoff was rejected.`, response.status);
      return response;
    } catch (error) {
      if (error instanceof AtlasSemanticClientError) throw error;
      if (signal.aborted || deadline.aborted) throw new AtlasSemanticClientError(operation, `Atlas semantic ${operation} handoff was cancelled.`);
      throw new AtlasSemanticClientError(operation, `Atlas semantic ${operation} handoff was unavailable.`);
    }
  };
  return {
    async context(job: SemanticBackgroundJob, signal: AbortSignal): Promise<unknown> {
      const response = await request("context", config.contextPath, parseSemanticBackgroundJob(job), semanticLimits.jobBytes, signal);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > semanticLimits.contextBytes) throw new AtlasSemanticClientError("context", "Atlas semantic context exceeded its configured byte limit.");
      let value: unknown; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AtlasSemanticClientError("context", "Atlas semantic context was malformed."); }
      return job.skill.id === "atlas.semantic.extract" ? parseSemanticExtractionContext(value) : parseSemanticReconciliationContext(value);
    },
    async deliver(envelope: unknown, signal: AbortSignal): Promise<void> { await request("result", config.resultPath, parseSemanticResultEnvelope(envelope), semanticLimits.resultEnvelopeBytes, signal); },
    async fail(failure: unknown, signal: AbortSignal): Promise<void> { await request("failure", config.failurePath, parseSemanticTechnicalFailure(failure), semanticLimits.jobBytes, signal); },
  };
}
