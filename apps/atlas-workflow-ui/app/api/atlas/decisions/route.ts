import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { executeDecision } from "../../../../lib/decision";
import { atlasArtifactRoot } from "../../../../lib/workspace";
import { ExpandedApprovalEligibilitySchema } from "@company/ces-proposed-project-model";

export const runtime = "nodejs";

const same = (left: string | undefined, right: string | undefined): boolean => {
  if (!left || !right) return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

const authenticated = (request: NextRequest) => same(request.cookies.get("ces_atlas_session")?.value,
  process.env.CES_ATLAS_REVIEW_SESSION_TOKEN);
const authorized = (projectId: string) => new Set((process.env.CES_ATLAS_REVIEW_PROJECTS ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean)).has(projectId);

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const projectId = request.nextUrl.searchParams.get("project");
  const subjectIds = request.nextUrl.searchParams.getAll("subject");
  if (!projectId || !authorized(projectId)) return NextResponse.json({ error: "Project access denied" }, { status: 403 });
  try {
    const eligibility = ExpandedApprovalEligibilitySchema.parse(JSON.parse(await readFile(resolve(
      atlasArtifactRoot(), projectId, "approval-eligibility.json"), "utf8")));
    return NextResponse.json({ project_id: projectId, proposal_revision: eligibility.proposal_revision,
      entities: eligibility.entities.filter(({ entity_id }) => subjectIds.includes(entity_id)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Eligibility unavailable" },
      { status: 404 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) {
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
    if (typeof command.project_id !== "string" || !authorized(command.project_id)) {
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
