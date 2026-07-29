"use client";

import {
  AlertTriangle, ArrowLeftRight, Check, ChevronDown, CircleDot, FileText,
  GitBranch, GitPullRequestArrow, Layers3, Maximize2, Network, PanelRight,
  Search, ShieldCheck, Sparkles, Workflow, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";

type Operation = {
  operation_id: string;
  label: string;
  operation_kind: string;
  semantic_record_ids: string[];
};
type Edge = {
  edge_id: string;
  from_operation_id: string;
  to_operation_id: string;
  edge_kind: string;
};
type WorkflowDetail = { workflow_id: string; operations: Operation[]; edges: Edge[] };
type Overview = {
  workflows: Array<{
    workflow_id: string;
    label: string;
    summary: string;
    operation_count: number;
    review_status: string;
  }>;
};
type Relationship = {
  review_subject_id: string;
  subject_type: string;
  from_id: string;
  to_id: string;
  relationship_kind: string;
  origin: string;
  rationale: string;
  confidence: number;
  blockers: string[];
  evidence_source_unit_ids: string[];
};

const shortId = (value: string) => value.split(".").at(-1) ?? value;
const labelForKind = (kind: string) => kind.replaceAll("_", " ");

export function AtlasReview(props: {
  overview: Overview;
  workflows: WorkflowDetail[];
  relationships: Relationship[];
  assignmentDiagnostics: Record<string, unknown>;
  targetDiagnostics: Record<string, unknown>;
}) {
  const [activeWorkflow, setActiveWorkflow] = useState(props.workflows[0]?.workflow_id ?? "");
  const [tab, setTab] = useState<"map" | "relationships" | "diagnostics">("map");
  const [selected, setSelected] = useState<Operation | null>(null);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);

  const detail = props.workflows.find(({ workflow_id }) => workflow_id === activeWorkflow);
  const meta = props.overview.workflows.find(({ workflow_id }) => workflow_id === activeWorkflow);
  const filteredOperations = useMemo(() => {
    if (!detail) return [];
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? detail.operations.filter(({ label }) => label.toLocaleLowerCase().includes(normalized))
      : detail.operations;
  }, [detail, query]);
  const totalOperations = props.workflows.reduce((sum, item) => sum + item.operations.length, 0);
  const totalEdges = props.workflows.reduce((sum, item) => sum + item.edges.length, 0);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><span>CES Atlas</span></div>
        <nav>
          <button className={tab === "map" ? "nav-item active" : "nav-item"} onClick={() => setTab("map")}>
            <Network size={18} /> Workflow map
          </button>
          <button className={tab === "relationships" ? "nav-item active" : "nav-item"} onClick={() => setTab("relationships")}>
            <ArrowLeftRight size={18} /> Relationship review
            <em>{props.relationships.length}</em>
          </button>
          <button className={tab === "diagnostics" ? "nav-item active" : "nav-item"} onClick={() => setTab("diagnostics")}>
            <ShieldCheck size={18} /> Diagnostics
          </button>
        </nav>
        <div className="side-section">
          <div className="side-heading"><span>Workflows</span><small>{props.workflows.length}</small></div>
          <div className="workflow-list">
            {props.overview.workflows.map((workflow, index) => (
              <button
                key={workflow.workflow_id}
                className={workflow.workflow_id === activeWorkflow ? "workflow-link selected" : "workflow-link"}
                onClick={() => { setActiveWorkflow(workflow.workflow_id); setTab("map"); setSelected(null); }}
              >
                <span className="workflow-index">{String(index + 1).padStart(2, "0")}</span>
                <span><b>{workflow.label}</b><small>{workflow.operation_count} operations</small></span>
              </button>
            ))}
          </div>
        </div>
        <div className="authority-card">
          <span className="status-dot" />
          <div><b>Review in progress</b><small>Non-authoritative proposal</small></div>
        </div>
      </aside>

      <section className="workspace">
        <header>
          <div>
            <div className="eyebrow">Safara Buyer / Atlas proposal</div>
            <h1>{tab === "map" ? "Workflow review" : tab === "relationships" ? "Relationship review" : "Qualification diagnostics"}</h1>
          </div>
          <div className="header-actions">
            <label className="search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search operations" /></label>
            <button className="ghost"><FileText size={17} /> Sources</button>
            <button className="primary"><Check size={17} /> Review proposal</button>
          </div>
        </header>

        <div className="summary-strip">
          <Metric icon={<Workflow />} label="Workflow areas" value={props.workflows.length} />
          <Metric icon={<Layers3 />} label="Operations" value={totalOperations} />
          <Metric icon={<GitPullRequestArrow />} label="Proposed edges" value={totalEdges} />
          <Metric icon={<AlertTriangle />} label="Needs review" value={props.relationships.length + totalEdges} accent />
        </div>

        {tab === "map" && detail && (
          <div className="content-grid">
            <section className="canvas-card">
              <div className="canvas-head">
                <div>
                  <span className="pill">Workflow {shortId(detail.workflow_id).slice(0, 6)}</span>
                  <h2>{meta?.label ?? detail.workflow_id}</h2>
                  <p>{detail.operations.length} operations · {detail.edges.length} proposed connections</p>
                </div>
                <div className="canvas-tools">
                  <button onClick={() => setZoom((value) => Math.max(.7, value - .1))}><ZoomOut size={17} /></button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((value) => Math.min(1.3, value + .1))}><ZoomIn size={17} /></button>
                  <button onClick={() => setZoom(1)}><Maximize2 size={17} /></button>
                </div>
              </div>
              <div className="graph-viewport">
                <div className="graph" style={{ transform: `scale(${zoom})` }}>
                  {filteredOperations.map((operation, index) => {
                    const outgoing = detail.edges.filter(({ from_operation_id }) => from_operation_id === operation.operation_id);
                    return (
                      <div className="graph-step" key={operation.operation_id}>
                        <button className={`graph-node ${operation.operation_kind}`} onClick={() => setSelected(operation)}>
                          <span className="node-icon">{operation.operation_kind === "state" ? <CircleDot size={17} /> : operation.operation_kind === "decision" ? <GitBranch size={17} /> : <Workflow size={17} />}</span>
                          <span><small>{labelForKind(operation.operation_kind)}</small><b>{operation.label}</b></span>
                          <PanelRight size={15} className="open-icon" />
                        </button>
                        {index < filteredOperations.length - 1 && outgoing.length > 0 && (
                          <div className="edge-line"><span>{labelForKind(outgoing[0]?.edge_kind ?? "proposed")}</span><i /></div>
                        )}
                      </div>
                    );
                  })}
                  {filteredOperations.length === 0 && <div className="empty">No operations match your search.</div>}
                </div>
              </div>
              <div className="legend">
                <span><i className="legend-action" /> Operation</span>
                <span><i className="legend-state" /> State</span>
                <span><i className="legend-edge" /> Derived edge · review required</span>
              </div>
            </section>
            <aside className="review-panel">
              <div className="panel-title"><div><span className="eyebrow">Review context</span><h3>{selected ? "Operation detail" : "Workflow quality"}</h3></div>{selected && <button onClick={() => setSelected(null)}><X size={17} /></button>}</div>
              {selected ? <OperationDetail operation={selected} edges={detail.edges} /> : <WorkflowQuality detail={detail} />}
            </aside>
          </div>
        )}

        {tab === "relationships" && <RelationshipTable relationships={props.relationships} />}
        {tab === "diagnostics" && <Diagnostics assignments={props.assignmentDiagnostics} targets={props.targetDiagnostics} workflows={props.workflows} />}
      </section>
    </main>
  );
}

function Metric({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return <div className={accent ? "metric accent" : "metric"}><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>;
}

function WorkflowQuality({ detail }: { detail: WorkflowDetail }) {
  const warnings = [
    ...(detail.operations.length < 2 ? ["This workflow has fewer than two operations."] : []),
    ...(detail.edges.length === 0 ? ["No connected topology was generated."] : []),
    ...(detail.operations.every(({ operation_kind }) => operation_kind !== "decision") ? ["No decision or branch is represented."] : []),
  ];
  return <div className="panel-body">
    <div className="quality-score"><span>{warnings.length === 0 ? "Ready to review" : `${warnings.length} quality flags`}</span><b>{detail.operations.length}/{Math.max(detail.operations.length, 2)}</b></div>
    <div className="quality-list">
      {warnings.map((warning) => <div className="quality-item warning" key={warning}><AlertTriangle size={16} /><span>{warning}</span></div>)}
      <div className="quality-item"><Check size={16} /><span>All operations retain canonical record identity.</span></div>
      <div className="quality-item"><Check size={16} /><span>Proposed edges remain non-authoritative.</span></div>
    </div>
    <div className="callout"><Sparkles size={16} /><p>This view deliberately exposes incorrect grouping before approval. Atlas must not turn a readable diagram into semantic truth.</p></div>
  </div>;
}

function OperationDetail({ operation, edges }: { operation: Operation; edges: Edge[] }) {
  return <div className="panel-body">
    <span className="type-badge">{operation.operation_kind}</span>
    <h4>{operation.label}</h4>
    <dl>
      <dt>Operation ID</dt><dd>{operation.operation_id}</dd>
      <dt>Canonical records</dt>{operation.semantic_record_ids.map((id) => <dd key={id}>{id}</dd>)}
      <dt>Connections</dt><dd>{edges.filter((edge) => edge.from_operation_id === operation.operation_id || edge.to_operation_id === operation.operation_id).length}</dd>
    </dl>
    <button className="wide-button"><FileText size={16} /> Inspect source evidence</button>
  </div>;
}

function RelationshipTable({ relationships }: { relationships: Relationship[] }) {
  return <section className="table-card">
    <div className="table-head"><div><h2>Pending relationship candidates</h2><p>Derived edges are visible here but excluded from approved topology until reviewed.</p></div><span className="pending-chip">{relationships.length} pending</span></div>
    <div className="relationship-list">
      {relationships.map((relationship) => <article key={relationship.review_subject_id}>
        <div className="relation-kind"><ArrowLeftRight size={16} /><span>{labelForKind(relationship.relationship_kind)}</span></div>
        <div className="relation-main"><b>{shortId(relationship.from_id)}</b><span>→</span><b>{shortId(relationship.to_id)}</b><p>{relationship.rationale}</p></div>
        <div className="confidence"><span>{Math.round(relationship.confidence * 100)}%</span><small>{relationship.origin}</small></div>
        <div className="row-actions"><button aria-label="Reject"><X size={16} /></button><button aria-label="Approve"><Check size={16} /></button></div>
      </article>)}
    </div>
  </section>;
}

function Diagnostics({ assignments, targets, workflows }: { assignments: Record<string, unknown>; targets: Record<string, unknown>; workflows: WorkflowDetail[] }) {
  const rows = [...Object.entries(assignments), ...Object.entries(targets)].filter(([, value]) => typeof value !== "object");
  return <div className="diagnostics-grid">
    <section className="diagnostic-card"><span className="eyebrow">Generated evidence</span><h2>Pipeline counters</h2>{rows.map(([key, value]) => <div className="diagnostic-row" key={key}><span>{labelForKind(key)}</span><b>{String(value)}</b></div>)}</section>
    <section className="diagnostic-card"><span className="eyebrow">Qualification</span><h2>Workflow checks</h2>{workflows.map((workflow) => <div className="diagnostic-row" key={workflow.workflow_id}><span>{shortId(workflow.workflow_id)}</span><b className={workflow.edges.length ? "good" : "bad"}>{workflow.operations.length} ops / {workflow.edges.length} edges</b></div>)}</section>
  </div>;
}
