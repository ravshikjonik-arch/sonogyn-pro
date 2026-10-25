import type { TiradsAcrCategory } from "./types";
import { formatMm } from "@repo/medical-calculations";

const GROWTH =
  "Рост по ACR: ≥20% в двух измерениях и минимум 2 мм, либо объём ≥50%.";

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
        followUpRecommendation: "УЗИ-наблюдение по ACR не требуется.",
        observationRecommendation: "0 баллов: нет узла, spongiform или киста без других баллов.",
      };
    case "TR2":
      return {
        fnaRecommended: false,
        fnaRationale: "TR2: FNA не показана (ACR).",
        followUpRecommendation: "УЗИ-наблюдение по ACR не требуется.",
        observationRecommendation: `Узел ${sizeText} — неподозрительный паттерн.`,
      };
    case "TR3":
      if (sizeMm !== undefined && sizeMm >= 25) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR3, ${sizeText} ≥2,5 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "Если FNA не выполнена — УЗИ через 1, 3 и 5 лет.",
          observationRecommendation: GROWTH,
        };
      }
      if (sizeMm !== undefined && sizeMm >= 15) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR3, ${sizeText} 1,5–2,4 см — FNA не показана; наблюдение.`,
          followUpRecommendation: "УЗИ через 1, 3 и 5 лет (ACR, TR3 ≥1,5 см).",
          observationRecommendation: GROWTH,
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR3, ${sizeText} <1,5 см — FNA не показана.`,
        followUpRecommendation: "УЗИ-наблюдение по ACR не требуется (TR3 <1,5 см).",
        observationRecommendation: "Повтор при росте или новых признаках.",
      };
    case "TR4":
      if (sizeMm !== undefined && sizeMm >= 15) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR4, ${sizeText} ≥1,5 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "Если FNA не выполнена — УЗИ через 1, 2, 3 и 5 лет.",
          observationRecommendation: GROWTH,
        };
      }
      if (sizeMm !== undefined && sizeMm >= 10) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR4, ${sizeText} 1,0–1,4 см — наблюдение, FNA не по размеру.`,
          followUpRecommendation: "УЗИ через 1, 2, 3 и 5 лет (ACR, TR4 ≥1,0 см).",
          observationRecommendation: GROWTH,
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR4, ${sizeText} <1,0 см — FNA не показана.`,
        followUpRecommendation: "УЗИ-наблюдение по ACR не требуется (TR4 <1,0 см).",
        observationRecommendation: "FNA, если узел вырастет до порога 1,5 см.",
      };
    case "TR5":
      if (sizeMm !== undefined && sizeMm >= 10) {
        return {
          fnaRecommended: true,
          fnaRationale: `TR5, ${sizeText} ≥1,0 см — FNA по ACR TI-RADS.`,
          followUpRecommendation: "Если FNA не выполнена — УЗИ ежегодно до 5 лет.",
          observationRecommendation: GROWTH,
        };
      }
      if (sizeMm !== undefined && sizeMm >= 5) {
        return {
          fnaRecommended: false,
          fnaRationale: `TR5, ${sizeText} 0,5–0,9 см — наблюдение; FNA не по размеру.`,
          followUpRecommendation: "УЗИ ежегодно до 5 лет (ACR, TR5 ≥0,5 см).",
          observationRecommendation: GROWTH,
        };
      }
      return {
        fnaRecommended: false,
        fnaRationale: `TR5, ${sizeText} <0,5 см — FNA не показана.`,
        followUpRecommendation: "УЗИ-наблюдение по ACR не требуется (TR5 <0,5 см).",
        observationRecommendation: "Повтор при росте или новых признаках.",
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
