import { hasProEntitlement } from "@/lib/subscription/access";

import {
  CAREER_STAGES,
  type CareerProgress,
  type CareerStageId,
  getStageById,
} from "./ladder";

export type CareerProfileInput = {
  full_name: string | null;
  specialization: string | null;
  birth_year: number | null;
  subscription_tier: string;
  trial_ends_at: string | null;
  courseEnrollmentCount: number;
};

const STAGE_ORDER: CareerStageId[] = ["student", "intern", "doctor", "pro"];

function isProfileComplete(p: CareerProfileInput): boolean {
  return Boolean(p.full_name?.trim() && p.specialization?.trim() && p.birth_year);
}

function hasCourseAccess(p: CareerProfileInput): boolean {
  return p.courseEnrollmentCount > 0;
}

export function resolveCareerStage(profile: CareerProfileInput | null, isAuthenticated: boolean): CareerStageId {
  if (!isAuthenticated || !profile) return "guest";
  if (hasProEntitlement(profile)) return "pro";
  if (isProfileComplete(profile) && hasCourseAccess(profile)) return "doctor";
  if (hasCourseAccess(profile)) return "intern";
  return "student";
}

function stageIndex(id: CareerStageId): number {
  if (id === "guest") return -1;
  return STAGE_ORDER.indexOf(id);
}

function buildMotivation(
  current: CareerStageId,
  next: CareerStageId | null,
  profile: CareerProfileInput | null,
): Pick<CareerProgress, "headline" | "subline" | "ctaLabel" | "ctaHref"> {
  const nextStage = next ? getStageById(next) : null;

  if (current === "guest") {
    return {
      headline: "Начните путь от студента к врачу",
      subline: "Регистрация бесплатна — затем запись на курс автора и профиль врача.",
      ctaLabel: "Стать студентом — бесплатно",
      ctaHref: "/register",
    };
  }

  if (current === "student") {
    return {
      headline: "Шаг 2 — запишитесь на курс автора",
      subline: "Ординаторский статус открывается после записи на курс (бесплатный или платный).",
      ctaLabel: "Выбрать курс — стать ординатором",
      ctaHref: "/library/courses",
    };
  }

  if (current === "intern") {
    const missing: string[] = [];
    if (!profile?.full_name?.trim()) missing.push("ФИО");
    if (!profile?.birth_year) missing.push("дату рождения");
    if (!profile?.specialization?.trim()) missing.push("специализацию");
    return {
      headline: "Вы ординатор — завершите профиль врача",
      subline:
        missing.length > 0
          ? `Осталось: ${missing.join(", ")}. После этого — статус «Врач» (75%) и письмо с шагом PRO.`
          : "Завершите профиль — получите статус «Врач» и доступ ко всему клиническому набору.",
      ctaLabel: "Заполнить профиль",
      ctaHref: "/profile",
    };
  }

  if (current === "doctor") {
    return {
      headline: "Вы врач на платформе — остался PRO",
      subline: nextStage
        ? `${nextStage.unlocks[0]}. ${nextStage.unlocks[1] ?? ""} Следующая покупка — подписка без лимитов.`
        : "Снимите лимиты AI и кейсов — финальный шаг пути.",
      ctaLabel: "Перейти на PRO — 100%",
      ctaHref: "/paywall",
    };
  }

  return {
    headline: "Вы на максимальном уровне",
    subline: "PRO активен — используйте AI, кейсы и курсы без потолка Free.",
    ctaLabel: "Открыть кабинет",
    ctaHref: "/app",
  };
}

export function buildCareerProgress(
  profile: CareerProfileInput | null,
  isAuthenticated: boolean,
): CareerProgress {
  const currentStage = resolveCareerStage(profile, isAuthenticated);
  const currentIdx = stageIndex(currentStage);

  const completedStageIds = STAGE_ORDER.filter((_, i) => i < currentIdx);
  const nextStage: CareerStageId | null =
    currentStage === "guest"
      ? "student"
      : currentStage === "pro"
        ? null
        : STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)] ?? null;

  const progressPercent =
    currentStage === "guest"
      ? 0
      : currentStage === "pro"
        ? 100
        : Math.round(((currentIdx + 1) / STAGE_ORDER.length) * 100);

  const motivation = buildMotivation(currentStage, nextStage, profile);
  const nextMeta = nextStage ? getStageById(nextStage) : null;
  const currentMeta = currentStage !== "guest" ? getStageById(currentStage) : null;

  return {
    currentStage,
    nextStage: currentStage === "pro" ? null : nextStage,
    progressPercent,
    completedStageIds,
    lockedPreview: nextMeta?.unlocks ?? currentMeta?.nextTeaser ?? [],
    ...motivation,
  };
}

export { CAREER_STAGES };
