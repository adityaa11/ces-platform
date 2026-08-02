"use client";

import { useEffect, useMemo, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from "@xyflow/react";
import type { ModelReviewWorkspace } from "@company/ces-atlas-model-review-contracts";
import "@xyflow/react/dist/style.css";

const elk = new ELK();
const width = 220;
const height = 88;

function canonicalId(node: ModelReviewWorkspace["overview"]["nodes"][number]["node"]): string | undefined {
  return node.identity_kind === "canonical_concept" ? node.canonical_concept_id : undefined;
}

export function GraphWorkspace({ workspace }: { workspace: ModelReviewWorkspace }) {
  const [overviewMinimized, setOverviewMinimized] = useState(false);
  const [detailMinimized, setDetailMinimized] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const order = new Map(workspace.overview.layout.node_order.map((id, index) => [id, index]));
  const ordered = useMemo(() => [...workspace.overview.nodes].sort((left, right) =>
    (order.get(left.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER)
      - (order.get(right.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER)),
  [workspace]);
  const [nodes, setNodes] = useState<Node[]>(() => ordered.map(({ node }, index) => ({
    id: node.projection_node_id, position: { x: index * (width + 40), y: 0 },
    data: { label: node.label, canonicalId: canonicalId(node), kind: node.node_kind },
    className: `atlas-node ${node.authoritative ? "authoritative" : "proposed"}`,
  })));
  const edges = useMemo<Edge[]>(() => workspace.overview.edges.map((edge) => ({
    id: edge.projection_edge_id, source: edge.from_projection_node_id,
    target: edge.to_projection_node_id, label: edge.relationship_kind.replace("atlas.relationship.", ""),
    animated: edge.relationship_status === "pending",
    className: `atlas-edge ${edge.relationship_status}`,
    markerEnd: { type: MarkerType.ArrowClosed },
  })), [workspace]);

  useEffect(() => {
    let active = true;
    void elk.layout({ id: "atlas-overview",
      layoutOptions: { "elk.algorithm": "layered", "elk.direction": workspace.overview.layout.direction,
        "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES" },
      children: ordered.map(({ node }) => ({ id: node.projection_node_id, width, height })),
      edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
    }).then((layout) => {
      if (!active) return;
      const positions = new Map(layout.children?.map((node) =>
        [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
      setNodes(ordered.map(({ node }) => ({ id: node.projection_node_id,
        position: positions.get(node.projection_node_id) ?? { x: 0, y: 0 },
        data: { label: node.label, canonicalId: canonicalId(node), kind: node.node_kind },
        className: `atlas-node ${node.authoritative ? "authoritative" : "proposed"}`,
      })));
    });
    return () => { active = false; };
  }, [workspace, ordered, edges]);

  const selected = workspace.overview.nodes.find(({ node }) =>
    node.projection_node_id === selectedId);
  const selectedCanonical = selected ? canonicalId(selected.node) : undefined;
  const highlighted = nodes.map((node) => ({ ...node, selected:
    selectedCanonical !== undefined && node.data.canonicalId === selectedCanonical }));

  return <div className="workspace">
    <nav aria-label="Semantic navigation"><h2>Semantic areas</h2><ul>{ordered.map(({ node, overview_role }) =>
      <li key={node.projection_node_id}><button type="button" onClick={() => {
        setSelectedId(node.projection_node_id); setDetailMinimized(false);
      }}><span>{overview_role.replaceAll("_", " ")}</span>{node.label}</button></li>)}</ul></nav>
    <section aria-labelledby="overview-title">
      <div className="panel-heading"><div><h2 id="overview-title">Project overview</h2>
        <p>{workspace.overview.summary.node_count} concepts · {workspace.overview.summary.edge_count} relationships</p></div>
        <button type="button" onClick={() => setOverviewMinimized((value) => !value)}>
          {overviewMinimized ? "Restore" : "Minimize"}</button></div>
      {workspace.overview.summary.is_truncated && <p className="notice">Overview is bounded. Additional backend layers are available.</p>}
      {!overviewMinimized && <div className="flow-canvas" aria-label="Interactive integrated project graph">
        <ReactFlow nodes={highlighted} edges={edges} fitView minZoom={0.2}
          onNodeClick={(_, node) => { setSelectedId(node.id); setDetailMinimized(false); }}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable>
          <Background /><Controls showInteractive={false} /></ReactFlow></div>}
      <details className="graph-summary"><summary>Ordered non-visual graph summary</summary>
        <ol>{ordered.map(({ node }) => <li key={node.projection_node_id}>{node.label}</li>)}</ol>
        <ul>{workspace.overview.edges.map((edge) => <li key={edge.projection_edge_id}>
          {edge.from_projection_node_id} — {edge.relationship_kind} → {edge.to_projection_node_id}</li>)}</ul></details>
      {selected && <section className="selected-detail" aria-labelledby="detail-title">
        <div className="panel-heading"><div><p className="eyebrow">Selected model detail</p>
          <h2 id="detail-title">{selected.node.label}</h2></div><div className="panel-actions">
          <button type="button" onClick={() => setDetailMinimized((value) => !value)}>
            {detailMinimized ? "Restore" : "Minimize"}</button>
          <button type="button" onClick={() => setSelectedId(undefined)}>Close</button></div></div>
        {!detailMinimized && <dl><div><dt>Canonical identity</dt><dd>{selectedCanonical ?? "Projection construct"}</dd></div>
          <div><dt>Semantic kind</dt><dd>{selected.node.node_kind}</dd></div>
          <div><dt>Overview inclusion</dt><dd>{selected.overview_inclusion_reason}</dd></div></dl>}
      </section>}
    </section>
    <aside><h2>Source evidence</h2>{selected ? <><h3>{selected.node.label}</h3>
      <ul>{selected.node.evidence_ids.map((id) => <li key={id}>{id}</li>)}</ul>
      <p className="notice">Exact representations are loaded from the governed evidence endpoint.</p></>
      : <p>Select a concept to inspect its exact original document representations.</p>}</aside>
  </div>;
}
