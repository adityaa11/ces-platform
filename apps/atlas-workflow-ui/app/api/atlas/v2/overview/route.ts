import { NextResponse, type NextRequest } from "next/server";
import { atlasArtifactRoot, authorizeAtlasRequest, readKnowledgeOverview } from "../../../../../lib/knowledge-v2";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    authorizeAtlasRequest(request.headers.get("authorization"));
    const projectId = request.nextUrl.searchParams.get("project");
    const revision = Number(request.nextUrl.searchParams.get("revision"));
    if (!projectId || !Number.isInteger(revision) || revision < 1) throw new Error("Project and revision are required");
    return NextResponse.json(await readKnowledgeOverview({ root: atlasArtifactRoot(), projectId, revision,
      lifecycle: request.nextUrl.searchParams.get("lifecycle") === "approved" ? "approved" : "proposed" }));
  } catch (error) { return failure(error); }
}
function failure(error: unknown) { const message = error instanceof Error ? error.message : "Atlas unavailable";
  return NextResponse.json({ error: message }, { status: message.includes("authorization") ? 401 : 404 }); }
