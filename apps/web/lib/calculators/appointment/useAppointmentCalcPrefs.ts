"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sonogyn:appointment-calc-prefs:v1";

export type SortMode = "popular" | "alphabet" | "recent";

export type AppointmentCalcPrefs = {
  favorites: string[];
  recent: string[];
  useCounts: Record<string, number>;
};

const DEFAULT_PREFS: AppointmentCalcPrefs = {
  favorites: [],
  recent: [],
  useCounts: {},
};

function readPrefs(): AppointmentCalcPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AppointmentCalcPrefs>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      useCounts: parsed.useCounts && typeof parsed.useCounts === "object" ? parsed.useCounts : {},
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: AppointmentCalcPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useAppointmentCalcPrefs() {
  const [prefs, setPrefs] = useState<AppointmentCalcPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppointmentCalcPrefs) => {
    setPrefs(next);
    writePrefs(next);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setPrefs((prev) => {
        const favorites = prev.favorites.includes(id)
          ? prev.favorites.filter((x) => x !== id)
          : [id, ...prev.favorites];
        const next = { ...prev, favorites };
        writePrefs(next);
        return next;
      });
    },
    [],
  );

  const recordUse = useCallback((id: string) => {
    setPrefs((prev) => {
      const recent = [id, ...prev.recent.filter((x) => x !== id)].slice(0, 12);
      const useCounts = { ...prev.useCounts, [id]: (prev.useCounts[id] ?? 0) + 1 };
      const next = { ...prev, recent, useCounts };
      writePrefs(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => prefs.favorites.includes(id), [prefs.favorites]);

  return useMemo(
    () => ({ prefs, hydrated, toggleFavorite, recordUse, isFavorite, persist }),
    [prefs, hydrated, toggleFavorite, recordUse, isFavorite, persist],
  );
}

export function sortCalculators<T extends { id: string; title: string }>(
  items: T[],
  mode: SortMode,
  prefs: AppointmentCalcPrefs,
): T[] {
  const copy = [...items];
  if (mode === "alphabet") {
    return copy.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }
  if (mode === "recent") {
    const order = new Map(prefs.recent.map((id, i) => [id, i]));
    return copy.sort((a, b) => {
      const ai = order.get(a.id) ?? 999;
      const bi = order.get(b.id) ?? 999;
      if (ai !== bi) return ai - bi;
      return a.title.localeCompare(b.title, "ru");
    });
  }
  // popular
  return copy.sort((a, b) => {
    const diff = (prefs.useCounts[b.id] ?? 0) - (prefs.useCounts[a.id] ?? 0);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, "ru");
  });
}
