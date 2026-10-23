import { getScoringSystem } from "./dataset";

export type TrisomyScoreInput = {
  scoringSystemId?: string;
  selectedSigns: string[];
};

export type TrisomyScoreResult = {
  ok: boolean;
  title: string;
  source?: string;
  totalScore: number;
  threshold: number;
  recommendKaryotyping: boolean;
  summary: string;
  items: Array<{ sign: string; score: number; selected: boolean }>;
};

export function evaluateTrisomyScore(input: TrisomyScoreInput): TrisomyScoreResult {
  const system = getScoringSystem(input.scoringSystemId ?? "trisomy_score_18_24");
  if (!system) {
    return {
      ok: false,
      title: "Балльная система",
      totalScore: 0,
      threshold: 2,
      recommendKaryotyping: false,
      summary: "Система баллов не найдена в датасете",
      items: [],
    };
  }

  const threshold = system.threshold?.min_score_for_karyotyping ?? 2;
  const selected = new Set(input.selectedSigns);
  const items = system.items.map((item) => ({
    sign: item.sign,
    score: item.score,
    selected: selected.has(item.sign),
  }));
  const totalScore = items.filter((i) => i.selected).reduce((s, i) => s + i.score, 0);
  const recommendKaryotyping = totalScore >= threshold;

  const summary = recommendKaryotyping
    ? `Сумма ${totalScore} балл(ов) ≥ ${threshold} — по таблице показано обсуждение пренатального кариотипирования`
    : `Сумма ${totalScore} балл(ов) < ${threshold} — по таблице кариотипирование не формулируется как показание`;

  return {
    ok: true,
    title: system.title,
    source: system.source,
    totalScore,
    threshold,
    recommendKaryotyping,
    summary,
    items,
  };
}
