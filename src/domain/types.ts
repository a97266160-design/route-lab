/**
 * Core domain models for Route Ordering Lab.
 * These types are intentionally free of React / UI concerns.
 */

export type PointCoordinate = {
  x: number;
  y: number;
};

export type Point = {
  id: string;
  address: string;
  city: string;
  postalCode?: string;
  street?: string;
  tags: string[];
  latitude?: number;
  longitude?: number;
  originalIndex: number;
  /** Projected 2D coordinate used by the cost model + visualization. */
  coordinate: PointCoordinate;
  /** Optional cluster label produced by dataset generation. */
  cluster?: string;
};

export type DatasetKind = "real" | "synthetic";

export type Dataset = {
  id: string;
  name: string;
  version: string;
  kind: DatasetKind;
  description?: string;
  seed?: number;
  points: Point[];
  /** Depot may be null: pure ordering datasets do not require one. */
  depotId: string | null;
  generator?: {
    type: string;
    pointCount: number;
    clusterCount: number;
    spread: number;
  };
};

export type Route = {
  strategyId: string;
  strategyVersion: string;
  pointIds: string[];
};

export type RouteTransition = {
  fromId: string;
  toId: string;
  fromIndex: number;
  cost: number;
};

export type RouteValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type RouteEvaluation = {
  validation: RouteValidation;
  totalCost: number;
  totalDistance: number;
  averageEdge: number;
  longestEdge: number;
  visitedCount: number;
  uniqueVisitedCount: number;
  expectedCount: number;
  runtimeMs: number;
  longestTransitions: RouteTransition[];
  crossings: number;
};

export type StrategyParameters = Record<string, number | string | boolean>;

export type Experiment = {
  id: string;
  label: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: string;
  datasetSeed?: number;
  strategyId: string;
  strategyName: string;
  strategyVersion: string;
  parameters: StrategyParameters;
  seed: number;
  route: Route;
  evaluation: RouteEvaluation;
  createdAt: string;
  notes?: string;
  demo?: boolean;
  baseline?: boolean;
};

export type HypothesisStatus = "Idea" | "Testing" | "Confirmed" | "Rejected";

export type Hypothesis = {
  id: string;
  title: string;
  observation: string;
  expectedResult: string;
  status: HypothesisStatus;
  experimentIds: string[];
  createdAt: string;
  demo?: boolean;
};
