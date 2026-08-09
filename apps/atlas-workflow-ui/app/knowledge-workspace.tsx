"use client";
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { BrowserEvidence as Evidence } from "../lib/evidence-browser";
import { PdfEvidenceViewer } from "./pdf-evidence-viewer";

type Summary = { knowledge_id: string; kind: string; display_name: string;
  support_status: string; child_count: number };
type GraphNode = { graph_node_id: string; knowledge_id?: string; label: string;
  semantic_kind_id: string; evidence_ids: string[] };
type GraphEdge = { graph_edge_id: string; from_graph_node_id: string; to_graph_node_id: string;
  display_label: string; relationship_kind: string; evidence_ids: string[] };
type Knowledge = { knowledge_id: string; kind: string; display_name: string; support_status: string;
  parent_id: string | null; evidence_ids: string[]; child_ids: string[];
  visualization?: { graph_type_id: string; nodes: GraphNode[]; edges: GraphEdge[] } };
type Detail = { project_id: string; revision: number; authority: { lifecycle: string };
  node: Knowledge; parent: Summary | null; breadcrumb: Summary[]; children: Summary[] };
type Overview = { project_id: string; revision: number; authority: { lifecycle: string; authority: string };
  root: Knowledge; children: Summary[] };

export function KnowledgeWorkspace({ overview }: { overview: Overview }) {
  const [mainMinimized, setMainMinimized] = useState(false);
  const [selected, setSelected] = useState<Detail>(); const [expanded, setExpanded] = useState<Summary[]>(overview.children);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const query = `project=${encodeURIComponent(overview.project_id)}&revision=${overview.revision}&lifecycle=${overview.authority.lifecycle}`;
  async function select(id: string) {
    const response = await fetch(`/api/atlas/v2/knowledge?${query}&knowledge=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error("Knowledge is unavailable");
    const detail = await response.json() as Detail; setSelected(detail);
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
      <ul>{expanded.map((item) => <li key={item.knowledge_id}><button onClick={() => void select(item.knowledge_id)}>
        <strong>{item.display_name}</strong><span>{item.kind} · {item.child_count} children</span></button></li>)}</ul></nav>
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
          {selected.node.visualization ? <GraphView knowledge={selected.node} onSelect={(id) => void select(id)}
            onEvidence={(id) => void selectEvidence(selected.node.knowledge_id, id)} />
            : <div className="child-grid">{selected.children.map((child) => <button key={child.knowledge_id}
              onClick={() => void select(child.knowledge_id)}><strong>{child.display_name}</strong>
              <span>{child.kind}</span></button>)}</div>}
        </section>}
      </section><aside className="evidence-panel"><h2>PDF evidence</h2>
        <PdfEvidenceViewer evidence={evidence} documentUrl={(item) =>
          `/api/atlas/v2/document?${query}&document=${encodeURIComponent(item.location.document_id)}`} />
      </aside></div></main>;
}
function GraphView({ knowledge, onSelect, onEvidence }: { knowledge: Knowledge;
  onSelect: (id: string) => void; onEvidence: (id: string) => void }) {
  const graph = knowledge.visualization!;
  const nodes = useMemo<Node[]>(() => graph.nodes.map((item, index) => ({ id: item.graph_node_id,
    position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 150 }, data: { label: item.label },
    className: "atlas-node", style: { width: 210, minHeight: 72 } })), [graph]);
  const edges = useMemo<Edge[]>(() => graph.edges.map((item) => ({ id: item.graph_edge_id,
    source: item.from_graph_node_id, target: item.to_graph_node_id, label: item.display_label,
    markerEnd: { type: MarkerType.ArrowClosed }, className: "atlas-edge core" })), [graph]);
  const linked = new Map(graph.nodes.map((item) => [item.graph_node_id, item.knowledge_id]));
  const evidenceByNode = new Map(graph.nodes.map((item) => [item.graph_node_id, item.evidence_ids]));
  const evidenceByEdge = new Map(graph.edges.map((item) => [item.graph_edge_id, item.evidence_ids]));
  return <><p className="graph-kind">{graph.graph_type_id}</p><div className="flow-canvas"><ReactFlow nodes={nodes}
    edges={edges} fitView minZoom={0.2} maxZoom={2} onNodeClick={(_event, node) => {
      const id = linked.get(node.id); if (id) onSelect(id);
      else { const evidenceId = evidenceByNode.get(node.id)?.[0]; if (evidenceId) onEvidence(evidenceId); } }}
    onEdgeClick={(_event, edge) => { const evidenceId = evidenceByEdge.get(edge.id)?.[0];
      if (evidenceId) onEvidence(evidenceId); }}><Background /><Controls /></ReactFlow></div>
    <details className="graph-summary"><summary>Accessible graph summary</summary><ul>
      {graph.nodes.map((node) => <li key={node.graph_node_id}>{node.label}</li>)}
      {graph.edges.map((edge) => <li key={edge.graph_edge_id}>{edge.from_graph_node_id} {edge.display_label} {edge.to_graph_node_id}</li>)}</ul></details></>;
}
