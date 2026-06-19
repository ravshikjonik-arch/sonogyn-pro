import { parseIsoDate, startOfLocalDay } from "@/lib/utils/ru-date";

export type PatientInsight = {
  tone: "info" | "risk" | "success" | "recommendation";
  title: string;
  text?: string;
};

type MetaLike = {
  date_of_birth?: string | null;
  lmp?: string | null;
  phone?: string | null;
  snils?: string | null;
  oms_policy?: string | null;
  notes?: string | null;
};

/** Возраст в полных годах из ISO-даты рождения. */
export function ageFromDob(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = parseIsoDate(iso);
  if (!d) return null;
  const today = startOfLocalDay(new Date());
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

/** Срок гестации по ПМП: { weeks, days } или null, если дата неправдоподобна. */
export function gestationFromLmp(
  iso: string | null | undefined,
): { weeks: number; days: number } | null {
  if (!iso) return null;
  const d = parseIsoDate(iso);
  if (!d) return null;
  const today = startOfLocalDay(new Date());
  const diffDays = Math.floor((today.getTime() - startOfLocalDay(d).getTime()) / 86400000);
  if (diffDays < 0 || diffDays > 308) return null; // до ~44 недель
  return { weeks: Math.floor(diffDays / 7), days: diffDays % 7 };
}

export function patientInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #6366f1)",
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #0ea5e9, #14b8a6)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #14b8a6, #3b82f6)",
];

export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

/**
 * Детерминированные клинические инсайты из карточки (без LLM): возраст,
 * срок беременности, менопаузальный контекст, недостающие данные.
 * Не диагноз — вспомогательная интерпретация.
 */
export function buildPatientInsights(meta: MetaLike, studiesCount = 0): PatientInsight[] {
  const insights: PatientInsight[] = [];
  const age = ageFromDob(meta.date_of_birth);
  const gest = gestationFromLmp(meta.lmp);

  if (age !== null) {
    if (age >= 50) {
      insights.push({
        tone: "info",
        title: `Возраст ${age} лет — вероятна постменопауза`,
        text: "В постменопаузе пороги O-RADS/IOTA и тактика по образованиям придатков отличаются.",
      });
    } else {
      insights.push({ tone: "info", title: `Возраст ${age} лет (репродуктивный период)` });
    }
  }

  if (gest) {
    insights.push({
      tone: "success",
      title: `Срок по ПМП ≈ ${gest.weeks} нед ${gest.days} дн`,
      text: "Уточните срок по КТР/фетометрии в калькуляторе срока беременности.",
    });
  }

  if (studiesCount > 0) {
    insights.push({
      tone: "info",
      title: `Исследований в карте: ${studiesCount}`,
      text: studiesCount > 1 ? "Можно оценить динамику между исследованиями." : undefined,
    });
  }

  if (!meta.date_of_birth) {
    insights.push({
      tone: "recommendation",
      title: "Добавьте дату рождения",
      text: "Это нужно для расчёта возраста и корректной интерпретации.",
    });
  }

  if (insights.length === 0) {
    insights.push({ tone: "info", title: "Недостаточно данных для инсайтов", text: "Заполните дату рождения и ПМП." });
  }

  return insights;
}
