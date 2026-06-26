"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/app/providers";
import { reportAchievementCheck } from "@/hooks/useAchievements";

/** При входе — daily_login + toast при новых бейджах */
export function AchievementToastListener() {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready || !user) return;
    void reportAchievementCheck({ eventType: "daily_login", moduleId: "general" });
  }, [ready, user?.id]);

  return null;
}

/** Показать toast и событие для анимации на дашборде */
export function showAchievementToasts(
  newlyUnlocked: { slug: string; name: string; iconEmoji: string }[],
) {
  if (!newlyUnlocked.length) return;
  for (const a of newlyUnlocked) {
    toast.success(`🎉 Вы получили бейдж ${a.name}!`, {
      description: `${a.iconEmoji} +XP за достижение`,
      duration: 6000,
    });
  }
  window.dispatchEvent(
    new CustomEvent("achievements-unlocked", {
      detail: { slugs: newlyUnlocked.map((a) => a.slug) },
    }),
  );
}
