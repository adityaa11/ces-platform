import { NextResponse, type NextRequest } from "next/server";
import { readModelDetailTab } from "../../../../lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const supportedTabs = new Set(["rules", "validations", "permissions", "states"]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const projectId = request.nextUrl.searchParams.get("project");
  const artifactProjectId = request.nextUrl.searchParams.get("artifact") ?? projectId;
  const subjectId = request.nextUrl.searchParams.get("subject");
  const tab = request.nextUrl.searchParams.get("tab");
  const revision = Number(request.headers.get("if-match"));
  if (!projectId || !artifactProjectId || !subjectId || !tab || !supportedTabs.has(tab)
    || !Number.isInteger(revision) || revision < 1) {
    return NextResponse.json({ error: "Project, subject, tab, and revision are required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await readModelDetailTab({ projectId, artifactProjectId, subjectId, revision,
      tab: tab as "rules" | "validations" | "permissions" | "states",
      lifecycle: request.nextUrl.searchParams.get("lifecycle") === "approved"
        ? "approved" : "proposed" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Focused detail unavailable";
    return NextResponse.json({ error: message }, { status: message.includes("stale") ? 409 : 404 });
  }
}
