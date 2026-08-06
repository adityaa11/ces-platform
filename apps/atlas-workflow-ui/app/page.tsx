import { atlasArtifactRoot, readKnowledgeOverview } from "../lib/knowledge-v2";
import { KnowledgeWorkspace } from "./knowledge-workspace";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: {
  searchParams: Promise<{ project?: string; revision?: string; lifecycle?: string }>;
}) {
  const query = await searchParams; const revision = Number(query.revision ?? "1");
  if (!query.project) return <main className="state"><h1>Atlas</h1>
    <p>Select a generated project with <code>?project=project-id&amp;revision=1</code>.</p></main>;
  try {
    const overview = await readKnowledgeOverview({ root: atlasArtifactRoot(), projectId: query.project,
      revision, lifecycle: query.lifecycle === "approved" ? "approved" : "proposed" });
    return <KnowledgeWorkspace overview={overview} />;
  } catch (error) { return <main className="state"><h1>Workspace unavailable</h1>
    <p>{error instanceof Error ? error.message : "Atlas data could not be loaded."}</p></main>; }
}
