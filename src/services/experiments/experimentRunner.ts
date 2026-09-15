import { getStrategy } from "@/algorithms/registry";
import type { Dataset, Experiment, StrategyParameters } from "@/domain/types";
import { buildCostMatrix, CostMatrix } from "@/services/cost/CostMatrix";
import { EuclideanCostProvider } from "@/services/cost/CostProvider";
import { evaluateRoute } from "@/services/evaluation/routeEvaluator";

const matrixCache = new Map<string, CostMatrix>();

/** Cost matrix is built once per dataset + version + provider, then reused. */
export function getCostMatrix(dataset: Dataset): CostMatrix {
  const key = `${dataset.id}@${dataset.version}#${dataset.points.length}:${EuclideanCostProvider.id}`;
  const cached = matrixCache.get(key);
  if (cached) return cached;
  const matrix = buildCostMatrix(dataset.points, EuclideanCostProvider);
  matrixCache.set(key, matrix);
  return matrix;
}

export type RunRequest = {
  dataset: Dataset;
  strategyId: string;
  parameters: StrategyParameters;
  seed: number;
  notes?: string;
  label?: string;
};

export function runExperiment(request: RunRequest): Experiment {
  const { dataset, strategyId, parameters, seed } = request;
  if (dataset.points.length === 0) {
    throw new Error("Dataset is empty — generate or load points before running a strategy.");
  }
  const strategy = getStrategy(strategyId);
  const costMatrix = getCostMatrix(dataset);
  const depot = dataset.depotId
    ? dataset.points.find((p) => p.id === dataset.depotId) ?? null
    : null;
  if (dataset.depotId && !depot) {
    throw new Error("Configured depot is missing from the dataset points.");
  }

  const effectiveParameters: StrategyParameters = { ...parameters };
  if (strategy.parameterSpecs?.some((spec) => spec.key === "seed")) {
    effectiveParameters.seed = seed;
  }

  const started = performance.now();
  const route = strategy.order(dataset.points, depot, costMatrix, effectiveParameters);
  const runtimeMs = performance.now() - started;

  const evaluation = evaluateRoute(route, dataset, costMatrix, runtimeMs);

  return {
    id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    label: request.label ?? `${strategy.name} · ${dataset.name}`,
    datasetId: dataset.id,
    datasetName: dataset.name,
    datasetVersion: dataset.version,
    datasetSeed: dataset.seed,
    strategyId: strategy.id,
    strategyName: strategy.name,
    strategyVersion: strategy.version,
    parameters: effectiveParameters,
    seed,
    route,
    evaluation,
    createdAt: new Date().toISOString(),
    notes: request.notes,
  };
}
