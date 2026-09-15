import type { Dataset, Point } from "@/domain/types";
import { createRandom } from "@/lib/random";

export const GENERATOR_TYPES = [
  "Random",
  "Grid",
  "Clustered",
  "Multiple Clusters",
  "Corridor",
  "Circle",
  "Outliers",
] as const;

export type GeneratorType = (typeof GENERATOR_TYPES)[number];

export type GeneratorConfig = {
  name: string;
  type: GeneratorType;
  pointCount: number;
  clusterCount: number;
  seed: number;
  spread: number;
  withDepot: boolean;
};

export const defaultGeneratorConfig: GeneratorConfig = {
  name: "Synthetic-200",
  type: "Multiple Clusters",
  pointCount: 200,
  clusterCount: 5,
  seed: 12345,
  spread: 100,
  withDepot: true,
};

/** Deterministic synthetic datasets: used to check whether an idea generalizes. */
export function generateDataset(config: GeneratorConfig): Dataset {
  const { type, pointCount, clusterCount, seed, spread } = config;
  if (pointCount < 2) throw new Error("A dataset needs at least 2 points.");
  if (pointCount > 2000) throw new Error("Keep synthetic datasets at 2000 points or fewer.");
  if (clusterCount < 1) throw new Error("Cluster count must be at least 1.");

  const random = createRandom(seed);
  const points: Point[] = [];
  const centers = Array.from({ length: clusterCount }, () => ({
    x: random() * spread,
    y: random() * spread,
  }));
  const gridSide = Math.ceil(Math.sqrt(pointCount));

  for (let i = 0; i < pointCount; i += 1) {
    let x = 0;
    let y = 0;
    let cluster: string | undefined;

    switch (type) {
      case "Random":
        x = random() * spread;
        y = random() * spread;
        break;
      case "Grid":
        x = ((i % gridSide) / (gridSide - 1 || 1)) * spread;
        y = (Math.floor(i / gridSide) / (gridSide - 1 || 1)) * spread;
        break;
      case "Clustered": {
        const center = centers[0];
        x = center.x + (random() - 0.5) * spread * 0.25;
        y = center.y + (random() - 0.5) * spread * 0.25;
        cluster = "C1";
        break;
      }
      case "Multiple Clusters": {
        const index = i % clusterCount;
        const center = centers[index];
        x = center.x + (random() - 0.5) * spread * 0.14;
        y = center.y + (random() - 0.5) * spread * 0.14;
        cluster = `C${index + 1}`;
        break;
      }
      case "Corridor":
        x = (i / (pointCount - 1)) * spread;
        y = spread / 2 + (random() - 0.5) * spread * 0.08;
        break;
      case "Circle": {
        const angle = (i / pointCount) * Math.PI * 2;
        const radius = spread * 0.4 * (0.9 + random() * 0.2);
        x = spread / 2 + Math.cos(angle) * radius;
        y = spread / 2 + Math.sin(angle) * radius;
        break;
      }
      case "Outliers": {
        if (i % 12 === 0) {
          x = random() * spread * 1.6 - spread * 0.3;
          y = random() * spread * 1.6 - spread * 0.3;
          cluster = "outlier";
        } else {
          const center = centers[i % clusterCount];
          x = center.x + (random() - 0.5) * spread * 0.12;
          y = center.y + (random() - 0.5) * spread * 0.12;
          cluster = `C${(i % clusterCount) + 1}`;
        }
        break;
      }
    }

    points.push({
      id: `S${String(i + 1).padStart(4, "0")}`,
      address: `${type} point ${i + 1}`,
      city: "Synthetic",
      tags: cluster ? [cluster] : [],
      originalIndex: i + 1,
      coordinate: { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) },
      cluster,
    });
  }

  return {
    id: `synthetic-${type.toLowerCase().replace(/\s+/g, "-")}-${pointCount}-${seed}`,
    name: config.name || `${type}-${pointCount}`,
    version: "V1",
    kind: "synthetic",
    description: `${type} · ${pointCount} points · ${clusterCount} clusters · seed ${seed}`,
    seed,
    points,
    depotId: config.withDepot ? points[0].id : null,
    generator: { type, pointCount, clusterCount, spread },
  };
}

export const builtInSyntheticDatasets: Dataset[] = [
  generateDataset({ ...defaultGeneratorConfig, name: "Random-100", type: "Random", pointCount: 100 }),
  generateDataset({
    ...defaultGeneratorConfig,
    name: "MultipleClusters-200",
    type: "Multiple Clusters",
    pointCount: 200,
    clusterCount: 5,
  }),
  generateDataset({
    ...defaultGeneratorConfig,
    name: "Corridor-150",
    type: "Corridor",
    pointCount: 150,
    clusterCount: 1,
  }),
  generateDataset({
    ...defaultGeneratorConfig,
    name: "Outliers-200",
    type: "Outliers",
    pointCount: 200,
    clusterCount: 4,
  }),
];
