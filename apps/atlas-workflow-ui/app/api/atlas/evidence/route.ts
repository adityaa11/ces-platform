import { NextResponse, type NextRequest } from "next/server";
import { readEvidence } from "../../../../lib/evidence";
import { atlasArtifactRoot } from "../../../../lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const projectId = request.nextUrl.searchParams.get("project");
  const conceptId = request.nextUrl.searchParams.get("concept");
  const revision = Number(request.nextUrl.searchParams.get("revision"));
  if (!projectId || !conceptId || !Number.isInteger(revision) || revision < 1) {
    return NextResponse.json({ error: "Project, concept, and revision are required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await readEvidence({ root: atlasArtifactRoot(), projectId,
      canonicalConceptId: conceptId, revision,
      lifecycle: request.nextUrl.searchParams.get("lifecycle") === "approved"
        ? "approved" : "proposed" }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Evidence unavailable" },
      { status: 404 });
  }
}
