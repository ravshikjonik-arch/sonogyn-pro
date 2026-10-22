export const CALCULATOR_WORKSPACE_KEY = "sonogyn:calculator-workspace:v1";

export const CALCULATOR_HISTORY_MAX = 50;

export type CalcHistoryEntry = {
  id: string;
  calculatorId: string;
  path: string;
  title: string;
  summary: string;
  params: Record<string, string | number | boolean | null>;
  at: string;
};

export type CalculatorWorkspaceStore = {
  version: 1;
  favorites: string[];
  history: Record<string, CalcHistoryEntry[]>;
};

const EMPTY: CalculatorWorkspaceStore = {
  version: 1,
  favorites: [],
  history: {},
};

export const CALCULATOR_CATALOG: Record<string, { title: string; href: string }> = {
  bishop: { title: "Шкала Bishop", href: "/tools/calc/ob/bishop" },
  vbac: { title: "VBAC / TOLAC", href: "/tools/calc/ob/vbac" },
  "fetal-weight": { title: "Масса плода (EFW)", href: "/tools/calc/ob/fetal-weight" },
  "o-rads": { title: "O-RADS US", href: "/tools/calc/rads/o-rads" },
  iota: { title: "IOTA ADNEX", href: "/tools/calc/rads/iota" },
  "bi-rads": { title: "BI-RADS US", href: "/tools/calc/rads/bi-rads" },
  "ti-rads": { title: "TI-RADS", href: "/tools/calc/rads/ti-rads" },
  endometrium: { title: "Эндометрий", href: "/tools/calc/gyn/endometrium" },
  elastography: { title: "Эластография", href: "/tools/calc/gyn/elastography" },
};

function readStore(): CalculatorWorkspaceStore {
  if (typeof window === "undefined") return { ...EMPTY, history: {} };
  try {
    const raw = localStorage.getItem(CALCULATOR_WORKSPACE_KEY);
    if (!raw) return { ...EMPTY, history: {} };
    const parsed = JSON.parse(raw) as CalculatorWorkspaceStore;
    return {
      version: 1,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: parsed.history && typeof parsed.history === "object" ? parsed.history : {},
    };
  } catch {
    return { ...EMPTY, history: {} };
  }
}

function writeStore(store: CalculatorWorkspaceStore): void {
  localStorage.setItem(CALCULATOR_WORKSPACE_KEY, JSON.stringify(store));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sonogyn:calculator-workspace"));
  }
}

export function toggleCalculatorFavorite(calculatorId: string): boolean {
  const store = readStore();
  const on = store.favorites.includes(calculatorId);
  store.favorites = on
    ? store.favorites.filter((id) => id !== calculatorId)
    : [calculatorId, ...store.favorites];
  writeStore(store);
  return !on;
}

export function isCalculatorFavorite(calculatorId: string): boolean {
  return readStore().favorites.includes(calculatorId);
}

export function appendCalculatorHistory(entry: Omit<CalcHistoryEntry, "id" | "at">): void {
  const store = readStore();
  const list = store.history[entry.calculatorId] ?? [];
  const fingerprint = JSON.stringify(entry.params);
  const duplicate = list[0] && JSON.stringify(list[0].params) === fingerprint;
  if (duplicate) return;

  const row: CalcHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  store.history[entry.calculatorId] = [row, ...list].slice(0, CALCULATOR_HISTORY_MAX);
  writeStore(store);
}

export function listRecentCalculations(limit = 15): CalcHistoryEntry[] {
  const store = readStore();
  return Object.values(store.history)
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

export function listFavoriteCalculators(): Array<{ id: string; title: string; href: string }> {
  const store = readStore();
  return store.favorites
    .map((id) => ({ id, ...(CALCULATOR_CATALOG[id] ?? { title: id, href: "/tools/calc" }) }))
    .filter((x) => x.title);
}

export function getHistoryForCalculator(calculatorId: string): CalcHistoryEntry[] {
  return readStore().history[calculatorId] ?? [];
}
