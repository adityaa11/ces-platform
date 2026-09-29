import { createJiti } from "jiti";
import postgres from "postgres";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type AtlasCoreModule = typeof import("../../packages/atlas-core/src/index");
type AtlasDbModule = typeof import("../../packages/atlas-db/src/perception-authority");
type SemanticDbModule = typeof import("../../packages/atlas-db/src/semantic-authority");
type ExtractionAcceptanceModule = typeof import("../../packages/atlas-db/src/extraction-acceptance");
type ReconciliationAcceptanceModule = typeof import("../../packages/atlas-db/src/reconciliation-acceptance");
type ReconciliationSelectorModule = typeof import("../../packages/atlas-db/src/reconciliation-selector");
type BackgroundQueue = typeof import("../agents-bridge/src/queue");
type BackgroundExecutionJob = import("../agents-bridge/src/queue").BackgroundExecutionJob;
type DocumentStoreModule = typeof import("../../packages/document-store/src/local-filesystem-document-store");

const sourcePath = "/internal/perception/source";
const resultPath = "/internal/perception/result";
const perceptionFailurePath = "/internal/perception/failure";
const semanticContextPath = "/internal/semantic/context";
const semanticResultPath = "/internal/semantic/result";
const semanticFailurePath = "/internal/semantic/failure";
const requestLimit = 16 * 1024;
const sourceLimit = 20 * 1024 * 1024;
const resultLimit = 10 * 1024 * 1024;

function bridgeCredential(request: { readonly headers: Record<string, string | string[] | undefined> }): string | undefined {
  const value = request.headers.authorization;
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return undefined;
  return value.slice("Bearer ".length);
}

async function readJson(request: AsyncIterable<Uint8Array | string>, contentLength: string | string[] | undefined, maximumBytes: number): Promise<unknown> {
  const declared = typeof contentLength === "string" && /^\d+$/u.test(contentLength) ? Number(contentLength) : undefined;
  if (declared !== undefined && declared > maximumBytes) throw new Error("Request body exceeds its configured limit.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += bytes.byteLength;
    if (size > maximumBytes) throw new Error("Request body exceeds its configured limit.");
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"));
}

function sendJson(response: { statusCode: number; setHeader(name: string, value: string | number): void; end(body?: string): void }, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

/**
 * Compose-only Atlas host boundary. The production Cloudflare worker remains
 * free of PostgreSQL and filesystem dependencies; the local stack uses this
 * Vite middleware so Bridge can exercise the same framework-neutral route
 * contract without adding another service.
 */
export function createAtlasPerceptionInternalPlugin(): Plugin {
  return {
    name: "atlas-perception-internal-boundary",
    async configureServer(server) {
      const databaseUrl = process.env.ATLAS_DATABASE_URL ?? process.env.DATABASE_URL;
      const credential = process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
      if (!databaseUrl && !credential) return;
      if (!databaseUrl || !credential) throw new Error("ATLAS_DATABASE_URL and AGENTS_BRIDGE_SERVICE_CREDENTIAL are required together.");

      // Package sources use .js specifiers for their eventual build output.
      // Vite's Node-side config loader needs the workspace TypeScript resolver
      // so the local Compose process can execute those same sources directly.
      const jiti = createJiti(import.meta.url);
      const [core, database, semanticDatabase, extractionAcceptance, reconciliationAcceptance, reconciliationSelector, documentStore, backgroundQueue] = await Promise.all([
        jiti.import<AtlasCoreModule>("../../packages/atlas-core/src/index.ts"),
        jiti.import<AtlasDbModule>("../../packages/atlas-db/src/perception-authority.ts"),
        jiti.import<SemanticDbModule>("../../packages/atlas-db/src/semantic-authority.ts"),
        jiti.import<ExtractionAcceptanceModule>("../../packages/atlas-db/src/extraction-acceptance.ts"),
        jiti.import<ReconciliationAcceptanceModule>("../../packages/atlas-db/src/reconciliation-acceptance.ts"),
        jiti.import<ReconciliationSelectorModule>("../../packages/atlas-db/src/reconciliation-selector.ts"),
        jiti.import<DocumentStoreModule>("../../packages/document-store/src/local-filesystem-document-store.ts"),
        jiti.import<BackgroundQueue>("../agents-bridge/src/queue.ts"),
      ]);
      const sql = postgres(databaseUrl, { max: 4 });
      const semanticQueue = await backgroundQueue.createTransactionalQueueProducer(databaseUrl);
      const perceptionQueue = await backgroundQueue.createTransactionalPerceptionQueueProducer(databaseUrl);
      // pg-boss's Drizzle transaction type is narrower than the Atlas
      // persistence port, while both adapters receive this same SQL transaction.
      const atlasSemanticQueue = { enqueue: (transaction: unknown, job: BackgroundExecutionJob) => semanticQueue.enqueue(transaction as never, job) };
      const authority = new database.PostgresPerceptionAuthority(sql, new core.PerceptionSourceGrantIssuer(credential), atlasSemanticQueue);
      const sources = new documentStore.LocalFilesystemDocumentStore(process.env.ATLAS_DOCUMENT_STORE_ROOT ?? resolve(process.cwd(), ".atlas-data"));
      const routes = core.createPerceptionInternalRoutes({ authority, sources, serviceCredential: credential, maximumSourceBytes: sourceLimit, maximumResultBytes: resultLimit });
      const semanticAuthority = new semanticDatabase.PostgresSemanticAuthority(sql, new reconciliationSelector.PostgresReconciliationSelector(sql));
      const extractionHandler = new extractionAcceptance.PostgresExtractionAcceptanceHandler(atlasSemanticQueue);
      const reconciliationHandler = new reconciliationAcceptance.PostgresReconciliationAcceptanceHandler({ authority, queue: perceptionQueue });
      const semanticRoutes = core.createSemanticInternalRoutes({ authority: semanticAuthority, serviceCredential: credential, handler: { accept: async (input, transaction) => {
        const skill = (input.envelope as { skill?: { id?: string } }).skill?.id;
        if (skill === "atlas.semantic.extract") await extractionHandler.accept(input, transaction);
        else if (skill === "atlas.semantic.reconcile") await reconciliationHandler.accept(input, transaction);
        else throw new Error("Semantic acceptance handler is unavailable for this stage.");
      } } });

      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://atlas.local").pathname;
        if (pathname !== sourcePath && pathname !== resultPath && pathname !== perceptionFailurePath && pathname !== semanticContextPath && pathname !== semanticResultPath && pathname !== semanticFailurePath) return next();
        if (request.method !== "POST") { response.statusCode = 405; response.setHeader("allow", "POST"); response.end(); return; }
        try {
          const body = await readJson(request, request.headers["content-length"], pathname === sourcePath || pathname === semanticContextPath || pathname === semanticFailurePath ? requestLimit : resultLimit + requestLimit);
          const credentialValue = bridgeCredential(request);
          if (pathname === semanticContextPath) { const result = await semanticRoutes.context(credentialValue, body); sendJson(response, result.status, result.body); return; }
          if (pathname === semanticResultPath) { const result = await semanticRoutes.deliver(credentialValue, body); if (result.status === 204) { response.statusCode = 204; response.end(); } else sendJson(response, result.status, result.body); return; }
          if (pathname === semanticFailurePath) { const result = await semanticRoutes.fail(credentialValue, body); if (result.status === 204) { response.statusCode = 204; response.end(); } else sendJson(response, result.status, result.body); return; }
          if (pathname === sourcePath) {
            const result = await routes.redeem(credentialValue, body);
            if (result.body instanceof Uint8Array) {
              response.statusCode = result.status;
              response.setHeader("content-type", result.contentType);
              response.setHeader("content-length", result.body.byteLength);
              response.setHeader("cache-control", "no-store");
              response.end(Buffer.from(result.body));
            } else sendJson(response, result.status, result.body);
            return;
          }
          if (pathname === perceptionFailurePath) {
            const result = await routes.fail(credentialValue, body);
            if (result.status === 204) { response.statusCode = 204; response.setHeader("cache-control", "no-store"); response.end(); }
            else sendJson(response, result.status, result.body);
            return;
          }
          if (!body || typeof body !== "object" || Array.isArray(body)) { sendJson(response, 400, { error: "Invalid perception internal request." }); return; }
          const envelope = body as { request?: unknown; result?: unknown };
          const result = await routes.deliver(credentialValue, envelope.request, envelope.result);
          if (result.status === 204) { response.statusCode = 204; response.setHeader("cache-control", "no-store"); response.end(); }
          else sendJson(response, result.status, result.body);
        } catch {
          sendJson(response, 400, { error: "Invalid perception internal request." });
        }
      });
      server.httpServer?.once("close", () => { void semanticQueue.close(); void perceptionQueue.close(); void sql.end(); });
    },
  };
}
