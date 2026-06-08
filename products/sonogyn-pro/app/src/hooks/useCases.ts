import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ToastAndroid, Alert } from "react-native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CasePreview } from "../features/case/types";
import type { OradsSnapshot } from "../features/case/types";
import { createCase, getCommentCountsByCaseIds } from "../services/firebase/casesService";
import { ensureAnonymousAuth } from "../services/firebase/authService";
import { requireFirestore } from "../services/firebase/firebase";
import { addPoints, getUsersByIds, POINTS } from "../services/firebase/gamificationService";

type CreateCaseDraft = {
  organ: "breast" | "ovary" | "uterus" | "lymph";
  description: string;
  result?: string;
  imageUri?: string;
  oradsSnapshot?: OradsSnapshot;
};

export function useCases() {
  const [cases, setCases] = useState<CasePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await ensureAnonymousAuth();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось загрузить кейсы";
      setError(message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let stop = () => {};

    async function start() {
      try {
        await loadCases();
        const fs = requireFirestore();
        const q = query(collection(fs, "cases"), orderBy("createdAt", "desc"));
        stop = onSnapshot(
          q,
          async (snap) => {
            setError(null);
            const rows = snap.docs.map((doc) => {
              const data = doc.data() as {
                userId: string;
                organ: "breast" | "ovary" | "uterus" | "lymph";
                description: string;
                imageUrl?: string;
                result?: string;
                oradsSnapshot?: OradsSnapshot | null;
                likesCount?: number;
                createdAt?: { toMillis?: () => number } | number;
              };
              const createdAt =
                typeof data.createdAt === "number"
                  ? data.createdAt
                  : data.createdAt && "toMillis" in data.createdAt && data.createdAt.toMillis
                    ? data.createdAt.toMillis()
                    : 0;
              return {
                id: doc.id,
                userId: data.userId || "",
                organ: data.organ,
                description: data.description || "",
                image: data.imageUrl || "",
                result: data.result || "",
                oradsSnapshot: data.oradsSnapshot || undefined,
                likesCount: data.likesCount || 0,
                createdAt,
              };
            });
            const counts = await getCommentCountsByCaseIds(rows.map((r) => r.id));
            const users = await getUsersByIds(rows.map((r) => r.userId));
            if (!active) return;
            setCases(
              rows.map((r) => ({
                ...r,
                commentsCount: counts[r.id] || 0,
                authorLevel: users[r.userId]?.level ?? 1,
              }))
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
        setError(e instanceof Error ? e.message : "Не удалось загрузить кейсы");
        setLoading(false);
      }
    }

    void start();
    return () => {
      active = false;
      stop();
    };
  }, [loadCases]);

  const createNewCase = useCallback(
    async (draft: CreateCaseDraft) => {
      setSaving(true);
      setError(null);
      try {
        const user = await ensureAnonymousAuth();
        const created = await createCase({
          userId: user.uid,
          organ: draft.organ,
          description: draft.description,
          result: draft.result,
          imageUri: draft.imageUri,
          oradsSnapshot: draft.oradsSnapshot,
        });
        const points = await addPoints(user.uid, POINTS.createCase);
        if (points.levelUp) {
          const msg = `🎉 Вы достигли уровня ${points.newLevel}!`;
          if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
          else Alert.alert("Новый уровень", msg);
        }
        await loadCases();
        return created;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось сохранить кейс";
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [loadCases]
  );

  return useMemo(
    () => ({
      cases,
      loading,
      saving,
      error,
      reload: loadCases,
      createNewCase,
    }),
    [cases, loading, saving, error, loadCases, createNewCase]
  );
}
