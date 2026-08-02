import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { executeDecision } from "../../../../lib/decision";
import { atlasArtifactRoot } from "../../../../lib/workspace";

export const runtime = "nodejs";

const same = (left: string | undefined, right: string | undefined): boolean => {
  if (!left || !right) return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!same(request.cookies.get("ces_atlas_session")?.value,
    process.env.CES_ATLAS_REVIEW_SESSION_TOKEN)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!same(request.headers.get("x-csrf-token") ?? undefined,
    process.env.CES_ATLAS_CSRF_TOKEN)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }
  const reviewerIdentity = process.env.CES_ATLAS_REVIEWER_ID;
  const reviewerDisplayName = process.env.CES_ATLAS_REVIEWER_DISPLAY_NAME;
  if (!reviewerIdentity || !reviewerDisplayName) {
    return NextResponse.json({ error: "Reviewer session is not configured" }, { status: 503 });
  }
  try {
    const command = await request.json() as { project_id?: unknown };
    const authorizedProjects = new Set((process.env.CES_ATLAS_REVIEW_PROJECTS ?? "")
      .split(",").map((value) => value.trim()).filter(Boolean));
    if (typeof command.project_id !== "string" || !authorizedProjects.has(command.project_id)) {
      return NextResponse.json({ error: "Project access denied" }, { status: 403 });
    }
    return NextResponse.json(await executeDecision({ root: atlasArtifactRoot(),
      command, reviewerIdentity, reviewerDisplayName,
      decidedAt: new Date().toISOString() }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision failed";
    return NextResponse.json({ error: message }, { status: message === "STALE_REVISION" ? 409 : 422 });
  }
}
