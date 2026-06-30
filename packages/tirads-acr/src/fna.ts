import type { TiradsAcrCategory } from "./types";
import { formatMm } from "@repo/medical-calculations";

export function decideFnaAndFollowUp(
  category: TiradsAcrCategory,
  sizeMm?: number,
): {
  fnaRecommended: boolean;
  fnaRationale: string;
  followUpRecommendation: string;
  observationRecommendation: string;
} {
  const sizeText =
    sizeMm !== undefined && Number.isFinite(sizeMm) ? formatMm(sizeMm) : "размер не указан — укажите наибольший диаметр";

  switch (category) {
    case "TR1":
      return {
        fnaRecommended: false,
        fnaRationale: "TR1: FNA не показана.",
        followUpRecommendation: "Рутинное наблюдение ЩЖ.",
        observationRecommendation: "Без очаговой тактики.",
      };
    case "TR2":
      return {
        fnaRecommended: false,
        fnaRationale: "TR2: FNA не показана (ACR).",
        followUpRecommendation: "Плановое УЗИ по клинике.",
        observationRecommendation: `Узел ${sizeText} — доброкачественный паттерн.`,
      };
    case "TR3":
      if (sizeMm !== undefined && sizeMm >= 25) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR3, ${sizeText} ≥2,5 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "При отказе от FNA — УЗИ 12–24 мес.",
          observationRecommendation: "TR3 при <2,5 см — наблюдение.",
        };
      }
      if (sizeMm !== undefined && sizeMm >= 15) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR3, ${sizeText} 1,5–2,4 см — FNA не обязательна; наблюдение.`,
          followUpRecommendation: "УЗИ через 12 мес (ACR follow-up ≥1,5 см).",
          observationRecommendation: "Динамика размера и эхоструктуры.",
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR3, ${sizeText} <1,5 см — FNA не показана.`,
        followUpRecommendation: "Наблюдение по клинике.",
        observationRecommendation: "Повтор при росте или новых признаках.",
      };
    case "TR4":
      if (sizeMm !== undefined && sizeMm >= 15) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR4, ${sizeText} ≥1,5 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "После FNA — тактика по Bethesda.",
          observationRecommendation: "TR4 <1,5 см — follow-up ≥1,0 см.",
        };
      }
      if (sizeMm !== undefined && sizeMm >= 10) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR4, ${sizeText} 1,0–1,4 см — follow-up, FNA по клинике.`,
          followUpRecommendation: "УЗИ 12 мес (ACR follow-up ≥1,0 см).",
          observationRecommendation: "Оценить рост и новые подозрительные признаки.",
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR4, ${sizeText} <1,0 см — наблюдение.`,
        followUpRecommendation: "Короткий интервал при факторах риска.",
        observationRecommendation: "FNA при росте ≥1,5 см.",
      };
    case "TR5":
      if (sizeMm !== undefined && sizeMm >= 10) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR5, ${sizeText} ≥1,0 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "Онкологический маршрут при подтверждении.",
          observationRecommendation: "TR5 ≥0,5 см — follow-up минимум.",
        };
      }
      if (sizeMm !== undefined && sizeMm >= 5) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR5, ${sizeText} 0,5–0,9 см — follow-up; FNA по клинике/риску.`,
          followUpRecommendation: "УЗИ 6–12 мес (ACR follow-up ≥0,5 см).",
          observationRecommendation: "Низкий порог для повторной FNA при росте.",
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR5, ${sizeText} <0,5 см — активное наблюдение.`,
        followUpRecommendation: "УЗИ 6–12 мес.",
        observationRecommendation: "Микроузел TR5 — индивидуальная тактика.",
      };
    default:
      return {
        fnaRecommended: false,
        fnaRationale: "—",
        followUpRecommendation: "—",
        observationRecommendation: "—",
      };
  }
}
