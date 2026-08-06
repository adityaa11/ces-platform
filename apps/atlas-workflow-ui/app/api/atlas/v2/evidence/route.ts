import { NextResponse, type NextRequest } from "next/server";
import { atlasArtifactRoot, authorizeAtlasRequest, readKnowledgeEvidence } from "../../../../../lib/knowledge-v2";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    authorizeAtlasRequest(request.headers.get("authorization"));
    const projectId = request.nextUrl.searchParams.get("project");
    const knowledgeId = request.nextUrl.searchParams.get("knowledge");
    const revision = Number(request.nextUrl.searchParams.get("revision"));
    if (!projectId || !knowledgeId || !Number.isInteger(revision) || revision < 1)
      throw new Error("Project, knowledge, and revision are required");
    return NextResponse.json(await readKnowledgeEvidence({ root: atlasArtifactRoot(), projectId,
      knowledgeId, revision, ...(request.nextUrl.searchParams.get("evidence")
        ? { evidenceId: request.nextUrl.searchParams.get("evidence")! } : {}),
      lifecycle: request.nextUrl.searchParams.get("lifecycle") === "approved" ? "approved" : "proposed" }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Evidence unavailable" },
    { status: error instanceof Error && error.message.includes("authorization") ? 401 : 404 }); }
}
