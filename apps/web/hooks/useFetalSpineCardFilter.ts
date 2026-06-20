"use client";

import { useMemo, useState } from "react";

import { cardsData, type UltrasoundCard } from "@/lib/education/fetal-spine/cardsData";

export function useFetalSpineCardFilter() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cardsData.filter((card) => {
      if (activeTag && !card.tags.includes(activeTag)) return false;
      if (!q) return true;
      const hay = [
        card.title,
        card.tags.join(" "),
        ...card.sections.flatMap((s) =>
          Array.isArray(s.content) ? [s.title, ...s.content] : [s.title, s.content],
        ),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeTag]);

  return {
    query,
    setQuery,
    activeTag,
    setActiveTag,
    filtered,
    total: cardsData.length,
  };
}

export type { UltrasoundCard };
