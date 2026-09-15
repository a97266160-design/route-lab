import { numberParam, type OrderingStrategy } from "./OrderingStrategy";

/**
 * EXPERIMENTAL V1 — look-ahead greedy.
 *
 * For each of the nearest `candidateLimit` unvisited points we score
 *   score = cost(current, candidate) + lambda * mean(cheapest `lookAhead` onward moves)
 * and take the lowest score. The idea: avoid stepping into a dead end.
 *
 * Replace this file (not the app) to create Experimental V2, V3, ...
 */
export const experimentalV1Strategy: OrderingStrategy = {
  id: "experimental-v1",
  name: "Experimental V1",
  version: "V1",
  kind: "experimental",
  description:
    "Greedy with regret: instead of only asking 'which point is closest?', it also asks 'and how cheap is my best move after that?'. Lambda controls how much the future matters.",
  formula: "score = cost(current → candidate) + lambda · mean(lookAhead cheapest onward moves)",
  parameterSpecs: [
    {
      key: "lookAhead",
      label: "Look Ahead",
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      defaultValue: 2,
      help: "How many onward moves are averaged into the candidate score.",
    },
    {
      key: "lambda",
      label: "Lambda",
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 0.35,
      help: "Weight of the look-ahead term. 0 = plain Nearest Neighbor.",
    },
    {
      key: "candidateLimit",
      label: "Candidate Limit",
      type: "number",
      min: 2,
      max: 40,
      step: 1,
      defaultValue: 10,
      help: "Only the N nearest unvisited points are scored, which keeps runtime manageable.",
    },
  ],
  order(points, depot, costMatrix, parameters) {
    const lookAhead = Math.max(1, Math.round(numberParam(parameters, "lookAhead", 2)));
    const lambda = numberParam(parameters, "lambda", 0.35);
    const candidateLimit = Math.max(2, Math.round(numberParam(parameters, "candidateLimit", 10)));

    if (points.length === 0) {
      return { strategyId: this.id, strategyVersion: this.version, pointIds: [] };
    }

    const startId = depot ? depot.id : points[0].id;
    const start = costMatrix.indexOf(startId);
    const all = points.map((p) => costMatrix.indexOf(p.id));
    const unvisited = new Set(all);
    unvisited.delete(start);
    const order = [start];
    let current = start;

    const scratch: Array<{ index: number; cost: number }> = [];

    while (unvisited.size > 0) {
      scratch.length = 0;
      for (const candidate of unvisited) {
        scratch.push({ index: candidate, cost: costMatrix.at(current, candidate) });
      }
      scratch.sort((a, b) => a.cost - b.cost);
      const candidates = scratch.slice(0, Math.min(candidateLimit, scratch.length));

      let bestIndex = candidates[0].index;
      let bestScore = Infinity;

      for (const candidate of candidates) {
        const onward: number[] = [];
        for (const other of unvisited) {
          if (other === candidate.index) continue;
          onward.push(costMatrix.at(candidate.index, other));
        }
        onward.sort((a, b) => a - b);
        const window = onward.slice(0, Math.min(lookAhead, onward.length));
        const futureCost = window.length
          ? window.reduce((sum, value) => sum + value, 0) / window.length
          : 0;
        const score = candidate.cost + lambda * futureCost;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = candidate.index;
        }
      }

      unvisited.delete(bestIndex);
      order.push(bestIndex);
      current = bestIndex;
    }

    return {
      strategyId: this.id,
      strategyVersion: this.version,
      pointIds: order.map((index) => costMatrix.idAt(index)),
    };
  },
};
