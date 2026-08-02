import { readWorkspace } from "../lib/workspace";

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
      <div className="workspace">
        <nav aria-label="Semantic navigation"><h2>Semantic areas</h2>
          <ul>{workspace.overview.nodes.map(({ node, overview_role }) =>
            <li key={node.projection_node_id}><a href={`#${node.projection_node_id}`}>
              <span>{overview_role.replaceAll("_", " ")}</span>{node.label}</a></li>)}</ul></nav>
        <section aria-labelledby="overview-title"><h2 id="overview-title">Project overview</h2>
          <p>{workspace.overview.summary.node_count} concepts · {workspace.overview.summary.edge_count} relationships</p>
          <div className="graph" role="list" aria-label="Project concepts">
            {workspace.overview.nodes.map(({ node }) => <article role="listitem"
              id={node.projection_node_id} key={node.projection_node_id}>
              <small>{node.node_kind.replace("atlas.node.", "")}</small><h3>{node.label}</h3>
              <p>{node.evidence_ids.length} evidence reference(s)</p></article>)}</div>
          <h2>Relationships</h2><ol className="relationships">
            {workspace.overview.edges.map((edge) => <li key={edge.projection_edge_id}>
              {edge.from_projection_node_id} <strong>{edge.relationship_kind}</strong> {edge.to_projection_node_id}</li>)}</ol>
        </section>
        <aside><h2>Source evidence</h2><p>Select a concept to inspect its exact original document representations.</p>
          <p className="notice">Evidence is referenced by the backend and never reconstructed in this UI.</p></aside>
      </div>
    </main>;
  } catch (error) {
    return <main className="state"><h1>Workspace unavailable</h1>
      <p>{error instanceof Error ? error.message : "Atlas data could not be loaded."}</p></main>;
  }
}
