import type { Point, Route } from "@/domain/types";
import type { CostMatrix } from "@/services/cost/CostMatrix";
import type { OrderingStrategy } from "./OrderingStrategy";

/** Shared greedy construction, reused by 2-opt and experimental strategies. */
export function nearestNeighborOrder(
  points: Point[],
  depot: Point | null,
  costMatrix: CostMatrix,
): string[] {
  if (points.length === 0) return [];
  const startId = depot ? depot.id : points[0].id;
  const start = costMatrix.indexOf(startId);
  const indices = points.map((p) => costMatrix.indexOf(p.id));
  const visited = new Set<number>([start]);
  const order = [start];
  let current = start;

  while (visited.size < indices.length) {
    let best = -1;
    let bestCost = Infinity;
    for (const candidate of indices) {
      if (visited.has(candidate)) continue;
      const cost = costMatrix.at(current, candidate);
      if (cost < bestCost) {
        bestCost = cost;
        best = candidate;
      }
    }
    if (best === -1) break;
    visited.add(best);
    order.push(best);
    current = best;
  }

  return order.map((index) => costMatrix.idAt(index));
}

export const nearestNeighborStrategy: OrderingStrategy = {
  id: "nearest-neighbor",
  name: "Nearest Neighbor",
  version: "V1",
  kind: "baseline",
  description:
    "From the current point, always move to the closest unvisited point. Fast and locally sensible, but it strands remote points and pays for them later with one huge jump.",
  order(points, depot, costMatrix): Route {
    return {
      strategyId: this.id,
      strategyVersion: this.version,
      pointIds: nearestNeighborOrder(points, depot, costMatrix),
    };
  },
};
