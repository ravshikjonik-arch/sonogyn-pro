import type { ColposcopyFindingKey, SwedeRiskLevel, SwedeScoreInput, SwedeScoreResult } from "./types";

export function calculateSwedeScore(input: SwedeScoreInput): SwedeScoreResult {
  const total =
    input.acetowhite + input.margins + input.vessels + input.lesionSize + input.iodine;
  const risk = interpretSwedeTotal(total);
  return {
    total,
    breakdown: { ...input },
    ...risk,
  };
}

export function interpretSwedeTotal(total: number): {
  riskLevel: SwedeRiskLevel;
  riskLabel: string;
  recommendation: string;
  cinRiskHint: string;
} {
  if (total <= 4) {
    return {
      riskLevel: "low",
      riskLabel: "Низкий риск (CIN 1–)",
      recommendation:
        "Наблюдение. Повторная кольпоскопия и/или цитология по маршруту скрининга через 6–12 месяцев.",
      cinRiskHint: "Вероятность CIN 2+ низкая при типичной картине.",
    };
  }
  if (total <= 7) {
    return {
      riskLevel: "moderate",
      riskLabel: "Умеренный риск (подозрение на CIN 2+)",
      recommendation:
        "Рекомендована прицельная биопсия под контролем кольпоскопии с гистологическим исследованием.",
      cinRiskHint: "Порог для биопсии по Swede Score достигнут.",
    };
  }
  return {
    riskLevel: "high",
    riskLabel: "Высокий риск CIN 2+",
    recommendation:
      "Обязательная биопсия + гистология. Тактика по результату: возможна эксцизия / конизация по показаниям.",
    cinRiskHint: "Высокая вероятность значимой невроплазии шейки матки.",
  };
}

export function swedeRiskEmoji(level: SwedeRiskLevel): string {
  if (level === "low") return "🟢";
  if (level === "moderate") return "🟡";
  return "🔴";
}

export function swedeScoreOneLiner(result: SwedeScoreResult): string {
  return `Swede Score ${result.total}/10 — ${result.riskLabel}. ${result.recommendation}`;
}

/** Синхронизация бланка протокола → Swede (если врач заполнил бланк, не трогая чипы Swede). */
export function mapProtocolToSwedeHints(protocol: {
  acetowhiteEpithelium: "none" | "delicate" | "dense";
  marginQuality: "sharp" | "blurred";
  iodineZone: "positive" | "partial" | "negative";
  findings: ColposcopyFindingKey[];
}): Partial<SwedeScoreInput> {
  const hints: Partial<SwedeScoreInput> = {};
  if (protocol.acetowhiteEpithelium === "none") hints.acetowhite = 0;
  else if (protocol.acetowhiteEpithelium === "delicate") hints.acetowhite = 1;
  else hints.acetowhite = 2;

  hints.margins = protocol.marginQuality === "blurred" ? 0 : 1;

  if (protocol.findings.includes("atypical_vessels")) hints.vessels = 2;
  else if (protocol.findings.includes("mosaicism") || protocol.findings.includes("punctuation"))
    hints.vessels = 2;

  if (protocol.iodineZone === "positive") hints.iodine = 0;
  else if (protocol.iodineZone === "partial") hints.iodine = 1;
  else hints.iodine = 2;

  return hints;
}
