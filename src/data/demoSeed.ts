import { defaultParameters } from "@/algorithms/OrderingStrategy";
import { strategies } from "@/algorithms/registry";
import { aaltenV1 } from "@/datasets/aaltenV1";
import type { Experiment, Hypothesis } from "@/domain/types";
import { runExperiment } from "@/services/experiments/experimentRunner";

/** Demo data so the lab is never empty on first launch. Clearly labelled. */
export function buildDemoExperiments(): Experiment[] {
  return strategies.map((strategy) => {
    const experiment = runExperiment({
      dataset: aaltenV1,
      strategyId: strategy.id,
      parameters: defaultParameters(strategy),
      seed: 12345,
      notes: "Demo run shipped with the prototype.",
    });
    return {
      ...experiment,
      id: `demo_${strategy.id}`,
      demo: true,
      baseline: strategy.id === "original-order",
      createdAt: new Date(Date.UTC(2026, 0, 12, 9, 0)).toISOString(),
    };
  });
}

export function buildDemoHypotheses(): Hypothesis[] {
  return [
    {
      id: "demo_hypothesis_1",
      title: "Look-ahead should reduce bad transitions between streets",
      observation:
        "Nearest Neighbor picks locally good addresses but strands a few streets, then pays for them with one very long jump late in the route.",
      expectedResult: "Lower longest edge and lower total cost than plain Nearest Neighbor.",
      status: "Testing",
      experimentIds: ["demo_nearest-neighbor", "demo_experimental-v1"],
      createdAt: new Date(Date.UTC(2026, 0, 12, 9, 5)).toISOString(),
      demo: true,
    },
    {
      id: "demo_hypothesis_2",
      title: "2-opt mainly removes self-crossings, not stranded points",
      observation:
        "After 2-opt the route looks cleaner but the single largest transition often survives.",
      expectedResult: "Crossing count drops sharply while longest edge barely moves.",
      status: "Idea",
      experimentIds: ["demo_nn-2opt"],
      createdAt: new Date(Date.UTC(2026, 0, 12, 9, 8)).toISOString(),
      demo: true,
    },
  ];
}
