import type { OrderingStrategy } from "./OrderingStrategy";

export const originalOrderStrategy: OrderingStrategy = {
  id: "original-order",
  name: "Original Order",
  version: "V1",
  kind: "baseline",
  description:
    "Visits the addresses exactly in the order supplied by the source list. Reference baseline: any strategy that cannot beat this is not useful.",
  order(points, depot) {
    const sorted = points.slice().sort((a, b) => a.originalIndex - b.originalIndex);
    const ids = sorted.map((p) => p.id);
    if (depot) {
      const rest = ids.filter((id) => id !== depot.id);
      return { strategyId: this.id, strategyVersion: this.version, pointIds: [depot.id, ...rest] };
    }
    return { strategyId: this.id, strategyVersion: this.version, pointIds: ids };
  },
};
