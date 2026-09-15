import type { Point, Route } from "@/domain/types";
import type { CostMatrix } from "@/services/cost/CostMatrix";

export type ParameterSpec = {
  key: string;
  label: string;
  type: "number";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  help: string;
};

/**
 * THE architectural boundary of the lab.
 * A new ordering idea = one new module implementing this interface.
 */
export interface OrderingStrategy {
  id: string;
  name: string;
  version: string;
  description: string;
  kind: "baseline" | "experimental";
  formula?: string;
  parameterSpecs?: ParameterSpec[];
  order(
    points: Point[],
    depot: Point | null,
    costMatrix: CostMatrix,
    parameters?: Record<string, unknown>,
  ): Route;
}

export function numberParam(
  parameters: Record<string, unknown> | undefined,
  key: string,
  fallback: number,
): number {
  const raw = parameters?.[key];
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function defaultParameters(strategy: OrderingStrategy): Record<string, number> {
  const result: Record<string, number> = {};
  for (const spec of strategy.parameterSpecs ?? []) result[spec.key] = spec.defaultValue;
  return result;
}
