"use client";

import { useCallback, useEffect, useState } from "react";

import type { AchievementCheckBody } from "@/lib/security/api-body-schemas";
import type { UserAchievementsPayload } from "@/lib/achievements/types";

import { showAchievementToasts } from "@/components/achievements/AchievementToastListener";

type CheckResult = {
  newlyUnlocked: { slug: string; name: string; iconEmoji: string; xpReward: number }[];
};

export function useAchievements() {
  const [data, setData] = useState<UserAchievementsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/achievements/user", { credentials: "same-origin" });
      const body = (await res.json()) as UserAchievementsPayload & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Не удалось загрузить награды");
        setData(null);
        return;
      }
      setData(body);
    } catch {
      setError("Сеть недоступна");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

/** Вызов после кейса/теста/урока — проверка новых бейджей + toast */
export async function reportAchievementCheck(payload: AchievementCheckBody): Promise<CheckResult | null> {
  try {
    const res = await fetch("/api/achievements/check", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as CheckResult & { error?: string };
    if (!res.ok) return null;
    if (body.newlyUnlocked?.length) {
      showAchievementToasts(body.newlyUnlocked);
    }
    return body;
  } catch {
    return null;
  }
}
