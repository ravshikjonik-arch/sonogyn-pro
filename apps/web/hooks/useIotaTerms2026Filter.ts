"use client";

import { useMemo, useState } from "react";

import { IOTA_TERMS_2026_SECTIONS, type IotaTermSection } from "@/lib/education/iota-terms-2026/terms-data";

export function useIotaTerms2026Filter() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IOTA_TERMS_2026_SECTIONS.filter((section) => {
      if (activeTag && activeTag !== "Все") {
        const tagMatch =
          section.tags.some((t) => t.toLowerCase().includes(activeTag.toLowerCase())) ||
          section.title.toLowerCase().includes(activeTag.toLowerCase());
        if (!tagMatch) return false;
      }
      if (!q) return true;
      const hay = [
        section.title,
        section.subtitle ?? "",
        ...section.tags,
        ...section.bullets,
        ...(section.notes ?? []),
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
    total: IOTA_TERMS_2026_SECTIONS.length,
  };
}

export type { IotaTermSection };
