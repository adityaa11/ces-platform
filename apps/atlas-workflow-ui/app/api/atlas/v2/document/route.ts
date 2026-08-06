import { readFile } from "node:fs/promises";
import { type NextRequest } from "next/server";
import { atlasArtifactRoot, authorizeAtlasRequest, parseByteRange, resolvePdfDocument } from "../../../../../lib/knowledge-v2";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<Response> {
  try {
    authorizeAtlasRequest(request.headers.get("authorization"));
    const projectId = request.nextUrl.searchParams.get("project");
    const documentId = request.nextUrl.searchParams.get("document");
    const revision = Number(request.nextUrl.searchParams.get("revision"));
    if (!projectId || !documentId || !Number.isInteger(revision) || revision < 1)
      throw new Error("Project, document, and revision are required");
    const document = await resolvePdfDocument({ artifactRoot: atlasArtifactRoot(), projectId,
      documentId, revision });
    const range = parseByteRange(request.headers.get("range"), document.size);
    const bytes = await readFile(document.path);
    const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
    return new Response(body, { status: range ? 206 : 200, headers: {
      "content-type": "application/pdf", "accept-ranges": "bytes",
      "content-length": String(body.byteLength), etag: `"${document.contentHash}"`,
      "cache-control": "private, max-age=0, must-revalidate",
      ...(range ? { "content-range": `bytes ${range.start}-${range.end}/${document.size}` } : {}) } });
  } catch (error) { const message = error instanceof Error ? error.message : "PDF unavailable";
    return Response.json({ error: message }, { status: message.includes("authorization") ? 401
      : message.includes("range") ? 416 : 404 }); }
}
