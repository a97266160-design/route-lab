const PREFIX = "route-ordering-lab.v1.";

export const StorageKeys = {
  experiments: `${PREFIX}experiments`,
  hypotheses: `${PREFIX}hypotheses`,
  datasets: `${PREFIX}datasets`,
  settings: `${PREFIX}settings`,
} as const;

export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the lab keeps working in memory */
  }
}

export function clearLab(): void {
  try {
    Object.values(StorageKeys).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
