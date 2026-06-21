import type { LymphNodeAssessment } from "./types";

export const LYMPH_NODE_FEATURES = {
  benign: ["Hilum present", "Oval shape", "Normal vascularity"],
  suspicious: [
    "Microcalcifications",
    "Cystic change",
    "Peripheral vascularity",
    "Rounded shape",
    "Loss of fatty hilum",
  ],
};

export function lymphNodeNote(assessment?: LymphNodeAssessment): string | undefined {
  switch (assessment) {
    case "benign":
      return "Регионарные ЛУ: доброкачественные признаки (hilum, овальная форма).";
    case "indeterminate":
      return "Регионарные ЛУ: неопределённые — корреляция с узлом и клиникой.";
    case "suspicious":
      return "Регионарные ЛУ: подозрительные (округление, микрокальцинаты, потеря hilum) — FNA ЛУ/узла.";
    default:
      return undefined;
  }
}

export function classifyLymphNodesFromKeywords(text: string): LymphNodeAssessment {
  if (/подозрит|suspicious|микрокальц|округл|потер.*hilum|ворот/i.test(text)) return "suspicious";
  if (/неопредел|indeterminate/i.test(text)) return "indeterminate";
  if (/доброкач|benign|hilum|ворот/i.test(text)) return "benign";
  return "not_assessed";
}
