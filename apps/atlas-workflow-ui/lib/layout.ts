import ELK from "elkjs/lib/elk.bundled.js";
import type { ModelReviewDetail, ModelReviewWorkspace } from "@company/ces-atlas-model-review-contracts";

const elk = new ELK();

export function overviewNodeDimensions(label: string): { width: number; height: number } {
  return { width: 240, height: Math.min(190, 76 + Math.ceil(label.length / 30) * 18) };
}

export async function layoutDetail(detail: ModelReviewDetail): Promise<Readonly<Record<string, {
  x: number; y: number;
}>>> {
  const layout = await elk.layout({ id: "atlas-detail",
    layoutOptions: { "elk.algorithm": "layered", "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL", "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "95" },
    children: detail.graph.nodes.map((node) => ({ id: node.projection_node_id,
      ...overviewNodeDimensions(node.label) })),
    edges: detail.graph.edges.map((edge) => ({ id: edge.projection_edge_id,
      sources: [edge.from_projection_node_id], targets: [edge.to_projection_node_id] })),
  });
  return Object.fromEntries((layout.children ?? []).map((node) =>
    [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}

export async function layoutOverview(workspace: ModelReviewWorkspace): Promise<Readonly<Record<string, {
  x: number; y: number;
}>>> {
  const nodeOrder = new Map(workspace.overview.layout.node_order.map((id, index) => [id, index]));
  const nodes = [...workspace.overview.nodes].sort((left, right) =>
    (nodeOrder.get(left.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER)
      - (nodeOrder.get(right.node.projection_node_id) ?? Number.MAX_SAFE_INTEGER));
  const edgeOrder = new Map(workspace.overview.layout.edge_order.map((id, index) => [id, index]));
  const edges = [...workspace.overview.edges].sort((left, right) =>
    (edgeOrder.get(left.projection_edge_id) ?? Number.MAX_SAFE_INTEGER)
      - (edgeOrder.get(right.projection_edge_id) ?? Number.MAX_SAFE_INTEGER));
  const layout = await elk.layout({ id: "atlas-overview",
    layoutOptions: { "elk.algorithm": "layered", "elk.direction": workspace.overview.layout.direction,
      "elk.edgeRouting": "ORTHOGONAL", "elk.spacing.nodeNode": "72",
      "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      "elk.spacing.edgeNode": "34", "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES" },
    children: nodes.map(({ node }) => ({ id: node.projection_node_id,
      ...overviewNodeDimensions(node.label) })),
    edges: edges.map((edge) => ({ id: edge.projection_edge_id,
      sources: [edge.from_projection_node_id], targets: [edge.to_projection_node_id] })),
  });
  return Object.fromEntries((layout.children ?? []).map((node) =>
    [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}
