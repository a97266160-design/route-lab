import { experimentalV1Strategy } from "./experimentalV1";
import { nearestNeighborStrategy } from "./nearestNeighbor";
import { originalOrderStrategy } from "./originalOrder";
import type { OrderingStrategy } from "./OrderingStrategy";
import { randomOrderStrategy } from "./randomOrder";
import { twoOptStrategy } from "./twoOpt";

/** Add a new strategy module here — nothing else in the app needs to change. */
export const strategies: OrderingStrategy[] = [
  originalOrderStrategy,
  randomOrderStrategy,
  nearestNeighborStrategy,
  twoOptStrategy,
  experimentalV1Strategy,
];

export const BASELINE_STRATEGY_ID = "original-order";

export function getStrategy(id: string): OrderingStrategy {
  const strategy = strategies.find((s) => s.id === id);
  if (!strategy) throw new Error(`Unsupported strategy: ${id}`);
  return strategy;
}

export function findStrategy(id: string): OrderingStrategy | undefined {
  return strategies.find((s) => s.id === id);
}
