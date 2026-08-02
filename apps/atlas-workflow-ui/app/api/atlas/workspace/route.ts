import { NextResponse, type NextRequest } from "next/server";
import { readWorkspace } from "../../../../lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const projectId = request.nextUrl.searchParams.get("project");
  if (!projectId) return NextResponse.json({ error: "Project is required" }, { status: 400 });
  const lifecycle = request.nextUrl.searchParams.get("lifecycle") === "approved"
    ? "approved" as const : "proposed" as const;
  try {
    return NextResponse.json(await readWorkspace({ projectId, lifecycle }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace unavailable";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
