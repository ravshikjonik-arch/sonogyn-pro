"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAllNosologies,
  getNosologyById,
  getSeedNosologies,
  initNosologyStore,
  searchNosologies,
  type Nosology,
  type NosologySearchHit,
} from "@repo/nosology";

type State = {
  items: Nosology[];
  loading: boolean;
  error: string | null;
};

export function useNosologyList() {
  const [state, setState] = useState<State>(() => ({
    items: getSeedNosologies(),
    loading: false,
    error: null,
  }));
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NosologySearchHit[]>([]);

  const reload = useCallback(async () => {
    const seed = getSeedNosologies();
    setState({ items: seed, loading: false, error: null });
    try {
      await initNosologyStore();
      const items = await getAllNosologies();
      if (items.length > 0) {
        setState({ items, loading: false, error: null });
      }
    } catch {
      /* остаёмся на seed */
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const source = state.items.length > 0 ? state.items : getSeedNosologies();
    setHits(searchNosologies(source, query));
  }, [query, state.items]);

  return { ...state, query, setQuery, hits, reload };
}

export function useNosologyDetail(id: string) {
  const [nosology, setNosology] = useState<Nosology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const seed = getSeedNosologies().find((n) => n.id === id) ?? null;
    if (seed) {
      setNosology(seed);
      setLoading(false);
    }
    try {
      await initNosologyStore();
      const n = await getNosologyById(id);
      if (n) setNosology(n);
      else if (!seed) setError("Нозология не найдена");
    } catch {
      if (!seed) setError("Нозология не найдена");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { nosology, loading, error, reload };
}
