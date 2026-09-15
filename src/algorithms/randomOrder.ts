import { shuffle } from "@/lib/random";
import { numberParam, type OrderingStrategy } from "./OrderingStrategy";

export const randomOrderStrategy: OrderingStrategy = {
  id: "random-order",
  name: "Random Order",
  version: "V1",
  kind: "baseline",
  description:
    "Shuffles the points with a deterministic seed. Random baseline: shows how much of a result comes from actual reasoning rather than luck.",
  parameterSpecs: [
    {
      key: "seed",
      label: "Seed",
      type: "number",
      min: 1,
      max: 999999,
      step: 1,
      defaultValue: 12345,
      help: "Same seed + same dataset always produces the same shuffle.",
    },
  ],
  order(points, depot, _costMatrix, parameters) {
    const seed = numberParam(parameters, "seed", 12345);
    const pool = depot ? points.filter((p) => p.id !== depot.id) : points;
    const ids = shuffle(pool, seed).map((p) => p.id);
    return {
      strategyId: this.id,
      strategyVersion: this.version,
      pointIds: depot ? [depot.id, ...ids] : ids,
    };
  },
};
