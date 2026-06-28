import { useCallback, useEffect, useMemo, useState } from "react";

import { getWebApiBase } from "../api/chatBackend";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import type { TeachingCasePreview, TeachingCaseFeedMode } from "../features/teachingCases/types";

type TeachingCasesFilters = {
  q?: string;
  orads?: number;
  tags?: string;
  topic?: "all" | "prolapse";
  feedMode?: TeachingCaseFeedMode;
  channelId?: string;
};

type TeachingCasesResult = {
  cases: TeachingCasePreview[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function mapApiRow(row: Record<string, unknown>): TeachingCasePreview {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    anatomy: row.anatomy != null ? String(row.anatomy) : null,
    pathology: row.pathology != null ? String(row.pathology) : null,
    status: String(row.status ?? "published"),
    channelId: row.channel_id != null ? String(row.channel_id) : null,
    oradsCategory: typeof row.orads_category === "number" ? row.orads_category : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: String(row.created_at ?? ""),
  };
}

export function useTeachingCases(filters: TeachingCasesFilters = {}): TeachingCasesResult {
  const [cases, setCases] = useState<TeachingCasePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters.q, filters.orads, filters.tags, filters.topic, filters.feedMode, filters.channelId],
  );

  const reload = useCallback(async () => {
    const base = getWebApiBase();
    if (!base) {
      setError("API не настроен (EXPO_PUBLIC_API_BASE_URL).");
      setCases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.q?.trim()) params.set("q", filters.q.trim());
      if (filters.orads !== undefined) params.set("orads", String(filters.orads));
      if (filters.tags?.trim()) params.set("tags", filters.tags.trim());
      if (filters.topic === "prolapse") params.set("topic", "prolapse");
      if (filters.feedMode) params.set("feedMode", filters.feedMode);
      if (filters.channelId) params.set("channelId", filters.channelId);

      const headers: Record<string, string> = { "x-sonogyn-client": "mobile" };
      if (supabaseMobile) {
        const { data } = await supabaseMobile.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${base}/api/cases?${params.toString()}`, { headers });
      const payload = (await res.json().catch(() => null)) as
        | { cases?: Record<string, unknown>[]; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }

      setCases((payload?.cases ?? []).map(mapApiRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить галерею");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(
    () => ({
      cases,
      loading,
      error,
      reload,
    }),
    [cases, loading, error, reload],
  );
}
