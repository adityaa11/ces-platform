export interface LayoutEdge { readonly source: string; readonly target: string }
export interface GraphPosition { readonly x: number; readonly y: number }

export function layeredGraphLayout(nodeIds: readonly string[], edges: readonly LayoutEdge[]):
ReadonlyMap<string, GraphPosition> {
  const order = new Map(nodeIds.map((id, index) => [id, index]));
  const ranks = new Map(nodeIds.map((id) => [id, 0]));
  const forward = edges.filter(({ source, target }) => source !== target
    && order.has(source) && order.has(target)
    && order.get(source)! < order.get(target)!);
  for (let pass = 0; pass < nodeIds.length; pass += 1) {
    let changed = false;
    for (const { source, target } of forward) {
      const next = Math.min(nodeIds.length - 1, ranks.get(source)! + 1);
      if (next > ranks.get(target)!) { ranks.set(target, next); changed = true; }
    }
    if (!changed) break;
  }
  const columns = new Map<number, string[]>();
  for (const id of nodeIds) {
    const rank = ranks.get(id)!; const column = columns.get(rank) ?? [];
    column.push(id); columns.set(rank, column);
  }
  const largestColumn = Math.max(1, ...[...columns.values()].map(({ length }) => length));
  const positions = new Map<string, GraphPosition>();
  for (const [rank, ids] of [...columns.entries()].sort(([left], [right]) => left - right)) {
    const top = ((largestColumn - ids.length) * 148) / 2;
    ids.forEach((id, index) => positions.set(id, { x: rank * 300, y: top + index * 148 }));
  }
  return positions;
}
