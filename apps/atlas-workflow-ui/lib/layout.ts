import ELK from "elkjs/lib/elk.bundled.js";
import type { ModelReviewWorkspace } from "@company/ces-atlas-model-review-contracts";

const elk = new ELK();

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
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES" },
    children: nodes.map(({ node }) => ({ id: node.projection_node_id, width: 220, height: 88 })),
    edges: edges.map((edge) => ({ id: edge.projection_edge_id,
      sources: [edge.from_projection_node_id], targets: [edge.to_projection_node_id] })),
  });
  return Object.fromEntries((layout.children ?? []).map((node) =>
    [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}
