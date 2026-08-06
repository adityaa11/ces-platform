"use client";
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";

type Summary = { knowledge_id: string; kind: string; display_name: string;
  support_status: string; child_count: number };
type GraphNode = { graph_node_id: string; knowledge_id?: string; label: string; semantic_kind_id: string };
type GraphEdge = { graph_edge_id: string; from_graph_node_id: string; to_graph_node_id: string;
  display_label: string; relationship_kind: string };
type Knowledge = { knowledge_id: string; kind: string; display_name: string; support_status: string;
  parent_id: string | null; evidence_ids: string[]; child_ids: string[];
  visualization?: { graph_type_id: string; nodes: GraphNode[]; edges: GraphEdge[] } };
type Detail = { project_id: string; revision: number; authority: { lifecycle: string };
  node: Knowledge; parent: Summary | null; breadcrumb: Summary[]; children: Summary[] };
type Evidence = { evidence_id: string; exact_text: string; language: string;
  extraction_method: string; extraction_confidence: number; location: { document_id: string;
    page_number: number; text_span: { start: number; end: number }; coordinates:
    { coordinate_status: "available" | "unavailable"; bounding_boxes: Array<{
      x: number; y: number; width: number; height: number }> } } };
type Overview = { project_id: string; revision: number; authority: { lifecycle: string; authority: string };
  root: Knowledge; children: Summary[] };

export function KnowledgeWorkspace({ overview }: { overview: Overview }) {
  const [mainMinimized, setMainMinimized] = useState(false);
  const [selected, setSelected] = useState<Detail>(); const [expanded, setExpanded] = useState<Summary[]>(overview.children);
  const [evidence, setEvidence] = useState<Evidence[]>([]); const [activeEvidence, setActiveEvidence] = useState<string>();
  const query = `project=${encodeURIComponent(overview.project_id)}&revision=${overview.revision}&lifecycle=${overview.authority.lifecycle}`;
  async function select(id: string) {
    const response = await fetch(`/api/atlas/v2/knowledge?${query}&knowledge=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error("Knowledge is unavailable");
    const detail = await response.json() as Detail; setSelected(detail);
    setExpanded((items) => [...new Map([...items, ...detail.children].map((item) => [item.knowledge_id, item])).values()]);
    const evidenceResponse = await fetch(`/api/atlas/v2/evidence?${query}&knowledge=${encodeURIComponent(id)}`);
    if (evidenceResponse.ok) { const result = await evidenceResponse.json() as { evidence: Evidence[] };
      setEvidence(result.evidence); setActiveEvidence(result.evidence[0]?.evidence_id); }
    else { setEvidence([]); setActiveEvidence(undefined); }
  }
  const active = evidence.find(({ evidence_id }) => evidence_id === activeEvidence);
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
        {!mainMinimized && <GraphView knowledge={overview.root} onSelect={(id) => void select(id)} />}
        {selected && <section className="supporting-graph"><p className="breadcrumb">
          {selected.breadcrumb.map(({ display_name }) => display_name).join(" / ")}</p>
          <div className="panel-heading"><div><p className="eyebrow">Selected knowledge</p>
            <h2>{selected.node.display_name}</h2></div><button onClick={() => setSelected(undefined)}>Close</button></div>
          {selected.node.visualization ? <GraphView knowledge={selected.node} onSelect={(id) => void select(id)} />
            : <div className="child-grid">{selected.children.map((child) => <button key={child.knowledge_id}
              onClick={() => void select(child.knowledge_id)}><strong>{child.display_name}</strong>
              <span>{child.kind}</span></button>)}</div>}
        </section>}
      </section><aside className="evidence-panel"><h2>PDF evidence</h2>
        {active ? <><div className="pdf-frame"><iframe title={`PDF page ${active.location.page_number}`}
          src={`/api/atlas/v2/document?${query}&document=${encodeURIComponent(active.location.document_id)}#page=${active.location.page_number}`} />
          {active.location.coordinates.coordinate_status === "available" && active.location.coordinates.bounding_boxes.map((box, index) =>
            <span key={index} className="pdf-highlight" style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`,
              width: `${box.width * 100}%`, height: `${box.height * 100}%` }} />)}</div>
          {active.location.coordinates.coordinate_status === "unavailable" && <p className="notice">Page is available; precise highlighting is unavailable for this evidence.</p>}</>
          : <p className="notice">Select knowledge to view its cited PDF evidence.</p>}
        <div className="evidence-cards">{evidence.map((item) => <button key={item.evidence_id}
          className={item.evidence_id === activeEvidence ? "active" : ""} onClick={() => setActiveEvidence(item.evidence_id)}>
          <strong>Page {item.location.page_number}</strong><blockquote>{item.exact_text}</blockquote>
          <small>{item.extraction_method} · confidence {item.extraction_confidence.toFixed(2)}</small></button>)}</div>
      </aside></div></main>;
}
function GraphView({ knowledge, onSelect }: { knowledge: Knowledge; onSelect: (id: string) => void }) {
  const graph = knowledge.visualization!;
  const nodes = useMemo<Node[]>(() => graph.nodes.map((item, index) => ({ id: item.graph_node_id,
    position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 150 }, data: { label: item.label },
    className: "atlas-node", style: { width: 210, minHeight: 72 } })), [graph]);
  const edges = useMemo<Edge[]>(() => graph.edges.map((item) => ({ id: item.graph_edge_id,
    source: item.from_graph_node_id, target: item.to_graph_node_id, label: item.display_label,
    markerEnd: { type: MarkerType.ArrowClosed }, className: "atlas-edge core" })), [graph]);
  const linked = new Map(graph.nodes.map((item) => [item.graph_node_id, item.knowledge_id]));
  return <><p className="graph-kind">{graph.graph_type_id}</p><div className="flow-canvas"><ReactFlow nodes={nodes}
    edges={edges} fitView minZoom={0.2} maxZoom={2} onNodeClick={(_event, node) => {
      const id = linked.get(node.id); if (id) onSelect(id); }}><Background /><Controls /></ReactFlow></div>
    <details className="graph-summary"><summary>Accessible graph summary</summary><ul>
      {graph.nodes.map((node) => <li key={node.graph_node_id}>{node.label}</li>)}
      {graph.edges.map((edge) => <li key={edge.graph_edge_id}>{edge.from_graph_node_id} {edge.display_label} {edge.to_graph_node_id}</li>)}</ul></details></>;
}
