"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAllNosologies,
  getNosologyById,
  initNosologyStore,
  searchNosologyStore,
  type Nosology,
  type NosologySearchHit,
} from "@repo/nosology";

type State = {
  items: Nosology[];
  loading: boolean;
  error: string | null;
};

export function useNosologyList() {
  const [state, setState] = useState<State>({ items: [], loading: true, error: null });
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NosologySearchHit[]>([]);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await initNosologyStore();
      const items = await getAllNosologies();
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState({
        items: [],
        loading: false,
        error: e instanceof Error ? e.message : "Ошибка загрузки нозологий",
      });
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
    let cancelled = false;
    void searchNosologyStore(query).then((h) => {
      if (!cancelled) setHits(h);
    });
    return () => {
      cancelled = true;
    };
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
    try {
      await initNosologyStore();
      const n = await getNosologyById(id);
      if (!n) {
        setError("Нозология не найдена");
        setNosology(null);
      } else {
        setNosology(n);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setNosology(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { nosology, loading, error, reload };
}
