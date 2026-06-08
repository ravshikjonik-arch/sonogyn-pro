import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CommentRecord } from "../features/case/types";
import { ensureAnonymousAuth } from "../services/firebase/authService";
import { requireFirestore } from "../services/firebase/firebase";

const RECENT = 12;

export function useRecentComments() {
  const [items, setItems] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await ensureAnonymousAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let stop = () => {};
    void (async () => {
      try {
        await reload();
        const fs = requireFirestore();
        const q = query(
          collection(fs, "comments"),
          orderBy("createdAt", "desc"),
          limit(RECENT)
        );
        stop = onSnapshot(
          q,
          (snap) => {
            if (!active) return;
            setError(null);
            setItems(
              snap.docs.map((doc) => {
                const data = doc.data() as Omit<CommentRecord, "id">;
                return { id: doc.id, ...data };
              })
            );
            setLoading(false);
          },
          (e) => {
            if (!active) return;
            setError(e.message);
            setLoading(false);
          }
        );
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Ошибка");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      stop();
    };
  }, [reload]);

  return useMemo(() => ({ items, loading, error, reload }), [items, loading, error, reload]);
}
