import { createJiti } from "jiti";
import postgres from "postgres";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type AtlasCoreModule = typeof import("../../packages/atlas-core/src/index");
type AtlasDbModule = typeof import("../../packages/atlas-db/src/perception-authority");
type BackgroundQueue = typeof import("../agents-bridge/src/queue");
type DocumentStoreModule = typeof import("../../packages/document-store/src/local-filesystem-document-store");

const sourcePath = "/internal/perception/source";
const resultPath = "/internal/perception/result";
const perceptionFailurePath = "/internal/perception/failure";
const derivedAssetPath = "/internal/perception/derived";
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

async function readBytes(request: AsyncIterable<Uint8Array | string>, contentLength: string | string[] | undefined, maximumBytes: number): Promise<Uint8Array> {
  const declared = typeof contentLength === "string" && /^\d+$/u.test(contentLength) ? Number(contentLength) : undefined;
  if (declared !== undefined && declared > maximumBytes) throw new Error("Request body exceeds its configured limit.");
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) { const bytes = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk); size += bytes.byteLength; if (size > maximumBytes) throw new Error("Request body exceeds its configured limit."); chunks.push(bytes); }
  return new Uint8Array(Buffer.concat(chunks));
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
      // This read-only probe is enabled only by the disposable Compose harness.
      // It records the already-authenticated result request at this Atlas
      // boundary, rather than reconstructing it from Bridge persistence.
      if (!databaseUrl && !credential) return;
      if (!databaseUrl || !credential) throw new Error("ATLAS_DATABASE_URL and AGENTS_BRIDGE_SERVICE_CREDENTIAL are required together.");

      // Package sources use .js specifiers for their eventual build output.
      // Vite's Node-side config loader needs the workspace TypeScript resolver
      // so the local Compose process can execute those same sources directly.
      const jiti = createJiti(import.meta.url);
      const [core, database, documentStore, backgroundQueue] = await Promise.all([
        jiti.import<AtlasCoreModule>("../../packages/atlas-core/src/index.ts"),
        jiti.import<AtlasDbModule>("../../packages/atlas-db/src/perception-authority.ts"),
        jiti.import<DocumentStoreModule>("../../packages/document-store/src/local-filesystem-document-store.ts"),
        jiti.import<BackgroundQueue>("../agents-bridge/src/queue.ts"),
      ]);
      const sql = postgres(databaseUrl, { max: 4 });
      const perceptionQueue = await backgroundQueue.createTransactionalPerceptionQueueProducer(databaseUrl);
      const genericHandoffQueue = await backgroundQueue.createTransactionalGenericHandoffQueueProducer(databaseUrl);
      server.httpServer?.once("close", () => {
        void Promise.allSettled([perceptionQueue.close(), genericHandoffQueue.close(), sql.end({ timeout: 1 })]);
      });
      const sources = new documentStore.LocalFilesystemDocumentStore(process.env.ATLAS_DOCUMENT_STORE_ROOT ?? resolve(process.cwd(), ".atlas-data"));
      const authority = new database.PostgresPerceptionAuthority(sql, new core.PerceptionSourceGrantIssuer(credential), undefined, process.env.ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY, perceptionQueue, sources, genericHandoffQueue);
      const routes = core.createPerceptionInternalRoutes({ authority, sources, serviceCredential: credential, maximumSourceBytes: sourceLimit, maximumResultBytes: resultLimit });

      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://atlas.local").pathname;
        if (pathname !== sourcePath && pathname !== resultPath && pathname !== perceptionFailurePath && pathname !== derivedAssetPath) return next();
        if (request.method !== "POST") { response.statusCode = 405; response.setHeader("allow", "POST"); response.end(); return; }
        try {
          if (pathname === derivedAssetPath) {
            const encoded = request.headers["x-atlas-derived-metadata"];
            if (typeof encoded !== "string" || bridgeCredential(request) !== credential || request.headers["content-type"]?.split(";", 1)[0] !== "image/png") { sendJson(response, 400, { error: "Invalid derived asset handoff." }); return; }
            const metadata = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { request?: unknown; descriptor?: unknown };
            const requestValue = core.parseDocumentPerceptionRequest(metadata.request);
            const descriptor = metadata.descriptor as import("../../packages/atlas-core/src/perception-authority").DerivedAssetDescriptor;
            const asset = await authority.handoffDerived(requestValue, descriptor, await readBytes(request, request.headers["content-length"], resultLimit));
            sendJson(response, 200, asset); return;
          }
          const body = await readJson(request, request.headers["content-length"], pathname === sourcePath || pathname === perceptionFailurePath ? requestLimit : resultLimit + requestLimit);
          const credentialValue = bridgeCredential(request);
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
    },
  };
}
