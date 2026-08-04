import { NextResponse, type NextRequest } from "next/server";
import { readModelDetail } from "../../../../lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const projectId = request.nextUrl.searchParams.get("project");
  const artifactProjectId = request.nextUrl.searchParams.get("artifact") ?? projectId;
  const subjectId = request.nextUrl.searchParams.get("subject");
  const revisionHeader = request.headers.get("if-match");
  const revision = Number(revisionHeader);
  if (!projectId || !artifactProjectId || !subjectId || !revisionHeader || !Number.isInteger(revision) || revision < 1) {
    return NextResponse.json({ error: "Project, subject, and revision are required" }, { status: 400 });
  }
  const lifecycle = request.nextUrl.searchParams.get("lifecycle") === "approved"
    ? "approved" as const : "proposed" as const;
  try {
    return NextResponse.json(await readModelDetail({
      projectId, artifactProjectId, subjectId, revision, lifecycle,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detail unavailable";
    const status = message.includes("stale") || message.includes("does not match") ? 409 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
