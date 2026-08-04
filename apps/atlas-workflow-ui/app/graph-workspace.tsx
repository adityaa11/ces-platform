"use client";

import { useEffect, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from "@xyflow/react";
import type { ModelReviewDetail, ModelReviewWorkspace, SourceEvidenceProjection } from "@company/ces-atlas-model-review-contracts";
import { layoutDetail, layoutOverview, overviewNodeDimensions } from "../lib/layout";
import "@xyflow/react/dist/style.css";

const technicalKind = (value: string) => value.split(".").at(-1)?.replaceAll("-", " ") ?? value;

function canonicalId(node: ModelReviewWorkspace["overview"]["nodes"][number]["node"]): string | undefined {
  return node.identity_kind === "canonical_concept" ? node.canonical_concept_id : undefined;
}

export function GraphWorkspace({ workspace }: { workspace: ModelReviewWorkspace }) {
  const [overviewMinimized, setOverviewMinimized] = useState(false);
  const [detailMinimized, setDetailMinimized] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [evidence, setEvidence] = useState<SourceEvidenceProjection | "loading" | "unavailable">();
  const [detail, setDetail] = useState<ModelReviewDetail | "loading" | "stale" | "unavailable">();
  const [detailNodes, setDetailNodes] = useState<Node[]>([]);
  const order = new Map(workspace.overview.layout.node_order.map((id, index) => [id, index]));
  const ordered = useMemo(() => [...workspace.overview.nodes].sort((left, right) =>
    (order.get(left.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER)
      - (order.get(right.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER)),
  [workspace]);
  const [nodes, setNodes] = useState<Node[]>(() => ordered.map(({ node }, index) => ({
    id: node.projection_node_id, position: { x: index * 280, y: 0 },
    style: overviewNodeDimensions(node.label),
    data: { label: node.label, canonicalId: canonicalId(node), kind: node.node_kind },
    className: `atlas-node ${node.authoritative ? "authoritative" : "proposed"}`,
  })));
  const edges = useMemo<Edge[]>(() => workspace.overview.edges.map((edge) => ({
    id: edge.projection_edge_id, source: edge.from_projection_node_id,
    target: edge.to_projection_node_id,
    label: showAllLabels || !edge.relationship_kind.endsWith("provides-data-to")
      ? technicalKind(edge.relationship_kind) : undefined,
    animated: edge.relationship_status === "pending",
    data: { relationshipKind: edge.relationship_kind },
    className: `atlas-edge ${edge.relationship_status}${edge.relationship_kind.endsWith("provides-data-to")
      ? " dependency" : " core"}`,
    markerEnd: { type: MarkerType.ArrowClosed },
    type: "smoothstep",
  })), [workspace, showAllLabels]);

  useEffect(() => {
    let active = true;
    void layoutOverview(workspace).then((positions) => {
      if (!active) return;
      setNodes(ordered.map(({ node }) => ({ id: node.projection_node_id,
        position: positions[node.projection_node_id] ?? { x: 0, y: 0 },
        style: overviewNodeDimensions(node.label),
        data: { label: node.label, canonicalId: canonicalId(node), kind: node.node_kind },
        className: `atlas-node ${node.authoritative ? "authoritative" : "proposed"}`,
      })));
    });
    return () => { active = false; };
  }, [workspace, ordered, edges]);

  const selected = workspace.overview.nodes.find(({ node }) =>
    node.projection_node_id === selectedId);
  const selectedCanonical = selected ? canonicalId(selected.node) : undefined;
  useEffect(() => {
    if (!selectedCanonical) { setEvidence(undefined); return; }
    const controller = new AbortController();
    setEvidence("loading");
    const query = new URLSearchParams({ project: workspace.project_id,
      concept: selectedCanonical, revision: String(workspace.revision),
      lifecycle: workspace.authority.lifecycle === "approved" ? "approved" : "proposed" });
    void fetch(`/api/atlas/evidence?${query}`, { signal: controller.signal,
      credentials: "same-origin", headers: { Accept: "application/json",
        "If-Match": String(workspace.revision) } }).then(async (response) => {
      if (!response.ok) throw new Error("Evidence unavailable");
      setEvidence(await response.json() as SourceEvidenceProjection);
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setEvidence("unavailable");
    });
    return () => controller.abort();
  }, [selectedCanonical, workspace]);
  useEffect(() => {
    if (!selectedCanonical) { setDetail(undefined); setDetailNodes([]); return; }
    const controller = new AbortController();
    setDetail("loading");
    const query = new URLSearchParams({ project: workspace.project_id, subject: selectedCanonical,
      lifecycle: workspace.authority.lifecycle === "approved" ? "approved" : "proposed" });
    void fetch(`/api/atlas/details?${query}`, { signal: controller.signal,
      credentials: "same-origin", headers: { Accept: "application/json",
        "If-Match": String(workspace.revision) } }).then(async (response) => {
      if (!response.ok) { setDetail(response.status === 409 ? "stale" : "unavailable"); return; }
      const loaded = await response.json() as ModelReviewDetail;
      setDetail(loaded);
      const positions = await layoutDetail(loaded);
      setDetailNodes(loaded.graph.nodes.map((node) => ({ id: node.projection_node_id,
        position: positions[node.projection_node_id] ?? { x: 0, y: 0 },
        style: overviewNodeDimensions(node.label), data: { label: node.label,
          canonicalId: node.identity_kind === "canonical_concept" ? node.canonical_concept_id : undefined },
        className: `atlas-node ${node.authoritative ? "authoritative" : "proposed"}` })));
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setDetail("unavailable");
    });
    return () => controller.abort();
  }, [selectedCanonical, workspace]);
  const highlighted = nodes.map((node) => ({ ...node, selected:
    selectedCanonical !== undefined && node.data.canonicalId === selectedCanonical }));
  const readableEdges = edges.map((edge) => ({ ...edge,
    className: `${edge.className ?? ""}${selectedId
      ? edge.source === selectedId || edge.target === selectedId ? " highlighted" : " muted"
      : ""}` }));

  return <div className="workspace">
    <nav aria-label="Semantic navigation"><h2>Semantic areas</h2><ul>{ordered.map(({ node, overview_role }) =>
      <li key={node.projection_node_id}><button type="button" onClick={() => {
        setSelectedId(node.projection_node_id); setDetailMinimized(false);
      }}><span>{overview_role.replaceAll("_", " ")}</span>{node.label}</button></li>)}</ul></nav>
    <section aria-labelledby="overview-title">
      <div className="panel-heading"><div><h2 id="overview-title">Project overview</h2>
        <p>{workspace.overview.summary.node_count} concepts · {workspace.overview.summary.edge_count} relationships</p></div>
        <div className="panel-actions"><button type="button" onClick={() => setShowAllLabels((value) => !value)}>
          {showAllLabels ? "Reduce labels" : "Show all labels"}</button>
          <button type="button" onClick={() => setOverviewMinimized((value) => !value)}>
            {overviewMinimized ? "Restore" : "Minimize"}</button></div></div>
      {workspace.overview.summary.is_truncated && <p className="notice">Overview is bounded. Additional backend layers are available.</p>}
      {!overviewMinimized && <><div className="graph-legend" aria-label="Relationship legend">
        <span><i className="legend-line core" />Core relationship</span>
        <span><i className="legend-line dependency" />Data/reporting dependency</span>
        <small>Technical prefixes are hidden; semantics are unchanged.</small></div>
        <div className="flow-canvas" aria-label="Interactive integrated project graph">
        <ReactFlow nodes={highlighted} edges={readableEdges} fitView minZoom={0.25} maxZoom={1.5}
          fitViewOptions={{ padding: 0.14, minZoom: 0.25, maxZoom: 1 }}
          onNodeClick={(_, node) => { setSelectedId(node.id); setDetailMinimized(false); }}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable>
          <Background /><Controls showInteractive={false} /></ReactFlow></div></>}
      <details className="graph-summary"><summary>Ordered non-visual graph summary</summary>
        <ol>{ordered.map(({ node }) => <li key={node.projection_node_id}>{node.label}</li>)}</ol>
        <ul>{workspace.overview.edges.map((edge) => <li key={edge.projection_edge_id}>
          {edge.from_projection_node_id} — {edge.relationship_kind} → {edge.to_projection_node_id}</li>)}</ul></details>
      {selected && <section className="selected-detail" aria-labelledby="detail-title">
        <div className="panel-heading"><div><p className="eyebrow">{detail && typeof detail === "object"
          ? `${detail.subject.subject_role.replaceAll("_", " ")} detail` : "Selected detail"}</p>
          <h2 id="detail-title">{selected.node.label}</h2></div><div className="panel-actions">
          <button type="button" onClick={() => setDetailMinimized((value) => !value)}>
            {detailMinimized ? "Restore" : "Minimize"}</button>
          <button type="button" onClick={() => setSelectedId(undefined)}>Close</button></div></div>
        {!detailMinimized && <>
          {detail === "loading" && <p>Loading selected detailâ€¦</p>}
          {detail === "stale" && <p className="notice">This detail belongs to another revision. Reload the workspace.</p>}
          {detail === "unavailable" && <p className="notice">Atlas has no valid detail for this selection.</p>}
          {detail && typeof detail === "object" && <>
            {detail.availability === "partial" && <p className="notice">Atlas marks this detail as partial; review missing evidence before approval.</p>}
            <dl><div><dt>Canonical identity</dt><dd>{detail.subject.canonical_concept_id}</dd></div>
              <div><dt>Semantic role</dt><dd>{detail.subject.subject_role.replaceAll("_", " ")}</dd></div>
              <div><dt>Review state</dt><dd>{detail.subject.review_status}</dd></div></dl>
            {detail.availability === "explicitly_empty" ? <p className="notice">Atlas explicitly found no graph detail for this subject.</p>
              : <div className="detail-flow-canvas" aria-label={`${detail.subject.label} detail graph`}>
                <ReactFlow nodes={detailNodes} edges={detail.graph.edges.map((edge) => ({
                  id: edge.projection_edge_id, source: edge.from_projection_node_id,
                  target: edge.to_projection_node_id, label: technicalKind(edge.relationship_kind),
                  animated: edge.relationship_status === "pending", type: "smoothstep",
                  markerEnd: { type: MarkerType.ArrowClosed },
                  className: `atlas-edge ${edge.relationship_status}` }))}
                  fitView nodesDraggable={false} nodesConnectable={false}>
                  <Background /><Controls showInteractive={false} />
                </ReactFlow></div>}
            {detail.graph.ordering_status === "not_established"
              && <p className="notice">Ordering not established: {detail.graph.ordering_explanation}</p>}
            <h3>Connected project relationships</h3>
            {detail.connected_project_relationships.length
              ? <ul>{detail.connected_project_relationships.map((edge) => <li key={edge.projection_edge_id}>
                {technicalKind(edge.relationship_kind)} · {edge.relationship_status}</li>)}</ul>
              : <p>No connected project relationships were established.</p>}
          </>}
        </>}
      </section>}
    </section>
    <aside><h2>Source evidence</h2>{selected ? <><h3>{selected.node.label}</h3>
      {evidence === "loading" && <p>Loading exact source…</p>}
      {evidence === "unavailable" && <p className="notice">Exact traced evidence is unavailable. Approval must remain blocked.</p>}
      {evidence && typeof evidence === "object" && evidence.representations.map((representation) =>
        <article className="source-representation" key={representation.representation_id}>
          <p className="eyebrow">Exact original document text</p>
          <blockquote>{representation.exact_text}</blockquote>
          <dl><div><dt>Language</dt><dd>{representation.language}</dd></div>
            <div><dt>Document</dt><dd>{representation.document_id}</dd></div>
            <div><dt>Source unit</dt><dd>{representation.source_unit_id}</dd></div>
            <div><dt>Text span</dt><dd>{representation.text_span.start}–{representation.text_span.end}</dd></div></dl>
          {representation.pdf_location && <p>PDF page {representation.pdf_location.page_number}</p>}
        </article>)}
      {!evidence && <ul>{selected.node.evidence_ids.map((id) => <li key={id}>{id}</li>)}</ul>}
      <p className="notice">Original text is rendered as untrusted text; the UI does not interpret or translate it.</p></>
      : <p>Select a concept to inspect its exact original document representations.</p>}</aside>
  </div>;
}
