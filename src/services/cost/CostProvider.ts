import type { Point } from "@/domain/types";

/**
 * Cost abstraction. Nothing outside this folder may compute distances directly,
 * so road distance / travel time providers can be added later.
 */
export interface CostProvider {
  id: string;
  name: string;
  unit: string;
  getCost(from: Point, to: Point): number;
}

export const EuclideanCostProvider: CostProvider = {
  id: "euclidean",
  name: "Euclidean",
  unit: "km",
  getCost(from, to) {
    const dx = from.coordinate.x - to.coordinate.x;
    const dy = from.coordinate.y - to.coordinate.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
};
