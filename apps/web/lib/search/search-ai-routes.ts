export type AiRouteHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

const AI_ROUTES: Omit<AiRouteHit, "score">[] = [
  {
    id: "ai.ask",
    title: "Спросить Sonogyn Copilot",
    subtitle: "Клинический вопрос с цитатами и дисклеймером",
    href: "/ai/ask",
  },
  {
    id: "ai.consultants",
    title: "Помощник врача",
    subtitle: "Нозология → УЗИ → протокол",
    href: "/ai/consultants",
  },
  {
    id: "ai.fmf",
    title: "FMF · скрининги",
    subtitle: "I–III скрининг, допплер, шейка",
    href: "/ai/consultants/fmf",
  },
  {
    id: "ai.workspace",
    title: "AI-рабочая зона",
    subtitle: "Загрузка снимков, orchestrator",
    href: "/ai/workspace",
  },
  {
    id: "ai.orads-assist",
    title: "O-RADS из текста протокола",
    subtitle: "Assist pipeline · rule-first",
    href: "/calculators/o-rads",
  },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").trim();
}

export function searchAiRoutes(rawQuery: string, limit = 6): AiRouteHit[] {
  const q = norm(rawQuery);
  const scored = AI_ROUTES.map((route) => {
    const blob = norm(`${route.title} ${route.subtitle}`);
    let score = 0;
    if (!q) score = 5;
    else if (blob.includes(q)) score = 50;
    else if (q.split(" ").every((p) => blob.includes(p))) score = 40;
    return { ...route, score };
  }).filter((r) => r.score > 0);

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
