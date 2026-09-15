import type { Point } from "@/domain/types";
import type { CostProvider } from "./CostProvider";

/**
 * Dense cost matrix, built once per dataset + cost provider.
 * Algorithms index by point id or by internal numeric index (faster).
 */
export class CostMatrix {
  readonly size: number;
  readonly providerId: string;
  private readonly indexById: Map<string, number>;
  private readonly ids: string[];
  private readonly values: Float64Array;

  constructor(points: Point[], provider: CostProvider) {
    this.size = points.length;
    this.providerId = provider.id;
    this.ids = points.map((p) => p.id);
    this.indexById = new Map(this.ids.map((id, i) => [id, i]));
    this.values = new Float64Array(this.size * this.size);
    for (let i = 0; i < this.size; i += 1) {
      for (let j = i + 1; j < this.size; j += 1) {
        const cost = provider.getCost(points[i], points[j]);
        this.values[i * this.size + j] = cost;
        this.values[j * this.size + i] = cost;
      }
    }
  }

  indexOf(id: string): number {
    const index = this.indexById.get(id);
    if (index === undefined) throw new Error(`Unknown point id in cost matrix: ${id}`);
    return index;
  }

  idAt(index: number): string {
    return this.ids[index];
  }

  /** cost[fromIndex][toIndex] */
  at(fromIndex: number, toIndex: number): number {
    return this.values[fromIndex * this.size + toIndex];
  }

  cost(fromId: string, toId: string): number {
    return this.at(this.indexOf(fromId), this.indexOf(toId));
  }
}

export function buildCostMatrix(points: Point[], provider: CostProvider): CostMatrix {
  return new CostMatrix(points, provider);
}
