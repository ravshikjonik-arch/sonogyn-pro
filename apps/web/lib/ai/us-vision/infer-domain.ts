export type UsStudyDomain = "auto" | "fetal" | "breast" | "gyn" | "kidney";

const RULES: { domain: UsStudyDomain; keywords: string[] }[] = [
  { domain: "breast", keywords: ["молоч", "breast", "birads", "bi-rads", "маст", "фibroadenom"] },
  { domain: "gyn", keywords: ["яичник", "матк", "эндометр", "orads", "o-rads", "гинек", "мтп"] },
  { domain: "kidney", keywords: ["почк", "kidney", "члс", "нефр", "урол"] },
  { domain: "fetal", keywords: ["плод", "беремен", "fetal", "скрининг", "триместр", "плацент"] },
];

/** Согласовано с sonogyn_agents/orchestrator.detect_domain */
export function inferUsStudyDomain(clinicalContext: string): UsStudyDomain {
  const text = clinicalContext.toLowerCase();
  let best: UsStudyDomain = "auto";
  let bestScore = 0;
  for (const rule of RULES) {
    const score = rule.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = rule.domain;
    }
  }
  return bestScore > 0 ? best : "auto";
}

export const US_DOMAIN_LABELS: Record<UsStudyDomain, string> = {
  auto: "Авто",
  fetal: "Плод",
  breast: "МЖ · BI-RADS",
  gyn: "Гин · O-RADS",
  kidney: "Почки",
};
