import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { CommentRecord } from "../features/case/types";
import { ensureAnonymousAuth } from "../services/firebase/authService";
import { addComment } from "../services/firebase/commentsService";
import { requireFirestore } from "../services/firebase/firebase";
import { addPoints, POINTS } from "../services/firebase/gamificationService";

export function useComments(caseId?: string) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!caseId) {
      setComments([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await ensureAnonymousAuth();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось загрузить комментарии";
      setError(message);
    }
  }, [caseId]);

  useEffect(() => {
    let active = true;
    let stop = () => {};
    async function start() {
      if (!caseId) return;
      try {
        await loadComments();
        const fs = requireFirestore();
        const q = query(
          collection(fs, "comments"),
          where("caseId", "==", caseId),
          orderBy("createdAt", "asc")
        );
        stop = onSnapshot(
          q,
          (snap) => {
            if (!active) return;
            setError(null);
            setComments(
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
        setError(e instanceof Error ? e.message : "Не удалось загрузить комментарии");
        setLoading(false);
      }
    }
    void start();
    return () => {
      active = false;
      stop();
    };
  }, [loadComments]);

  const createComment = useCallback(
    async (text: string) => {
      if (!caseId || !text.trim()) return;
      setSaving(true);
      setError(null);
      const optimistic: CommentRecord = {
        id: `tmp-${Date.now()}`,
        caseId,
        userId: "local",
        text: text.trim(),
        createdAt: Date.now(),
      };
      setComments((prev) => [...prev, optimistic]);
      try {
        const user = await ensureAnonymousAuth();
        const created = await addComment({
          caseId,
          userId: user.uid,
          text,
        });
        const points = await addPoints(user.uid, POINTS.addComment);
        if (points.levelUp) {
          const msg = `🎉 Вы достигли уровня ${points.newLevel}!`;
          if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
          else Alert.alert("Новый уровень", msg);
        }
        setComments((prev) => prev.map((c) => (c.id === optimistic.id ? created : c)));
      } catch (e) {
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        const message = e instanceof Error ? e.message : "Не удалось добавить комментарий";
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [caseId]
  );

  return useMemo(
    () => ({
      comments,
      loading,
      saving,
      error,
      reload: loadComments,
      createComment,
    }),
    [comments, loading, saving, error, loadComments, createComment]
  );
}
