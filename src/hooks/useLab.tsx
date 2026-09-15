import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BASELINE_STRATEGY_ID } from "@/algorithms/registry";
import { buildDemoExperiments, buildDemoHypotheses } from "@/data/demoSeed";
import { aaltenV1 } from "@/datasets/aaltenV1";
import {
  builtInSyntheticDatasets,
  generateDataset,
  type GeneratorConfig,
} from "@/datasets/generator";
import type {
  Dataset,
  Experiment,
  Hypothesis,
  HypothesisStatus,
  StrategyParameters,
} from "@/domain/types";
import { runExperiment } from "@/services/experiments/experimentRunner";
import {
  isStorageAvailable,
  loadJson,
  saveJson,
  StorageKeys,
} from "@/services/storage/localStore";

type LabContextValue = {
  hydrated: boolean;
  storageAvailable: boolean;
  datasets: Dataset[];
  dataset: Dataset;
  activeDataset: Dataset;
  setDatasetId: (id: string) => void;
  tagFilter: string[];
  toggleTag: (tag: string) => void;
  clearTagFilter: () => void;
  addGeneratedDataset: (config: GeneratorConfig) => Dataset;
  experiments: Experiment[];
  saveExperiment: (experiment: Experiment) => void;
  deleteExperiment: (id: string) => void;
  duplicateExperiment: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  run: (input: { strategyId: string; parameters: StrategyParameters; seed: number }) => Experiment;
  baselineFor: (datasetId: string) => Experiment | undefined;
  hypotheses: Hypothesis[];
  addHypothesis: (input: Omit<Hypothesis, "id" | "createdAt">) => void;
  updateHypothesisStatus: (id: string, status: HypothesisStatus) => void;
  deleteHypothesis: (id: string) => void;
};

const LabContext = createContext<LabContextValue | null>(null);

const PROTOTYPE_VERSION = "V1 prototype";

export function LabProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [generatorConfigs, setGeneratorConfigs] = useState<GeneratorConfig[]>([]);
  const [datasetId, setDatasetId] = useState(aaltenV1.id);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);
    const storedExperiments = loadJson<Experiment[]>(StorageKeys.experiments, []);
    const storedHypotheses = loadJson<Hypothesis[]>(StorageKeys.hypotheses, []);
    const storedConfigs = loadJson<GeneratorConfig[]>(StorageKeys.datasets, []);
    setGeneratorConfigs(storedConfigs);
    setExperiments(storedExperiments.length ? storedExperiments : buildDemoExperiments());
    setHypotheses(storedHypotheses.length ? storedHypotheses : buildDemoHypotheses());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJson(StorageKeys.experiments, experiments);
  }, [experiments, hydrated]);
  useEffect(() => {
    if (hydrated) saveJson(StorageKeys.hypotheses, hypotheses);
  }, [hypotheses, hydrated]);
  useEffect(() => {
    if (hydrated) saveJson(StorageKeys.datasets, generatorConfigs);
  }, [generatorConfigs, hydrated]);

  const datasets = useMemo(() => {
    const generated = generatorConfigs.map((config) => generateDataset(config));
    return [aaltenV1, ...builtInSyntheticDatasets, ...generated];
  }, [generatorConfigs]);

  const dataset = useMemo(
    () => datasets.find((d) => d.id === datasetId) ?? datasets[0],
    [datasets, datasetId],
  );

  const activeDataset = useMemo<Dataset>(() => {
    if (tagFilter.length === 0) return dataset;
    const points = dataset.points.filter((p) => p.tags.some((tag) => tagFilter.includes(tag)));
    if (points.length < 2) return dataset;
    return {
      ...dataset,
      id: `${dataset.id}::${tagFilter.slice().sort().join("+")}`,
      name: `${dataset.name} (${tagFilter.join(", ")})`,
      points,
      depotId: dataset.depotId && points.some((p) => p.id === dataset.depotId)
        ? dataset.depotId
        : points[0].id,
    };
  }, [dataset, tagFilter]);

  const toggleTag = useCallback((tag: string) => {
    setTagFilter((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }, []);

  const addGeneratedDataset = useCallback((config: GeneratorConfig) => {
    const generated = generateDataset(config);
    setGeneratorConfigs((current) => {
      const others = current.filter(
        (c) => generateDataset(c).id !== generated.id,
      );
      return [...others, config];
    });
    setDatasetId(generated.id);
    setTagFilter([]);
    return generated;
  }, []);

  const run = useCallback<LabContextValue["run"]>(
    ({ strategyId, parameters, seed }) =>
      runExperiment({ dataset: activeDataset, strategyId, parameters, seed }),
    [activeDataset],
  );

  const saveExperiment = useCallback((experiment: Experiment) => {
    setExperiments((current) => [experiment, ...current.filter((e) => e.id !== experiment.id)]);
  }, []);

  const deleteExperiment = useCallback((id: string) => {
    setExperiments((current) => current.filter((e) => e.id !== id));
  }, []);

  const duplicateExperiment = useCallback((id: string) => {
    setExperiments((current) => {
      const source = current.find((e) => e.id === id);
      if (!source) return current;
      const copy: Experiment = {
        ...source,
        id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        label: `${source.label} (copy)`,
        demo: false,
        createdAt: new Date().toISOString(),
      };
      return [copy, ...current];
    });
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setExperiments((current) => current.map((e) => (e.id === id ? { ...e, notes } : e)));
  }, []);

  const baselineFor = useCallback(
    (id: string) =>
      experiments
        .filter((e) => e.datasetId === id && e.strategyId === BASELINE_STRATEGY_ID)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [experiments],
  );

  const addHypothesis = useCallback((input: Omit<Hypothesis, "id" | "createdAt">) => {
    setHypotheses((current) => [
      {
        ...input,
        id: `hyp_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }, []);

  const updateHypothesisStatus = useCallback((id: string, status: HypothesisStatus) => {
    setHypotheses((current) => current.map((h) => (h.id === id ? { ...h, status } : h)));
  }, []);

  const deleteHypothesis = useCallback((id: string) => {
    setHypotheses((current) => current.filter((h) => h.id !== id));
  }, []);

  const value = useMemo<LabContextValue>(
    () => ({
      hydrated,
      storageAvailable,
      datasets,
      dataset,
      activeDataset,
      setDatasetId: (id) => {
        setDatasetId(id);
        setTagFilter([]);
      },
      tagFilter,
      toggleTag,
      clearTagFilter: () => setTagFilter([]),
      addGeneratedDataset,
      experiments,
      saveExperiment,
      deleteExperiment,
      duplicateExperiment,
      updateNotes,
      run,
      baselineFor,
      hypotheses,
      addHypothesis,
      updateHypothesisStatus,
      deleteHypothesis,
    }),
    [
      hydrated,
      storageAvailable,
      datasets,
      dataset,
      activeDataset,
      tagFilter,
      toggleTag,
      addGeneratedDataset,
      experiments,
      saveExperiment,
      deleteExperiment,
      duplicateExperiment,
      updateNotes,
      run,
      baselineFor,
      hypotheses,
      addHypothesis,
      updateHypothesisStatus,
      deleteHypothesis,
    ],
  );

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab(): LabContextValue {
  const context = useContext(LabContext);
  if (!context) throw new Error("useLab must be used inside <LabProvider>");
  return context;
}

export { PROTOTYPE_VERSION };
