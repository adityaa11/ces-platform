import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { executeDecision } from "../../../../lib/decision";
import { atlasArtifactRoot, readWorkspace } from "../../../../lib/workspace";
import { ExpandedApprovalEligibilitySchema } from "@company/ces-proposed-project-model";

export const runtime = "nodejs";

const same = (left: string | undefined, right: string | undefined): boolean => {
  if (!left || !right) return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

const authenticated = (request: NextRequest) => same(request.cookies.get("ces_atlas_session")?.value,
  process.env.CES_ATLAS_REVIEW_SESSION_TOKEN);
const ArtifactId = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
const authorized = (projectId: string) => new Set((process.env.CES_ATLAS_REVIEW_PROJECTS ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean)).has(projectId);

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const projectId = request.nextUrl.searchParams.get("project");
  const artifactProjectId = request.nextUrl.searchParams.get("artifact") ?? projectId;
  const subjectIds = request.nextUrl.searchParams.getAll("subject");
  if (!projectId || !artifactProjectId || !ArtifactId.test(artifactProjectId) || !authorized(projectId)) {
    return NextResponse.json({ error: "Project access denied" }, { status: 403 });
  }
  try {
    const workspace = await readWorkspace({ projectId: artifactProjectId,
      root: atlasArtifactRoot(), lifecycle: "proposed" });
    if (workspace.project_id !== projectId) throw new Error("Project identity mismatch");
    const eligibility = ExpandedApprovalEligibilitySchema.parse(JSON.parse(await readFile(resolve(
      atlasArtifactRoot(), artifactProjectId, "approval-eligibility.json"), "utf8")));
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
    const artifactProjectId = request.headers.get("x-atlas-artifact") ?? command.project_id;
    if (typeof artifactProjectId !== "string" || !ArtifactId.test(artifactProjectId)) {
      return NextResponse.json({ error: "Invalid Atlas artifact identifier" }, { status: 400 });
    }
    return NextResponse.json(await executeDecision({ root: atlasArtifactRoot(), artifactProjectId,
      command, reviewerIdentity, reviewerDisplayName,
      decidedAt: new Date().toISOString() }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision failed";
    return NextResponse.json({ error: message }, { status: message === "STALE_REVISION" ? 409 : 422 });
  }
}
