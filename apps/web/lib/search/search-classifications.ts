export type ClassificationHit = {
  id: string;
  system: string;
  label: string;
  subtitle: string;
  href: string;
  score: number;
};

const CLASSIFICATIONS: Omit<ClassificationHit, "score">[] = [
  { id: "orads-0", system: "O-RADS", label: "O-RADS 0", subtitle: "Недостаточно данных", href: "/tools/calc/rads/o-rads" },
  { id: "orads-1", system: "O-RADS", label: "O-RADS 1", subtitle: "Норма", href: "/tools/calc/rads/o-rads" },
  { id: "orads-2", system: "O-RADS", label: "O-RADS 2", subtitle: "Почти наверняка доброкач.", href: "/tools/calc/rads/o-rads" },
  { id: "orads-3", system: "O-RADS", label: "O-RADS 3", subtitle: "Низкий риск", href: "/tools/calc/rads/o-rads" },
  { id: "orads-4", system: "O-RADS", label: "O-RADS 4", subtitle: "Умеренный риск", href: "/tools/calc/rads/o-rads" },
  { id: "orads-5", system: "O-RADS", label: "O-RADS 5", subtitle: "Высокий риск", href: "/tools/calc/rads/o-rads" },
  { id: "birads-2", system: "BI-RADS", label: "BI-RADS 2", subtitle: "Доброкачественно", href: "/tools/calc/rads/bi-rads" },
  { id: "birads-3", system: "BI-RADS", label: "BI-RADS 3", subtitle: "Вероятно доброкач.", href: "/tools/calc/rads/bi-rads" },
  { id: "birads-4a", system: "BI-RADS", label: "BI-RADS 4A", subtitle: "Низкая подозрительность", href: "/tools/calc/rads/bi-rads" },
  { id: "tirads-3", system: "TI-RADS", label: "TI-RADS 3", subtitle: "Щитовидная · умеренно подозр.", href: "/tools/adjunct/ti-rads" },
  { id: "tirads-4", system: "TI-RADS", label: "TI-RADS 4", subtitle: "Щитовидная · подозрительно", href: "/tools/adjunct/ti-rads" },
  { id: "iota-benign", system: "IOTA", label: "IOTA Simple Rules · benign", subtitle: "Правила IOTA", href: "/tools/refs/iota-terms-2026" },
  { id: "iota-malignant", system: "IOTA", label: "IOTA Simple Rules · malignant", subtitle: "Правила IOTA", href: "/tools/refs/iota-terms-2026" },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").trim();
}

export function searchClassifications(rawQuery: string, limit = 6): ClassificationHit[] {
  const q = norm(rawQuery);
  const scored = CLASSIFICATIONS.map((item) => {
    const blob = norm(`${item.system} ${item.label} ${item.subtitle}`);
    let score = 0;
    if (!q) score = 2;
    else if (blob.includes(q)) score = 55;
    else if (q.replace(/\s+/g, "").includes(item.system.toLowerCase().replace("-", ""))) score = 30;
    return { ...item, score };
  }).filter((r) => r.score > 0);

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
