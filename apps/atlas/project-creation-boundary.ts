import { createJiti } from "jiti";
import postgres from "postgres";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type Core = typeof import("../../packages/atlas-core/src/project-creation");
type Repository = typeof import("../../packages/atlas-db/src/project-repository");
type Store = typeof import("../../packages/document-store/src/local-filesystem-document-store");
const maximumRequestBytes = 40 * 1024 * 1024 + 64 * 1024;

function send(response: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }, status: number, body: object) {
  response.statusCode = status; response.setHeader("content-type", "application/json"); response.setHeader("cache-control", "no-store"); response.end(JSON.stringify(body));
}

async function readBounded(request: AsyncIterable<Uint8Array | string>, length: string | string[] | undefined) {
  if (typeof length === "string" && (!/^\d+$/.test(length) || Number(length) > maximumRequestBytes)) throw new RangeError();
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) { const bytes = Buffer.from(chunk); size += bytes.byteLength; if (size > maximumRequestBytes) throw new RangeError(); chunks.push(bytes); }
  return Buffer.concat(chunks);
}

/** Compose host route for the production multipart contract; it never uses fixture transport. */
export function createProjectCreationBoundary(): Plugin {
  return { name: "atlas-project-creation-boundary", async configureServer(server) {
    const databaseUrl = process.env.ATLAS_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!databaseUrl) return;
    const jiti = createJiti(import.meta.url);
    const [core, repository, store] = await Promise.all([
      jiti.import<Core>("../../packages/atlas-core/src/project-creation.ts"),
      jiti.import<Repository>("../../packages/atlas-db/src/project-repository.ts"),
      jiti.import<Store>("../../packages/document-store/src/local-filesystem-document-store.ts"),
    ]);
    const sql = postgres(databaseUrl, { max: 4 });
    const createProject = (command: Parameters<Core["createStoredAtlasProject"]>[0]) => core.createStoredAtlasProject(command, {
      projectRepository: new repository.PostgresAtlasProjectRepository(sql),
      documentStore: new store.LocalFilesystemDocumentStore(process.env.ATLAS_DOCUMENT_STORE_ROOT ?? resolve(process.cwd(), ".atlas-data")),
    });
    server.middlewares.use(async (request, response, next) => {
      if (new URL(request.url ?? "/", "http://atlas.local").pathname !== "/api/projects") return next();
      if (request.method !== "POST") { response.statusCode = 405; response.setHeader("allow", "POST"); response.end(); return; }
      try {
        const config = (await jiti.import<typeof import("../../packages/atlas-auth/src/config")>("../../packages/atlas-auth/src/config.ts")).loadAtlasAuthConfig(process.env);
        const origin = request.headers.origin;
        if (typeof origin !== "string" || !config.trustedOrigins.includes(origin)) { send(response, 403, { error: "Request origin is not allowed." }); return; }
        if (!request.headers["content-type"]?.toLowerCase().startsWith("multipart/form-data")) { send(response, 415, { error: "Project uploads must use multipart/form-data." }); return; }
        const bytes = await readBounded(request, request.headers["content-length"]);
        const headers = new Headers(); for (const [name, value] of Object.entries(request.headers)) if (typeof value === "string") headers.set(name, value);
        const form = await new Request("http://atlas.local/api/projects", { method: "POST", headers, body: bytes }).formData();
        const sessionResponse = await fetch(`${config.baseURL}/api/auth/get-session`, { headers: { cookie: headers.get("cookie") ?? "" } });
        const session = sessionResponse.ok ? await sessionResponse.json() as { user?: { id?: string } } : null;
        const creatorUserId = session?.user?.id;
        if (!creatorUserId) { send(response, 401, { error: "Sign in to create a project." }); return; }
        const projectId = form.get("projectId"), name = form.get("projectName"), description = form.get("projectDescription"), files = form.getAll("prdFiles[]");
        if (typeof projectId !== "string" || typeof name !== "string" || (description !== null && typeof description !== "string") || !files.length || files.length > core.maxProjectSources || files.some((file) => typeof file === "string")) { send(response, 400, { error: "Invalid project upload." }); return; }
        let total = 0;
        const sources = await Promise.all(files.map(async (file) => { const upload = file as File; if (upload.type.toLowerCase() !== "application/pdf") throw new TypeError("media"); if (!upload.size) throw new core.ProjectCreationValidationError("Source document bytes are required."); if (upload.size > core.maxProjectSourceBytes) throw new RangeError(); total += upload.size; if (total > core.maxProjectRequestBytes) throw new RangeError(); return { originalFilename: upload.name, bytes: new Uint8Array(await upload.arrayBuffer()), mediaType: "application/pdf" }; }));
        // Compose-only regression hook; unset in normal application execution.
        if (process.env.ATLAS_PROJECT_CREATION_TEST_FAILURE === "1") throw new Error("Injected project creation failure.");
        const created = await createProject({ projectId, name, description: typeof description === "string" && description.trim() ? description : null, creatorUserId, sources });
        send(response, 201, { project: created });
      } catch (error) {
        if (error instanceof core.ProjectCreationConflictError) send(response, 409, { error: "That project ID is already in use." });
        else if (error instanceof RangeError) send(response, 413, { error: "The project upload is too large." });
        else if (error instanceof TypeError && error.message === "media") send(response, 415, { error: "Source documents must be PDFs." });
        else if (error instanceof core.ProjectCreationValidationError) send(response, 400, { error: error.message });
        else send(response, 500, { error: "Unable to create the project. Please try again." });
      }
    });
    server.httpServer?.once("close", () => { void sql.end(); });
  } };
}
