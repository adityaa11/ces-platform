import { readWorkspace } from "../lib/workspace";
import { GraphWorkspace } from "./graph-workspace";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ project?: string; lifecycle?: string }>;
}) {
  const query = await searchParams;
  if (!query.project) return <main className="state"><h1>CES Atlas</h1>
    <p>Select a generated project with <code>?project=project-id</code>.</p></main>;
  try {
    const workspace = await readWorkspace({ projectId: query.project,
      lifecycle: query.lifecycle === "approved" ? "approved" : "proposed" });
    return <main>
      <header><div><p className="eyebrow">Model review workspace</p>
        <h1>{workspace.project_id}</h1></div>
        <dl><div><dt>Lifecycle</dt><dd>{workspace.authority.lifecycle}</dd></div>
          <div><dt>Authority</dt><dd>{workspace.authority.authority}</dd></div>
          <div><dt>Execution</dt><dd>{workspace.authority.downstream_execution.status}</dd></div>
          <div><dt>Revision</dt><dd>{workspace.revision}</dd></div></dl></header>
      <GraphWorkspace workspace={workspace} />
    </main>;
  } catch (error) {
    return <main className="state"><h1>Workspace unavailable</h1>
      <p>{error instanceof Error ? error.message : "Atlas data could not be loaded."}</p></main>;
  }
}
