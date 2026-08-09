"use client";
import { Background, BackgroundVariant, Controls, MarkerType, Position, ReactFlow,
  type Edge, type Node } from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { BrowserEvidence as Evidence } from "../lib/evidence-browser";
import { PdfEvidenceViewer } from "./pdf-evidence-viewer";
import { layeredGraphLayout } from "../lib/graph-layout";

type Summary = { knowledge_id: string; kind: string; display_name: string;
  support_status: string; child_count: number; representation_count: number;
  parent_id: string | null; depth: number; semantic_kind?: string };
type GraphNode = { graph_node_id: string; knowledge_id?: string; label: string;
  semantic_kind_id: string; evidence_ids: string[] };
type GraphEdge = { graph_edge_id: string; from_graph_node_id: string; to_graph_node_id: string;
  display_label: string; relationship_kind: string; evidence_ids: string[] };
type Knowledge = { knowledge_id: string; kind: string; display_name: string; support_status: string;
  parent_id: string | null; evidence_ids: string[]; child_ids: string[];
  representation_ids: string[]; semantic_kind?: string; confidence?: number;
  review_status?: string; decomposition_status?: string;
  visualization?: { graph_type_id: string; nodes: GraphNode[]; edges: GraphEdge[] } };
type Detail = { project_id: string; revision: number; authority: { lifecycle: string };
  node: Knowledge; parent: Summary | null; breadcrumb: Summary[]; children: Summary[];
  representations: Knowledge[]; source_coverage: { page_numbers: number[]; source_unit_count: number;
    evidence_count: number; overview_text: string[] } };
type Overview = { project_id: string; revision: number; authority: { lifecycle: string; authority: string };
  root: Knowledge; children: Summary[] };

export function KnowledgeWorkspace({ overview }: { overview: Overview }) {
  const [mainMinimized, setMainMinimized] = useState(false);
  const [selected, setSelected] = useState<Detail>(); const [expanded, setExpanded] = useState<Summary[]>(overview.children);
  const [representationId, setRepresentationId] = useState<string>();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const query = `project=${encodeURIComponent(overview.project_id)}&revision=${overview.revision}&lifecycle=${overview.authority.lifecycle}`;
  async function select(id: string) {
    const response = await fetch(`/api/atlas/v2/knowledge?${query}&knowledge=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error("Knowledge is unavailable");
    const detail = await response.json() as Detail; setSelected(detail);
    setRepresentationId(detail.representations[0]?.knowledge_id);
    setExpanded((items) => [...new Map([...items, ...detail.children].map((item) => [item.knowledge_id, item])).values()]);
    const evidenceResponse = await fetch(`/api/atlas/v2/evidence?${query}&knowledge=${encodeURIComponent(id)}`);
    if (evidenceResponse.ok) { const result = await evidenceResponse.json() as { evidence: Evidence[] };
      setEvidence(result.evidence); }
    else { setEvidence([]); }
  }
  async function selectEvidence(knowledgeId: string, evidenceId: string) {
    const response = await fetch(`/api/atlas/v2/evidence?${query}&knowledge=${encodeURIComponent(knowledgeId)}&evidence=${encodeURIComponent(evidenceId)}`);
    if (!response.ok) { setEvidence([]); return; }
    const result = await response.json() as { evidence: Evidence[] };
    setEvidence(result.evidence);
  }
  function navigateBreadcrumb(item: Summary) {
    if (item.knowledge_id === overview.root.knowledge_id) {
      setSelected(undefined); setEvidence([]); return;
    }
    void select(item.knowledge_id);
  }
  return <main><header><div><p className="eyebrow">Knowledge workspace</p><h1>{overview.project_id}</h1></div>
    <dl><div><dt>Lifecycle</dt><dd>{overview.authority.lifecycle}</dd></div>
      <div><dt>Authority</dt><dd>{overview.authority.authority}</dd></div>
      <div><dt>Revision</dt><dd>{overview.revision}</dd></div></dl></header>
    <div className="knowledge-workspace"><nav aria-label="Knowledge navigation"><h2>Explore</h2>
      <ul>{expanded.map((item) => <li key={item.knowledge_id}><button
        style={{ paddingLeft: `${.75 + item.depth * 1.1}rem` }} onClick={() => void select(item.knowledge_id)}>
        <strong>{item.display_name}</strong><span>{item.semantic_kind ?? item.kind} · {item.child_count} children · {item.representation_count} views</span></button></li>)}</ul></nav>
      <section className="knowledge-center"><div className="panel-heading"><div><p className="eyebrow">Always visible</p>
        <h2>{overview.root.display_name}</h2></div><button onClick={() => setMainMinimized(!mainMinimized)}>
          {mainMinimized ? "Restore" : "Minimize"}</button></div>
        {!mainMinimized && <GraphView knowledge={overview.root} onSelect={(id) => void select(id)}
          onEvidence={(id) => void selectEvidence(overview.root.knowledge_id, id)} />}
        {selected && <section className="supporting-graph"><nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>{selected.breadcrumb.map((item) => <li key={item.knowledge_id}><button
            aria-current={item.knowledge_id === selected.node.knowledge_id ? "page" : undefined}
            onClick={() => navigateBreadcrumb(item)}>{item.display_name}</button></li>)}</ol></nav>
          <div className="panel-heading"><div><p className="eyebrow">Selected knowledge</p>
            <h2>{selected.node.display_name}</h2></div><button onClick={() => setSelected(undefined)}>Close</button></div>
          <div className="semantic-summary"><dl><div><dt>Semantic kind</dt>
            <dd>{selected.node.semantic_kind ?? selected.node.kind}</dd></div>
            <div><dt>Source pages</dt><dd>{selected.source_coverage.page_numbers.join(", ") || "Unavailable"}</dd></div>
            <div><dt>Source units</dt><dd>{selected.source_coverage.source_unit_count}</dd></div>
            <div><dt>Evidence</dt><dd>{selected.source_coverage.evidence_count}</dd></div></dl>
            {selected.source_coverage.overview_text.length > 0 && <div className="source-overview">
              <h3>Source-derived overview</h3>{selected.source_coverage.overview_text.map((text, index) =>
                <p key={index}>{text}</p>)}</div>}</div>
          {selected.children.length > 0 && <><h3>Nested concepts</h3><div className="child-grid">
            {selected.children.map((child) => <button key={child.knowledge_id}
              onClick={() => void select(child.knowledge_id)}><strong>{child.display_name}</strong>
              <span>{child.semantic_kind ?? child.kind}</span></button>)}</div></>}
          {selected.representations.length > 0 && <><h3>Available representations</h3>
            <div className="representation-picker">{selected.representations.map((item) => <button
              key={item.knowledge_id} aria-pressed={representationId === item.knowledge_id}
              onClick={() => setRepresentationId(item.knowledge_id)}><strong>{item.display_name}</strong>
              <span>{item.visualization?.graph_type_id}</span></button>)}</div></>}
          {selected.representations.filter(({ knowledge_id }) => knowledge_id === representationId)
            .map((representation) => <section className="selected-representation" key={representation.knowledge_id}>
              <p className="eyebrow">Selected representation</p><h3>{representation.display_name}</h3>
              <GraphView knowledge={representation} onSelect={(id) => void select(id)}
                onEvidence={(id) => void selectEvidence(representation.knowledge_id, id)} /></section>)}
          {selected.children.length === 0 && selected.representations.length === 0 &&
            <p className="empty-detail">No deeper source-supported concepts or graph representations.</p>}
        </section>}
      </section><aside className="evidence-panel"><h2>PDF evidence</h2>
        <PdfEvidenceViewer evidence={evidence} documentUrl={(item) =>
          `/api/atlas/v2/document?${query}&document=${encodeURIComponent(item.location.document_id)}`} />
      </aside></div></main>;
}
function GraphView({ knowledge, onSelect, onEvidence }: { knowledge: Knowledge;
  onSelect: (id: string) => void; onEvidence: (id: string) => void }) {
  const graph = knowledge.visualization!;
  const layout = useMemo(() => layeredGraphLayout(graph.nodes.map(({ graph_node_id }) => graph_node_id),
    graph.edges.map(({ from_graph_node_id, to_graph_node_id }) => ({
      source: from_graph_node_id, target: to_graph_node_id }))), [graph]);
  const nodes = useMemo<Node[]>(() => graph.nodes.map((item) => ({ id: item.graph_node_id,
    position: layout.get(item.graph_node_id) ?? { x: 0, y: 0 }, data: { label: item.label },
    sourcePosition: Position.Right, targetPosition: Position.Left,
    className: `atlas-node ${item.semantic_kind_id.replaceAll(".", "-")}`,
    style: { width: 232, minHeight: 76 } })), [graph, layout]);
  const edges = useMemo<Edge[]>(() => graph.edges.map((item) => ({ id: item.graph_edge_id,
    source: item.from_graph_node_id, target: item.to_graph_node_id,
    type: "smoothstep", pathOptions: { borderRadius: 18, offset: 24 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    label: graph.edges.length <= 12 ? item.display_label : undefined,
    labelShowBg: true, labelBgPadding: [5, 3], labelBgBorderRadius: 4,
    className: `atlas-edge ${["activity_order", "state_transition", "audit_flow"].includes(item.relationship_kind)
      ? "workflow" : "dependency"}`
  })), [graph]);
  const linked = new Map(graph.nodes.map((item) => [item.graph_node_id, item.knowledge_id]));
  const evidenceByNode = new Map(graph.nodes.map((item) => [item.graph_node_id, item.evidence_ids]));
  const evidenceByEdge = new Map(graph.edges.map((item) => [item.graph_edge_id, item.evidence_ids]));
  return <><div className="graph-meta"><p className="graph-kind">{graph.graph_type_id}</p>
    <p>{graph.nodes.length} nodes · {graph.edges.length} relationships</p></div>
    <div className="graph-legend" aria-label="Relationship legend"><span><i className="legend-line workflow" />Workflow order</span>
      <span><i className="legend-line dependency" />Dependency</span></div>
    <div className="flow-canvas"><ReactFlow key={knowledge.knowledge_id} nodes={nodes}
    edges={edges} fitView fitViewOptions={{ padding: 0.18, minZoom: 0.35, maxZoom: 1.15 }}
    minZoom={0.2} maxZoom={1.8} nodesDraggable={false} nodesConnectable={false}
    onNodeClick={(_event, node) => {
      const id = linked.get(node.id); if (id) onSelect(id);
      else { const evidenceId = evidenceByNode.get(node.id)?.[0]; if (evidenceId) onEvidence(evidenceId); } }}
    onEdgeClick={(_event, edge) => { const evidenceId = evidenceByEdge.get(edge.id)?.[0];
      if (evidenceId) onEvidence(evidenceId); }}><Background variant={BackgroundVariant.Dots}
        gap={24} size={1} color="#cbd5e1" /><Controls showInteractive={false} /></ReactFlow></div>
    <details className="graph-summary"><summary>Accessible graph summary</summary><ul>
      {graph.nodes.map((node) => <li key={node.graph_node_id}>{node.label}</li>)}
      {graph.edges.map((edge) => <li key={edge.graph_edge_id}>{edge.from_graph_node_id} {edge.display_label} {edge.to_graph_node_id}</li>)}</ul></details></>;
}
