import { xpForEvent } from "./level";
import type { ClinicalModuleId } from "./types";

/** Прогресс к бейджу модуля — только клиент-safe, без Prisma */
export function moduleAchievementHint(moduleId: ClinicalModuleId): {
  label: string;
  xpOnComplete: number;
  criteriaHint: string;
} {
  const hints: Record<ClinicalModuleId, { label: string; criteriaHint: string }> = {
    orads: { label: "O-RADS", criteriaHint: "3 кейса → бейдж O-RADS Explorer" },
    iota: { label: "IOTA", criteriaHint: "5 верных интерпретаций подряд → IOTA Pro" },
    birads: { label: "BI-RADS", criteriaHint: "XP за кейсы и тесты раздела" },
    tirads: { label: "TI-RADS", criteriaHint: "XP за кейсы и тесты раздела" },
    fmf: { label: "FMF", criteriaHint: "100% раздела → FMF Мастер 🏆" },
    general: { label: "Обучение", criteriaHint: "10 материалов → Ученик УЗИ" },
  };
  const h = hints[moduleId];
  return {
    ...h,
    xpOnComplete: xpForEvent(moduleId === "general" ? "lesson_complete" : "case_complete"),
  };
}
