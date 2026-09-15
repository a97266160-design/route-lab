import type { CostMatrix } from "@/services/cost/CostMatrix";
import { nearestNeighborOrder } from "./nearestNeighbor";
import { numberParam, type OrderingStrategy } from "./OrderingStrategy";

/** Classic 2-opt improvement on an open path (start point is pinned). */
export function twoOptImprove(
  pointIds: string[],
  costMatrix: CostMatrix,
  maxPasses: number,
): string[] {
  const order = pointIds.map((id) => costMatrix.indexOf(id));
  const n = order.length;
  if (n < 4) return pointIds.slice();

  let improved = true;
  let passes = 0;
  while (improved && passes < maxPasses) {
    improved = false;
    passes += 1;
    for (let i = 1; i < n - 1; i += 1) {
      const a = order[i - 1];
      const b = order[i];
      for (let k = i + 1; k < n; k += 1) {
        const c = order[k];
        const d = k + 1 < n ? order[k + 1] : -1;
        const before = costMatrix.at(a, b) + (d === -1 ? 0 : costMatrix.at(c, d));
        const after = costMatrix.at(a, c) + (d === -1 ? 0 : costMatrix.at(b, d));
        if (after + 1e-12 < before) {
          let lo = i;
          let hi = k;
          while (lo < hi) {
            const tmp = order[lo];
            order[lo] = order[hi];
            order[hi] = tmp;
            lo += 1;
            hi -= 1;
          }
          improved = true;
        }
      }
    }
  }

  return order.map((index) => costMatrix.idAt(index));
}

export const twoOptStrategy: OrderingStrategy = {
  id: "nn-2opt",
  name: "NN + 2-opt",
  version: "V1",
  kind: "baseline",
  description:
    "Builds a Nearest Neighbor route, then repeatedly reverses route segments whenever doing so shortens the total path. Strong baseline: it removes most self-crossings.",
  formula: "swap if cost(a,c) + cost(b,d) < cost(a,b) + cost(c,d)",
  parameterSpecs: [
    {
      key: "maxPasses",
      label: "Max Passes",
      type: "number",
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 12,
      help: "Upper bound on full improvement sweeps. Higher = better route, slower runtime.",
    },
  ],
  order(points, depot, costMatrix, parameters) {
    const maxPasses = numberParam(parameters, "maxPasses", 12);
    const seedRoute = nearestNeighborOrder(points, depot, costMatrix);
    return {
      strategyId: this.id,
      strategyVersion: this.version,
      pointIds: twoOptImprove(seedRoute, costMatrix, maxPasses),
    };
  },
};
