import type { Dataset, Route, RouteValidation } from "@/domain/types";

/**
 * Routes are validated separately from evaluation so an invalid ordering can
 * never be silently recorded as a successful experiment.
 */
export function validateRoute(route: Route, dataset: Dataset): RouteValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const known = new Set(dataset.points.map((p) => p.id));

  if (route.pointIds.length === 0) {
    errors.push("Route is empty — the strategy returned no points.");
    return { valid: false, errors, warnings };
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of route.pointIds) {
    if (!known.has(id)) errors.push(`Route contains unknown point id "${id}".`);
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  if (duplicates.size > 0) {
    errors.push(
      `Route visits ${duplicates.size} point(s) more than once (e.g. ${[...duplicates].slice(0, 3).join(", ")}).`,
    );
  }

  const missing = dataset.points.filter((p) => !seen.has(p.id));
  if (missing.length > 0) {
    errors.push(
      `Route is missing ${missing.length} point(s) (e.g. ${missing
        .slice(0, 3)
        .map((p) => p.id)
        .join(", ")}).`,
    );
  }

  if (route.pointIds.length !== dataset.points.length) {
    errors.push(
      `Expected ${dataset.points.length} stops, route has ${route.pointIds.length}.`,
    );
  }

  if (dataset.depotId) {
    if (!known.has(dataset.depotId)) {
      errors.push("Dataset depot does not exist in the point list.");
    } else if (route.pointIds[0] !== dataset.depotId) {
      errors.push("Route does not start at the configured depot.");
    }
  }

  if (dataset.points.length > 0 && dataset.points.length !== new Set(dataset.points.map((p) => p.id)).size) {
    errors.push("Dataset contains duplicate point IDs.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
