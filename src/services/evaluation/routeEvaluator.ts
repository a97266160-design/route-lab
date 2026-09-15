import type { Dataset, Route, RouteEvaluation, RouteTransition } from "@/domain/types";
import type { CostMatrix } from "@/services/cost/CostMatrix";
import { validateRoute } from "@/services/validation/routeValidator";

function segmentsCross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const orient = (p: typeof a, q: typeof a, r: typeof a) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}

/** Counts crossing route segments (capped so huge routes stay responsive). */
export function countCrossings(route: Route, dataset: Dataset, limit = 400): number {
  const byId = new Map(dataset.points.map((p) => [p.id, p]));
  const coords = route.pointIds
    .map((id) => byId.get(id)?.coordinate)
    .filter((c): c is { x: number; y: number } => Boolean(c));
  if (coords.length > limit) return -1;
  let crossings = 0;
  for (let i = 0; i + 1 < coords.length; i += 1) {
    for (let j = i + 2; j + 1 < coords.length; j += 1) {
      if (segmentsCross(coords[i], coords[i + 1], coords[j], coords[j + 1])) crossings += 1;
    }
  }
  return crossings;
}

export function evaluateRoute(
  route: Route,
  dataset: Dataset,
  costMatrix: CostMatrix,
  runtimeMs: number,
): RouteEvaluation {
  const validation = validateRoute(route, dataset);
  const transitions: RouteTransition[] = [];
  let totalCost = 0;

  for (let i = 0; i + 1 < route.pointIds.length; i += 1) {
    const fromId = route.pointIds[i];
    const toId = route.pointIds[i + 1];
    let cost = 0;
    try {
      cost = costMatrix.cost(fromId, toId);
    } catch {
      cost = 0;
    }
    totalCost += cost;
    transitions.push({ fromId, toId, fromIndex: i, cost });
  }

  const edgeCount = transitions.length;
  const longestTransitions = transitions
    .slice()
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return {
    validation,
    totalCost,
    totalDistance: totalCost,
    averageEdge: edgeCount ? totalCost / edgeCount : 0,
    longestEdge: longestTransitions[0]?.cost ?? 0,
    visitedCount: route.pointIds.length,
    uniqueVisitedCount: new Set(route.pointIds).size,
    expectedCount: dataset.points.length,
    runtimeMs,
    longestTransitions,
    crossings: countCrossings(route, dataset),
  };
}
