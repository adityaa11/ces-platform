import { createJiti } from "jiti";
import postgres from "postgres";
import { resolve } from "node:path";
import type { Plugin } from "vite";

type Authority = typeof import("../../packages/atlas-db/src/perception-authority");
type SourceGrant = typeof import("../../packages/atlas-core/src/source-grant");
type Store = typeof import("../../packages/document-store/src/local-filesystem-document-store");

const sha256 = /^[a-f0-9]{64}$/;
const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const assetRef = /^derived\/[0-9a-f-]{36}$/i;

function reply(response: { statusCode: number; setHeader(name: string, value: string | number): void; end(body?: string | Buffer): void }, status: number, body: { error: string }) {
  response.statusCode = status; response.setHeader("content-type", "application/json"); response.setHeader("cache-control", "no-store"); response.end(JSON.stringify(body));
}

/** Read-only, session-authenticated evidence resolver.  It has no source or job authority. */
export function createDerivedAssetResolver(): Plugin {
  return { name: "atlas-derived-asset-resolver", async configureServer(server) {
    const databaseUrl = process.env.ATLAS_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!databaseUrl) return;
    const jiti = createJiti(import.meta.url);
    const [authorityModule, sourceGrant, store] = await Promise.all([
      jiti.import<Authority>("../../packages/atlas-db/src/perception-authority.ts"),
      jiti.import<SourceGrant>("../../packages/atlas-core/src/source-grant.ts"),
      jiti.import<Store>("../../packages/document-store/src/local-filesystem-document-store.ts"),
    ]);
    const credential = process.env.AGENTS_BRIDGE_SERVICE_CREDENTIAL;
    if (!credential) throw new Error("AGENTS_BRIDGE_SERVICE_CREDENTIAL is required for derived evidence resolution.");
    const sql = postgres(databaseUrl, { max: 2 });
    const authority = new authorityModule.PostgresPerceptionAuthority(sql, new sourceGrant.PerceptionSourceGrantIssuer(credential), undefined, undefined, undefined, new store.LocalFilesystemDocumentStore(process.env.ATLAS_DOCUMENT_STORE_ROOT ?? resolve(process.cwd(), ".atlas-data")));
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://atlas.local");
      if (url.pathname !== "/api/derived-evidence") return next();
      if (request.method !== "GET") { response.statusCode = 405; response.setHeader("allow", "GET"); response.end(); return; }
      const documentId = url.searchParams.get("documentId"); const sourceSha256 = url.searchParams.get("sourceSha256"); const locatorId = url.searchParams.get("locatorId"); const reference = url.searchParams.get("assetRef");
      if (!documentId || !sourceSha256 || !locatorId || !reference || !identifier.test(documentId) || !sha256.test(sourceSha256) || !identifier.test(locatorId) || !assetRef.test(reference)) { reply(response, 400, { error: "Invalid derived evidence request." }); return; }
      try {
        const config = (await jiti.import<typeof import("../../packages/atlas-auth/src/config")>("../../packages/atlas-auth/src/config.ts")).loadAtlasAuthConfig(process.env);
        const sessionResponse = await fetch(`${config.baseURL}/api/auth/get-session`, { headers: { cookie: typeof request.headers.cookie === "string" ? request.headers.cookie : "" } });
        const session = sessionResponse.ok ? await sessionResponse.json() as { user?: { id?: string } } : null;
        if (!session?.user?.id) { reply(response, 401, { error: "Authentication is required." }); return; }
        const result = await authority.resolveDerived({ callerUserId: session.user.id, artifactId: documentId, sourceSha256, locatorId, assetRef: reference });
        response.statusCode = 200; response.setHeader("content-type", result.mediaType); response.setHeader("content-length", result.byteLength); response.setHeader("cache-control", "private, no-store"); response.setHeader("x-content-type-options", "nosniff"); response.end(Buffer.from(result.bytes));
      } catch { reply(response, 404, { error: "Derived evidence is unavailable." }); }
    });
    server.httpServer?.once("close", () => { void sql.end(); });
  } };
}
