import type { UltrasoundCard } from "@/lib/education/fetal-spine/cardsData";
import { cardsData } from "@/lib/education/fetal-spine/cardsData";

export function cardPreview(card: UltrasoundCard): string {
  const findings = card.sections.find((s) =>
    /находк|признак|результат/i.test(s.title),
  );
  const content = findings?.content;
  if (Array.isArray(content)) return content[0] ?? "";
  if (typeof content === "string") return content;
  const first = card.sections[0]?.content;
  return Array.isArray(first) ? (first[0] ?? "") : (first ?? "");
}

export function getConclusion(card: UltrasoundCard): string | undefined {
  const section = card.sections.find((s) => /заключение/i.test(s.title));
  if (!section) return undefined;
  return Array.isArray(section.content) ? section.content.join(" ") : section.content;
}

export function getAdjacentCards(id: number): { prev?: UltrasoundCard; next?: UltrasoundCard } {
  const index = cardsData.findIndex((c) => c.id === id);
  if (index < 0) return {};
  return {
    prev: index > 0 ? cardsData[index - 1] : undefined,
    next: index < cardsData.length - 1 ? cardsData[index + 1] : undefined,
  };
}

export const TAG_STYLES: Record<
  string,
  { badge: "default" | "secondary" | "outline" | "success" | "warning"; ring: string }
> = {
  Обзор: { badge: "warning", ring: "ring-amber-200/80" },
  Норма: { badge: "success", ring: "ring-emerald-200/80" },
  Аномалии: { badge: "default", ring: "ring-[var(--clinical-primary)]/20" },
  Патология: { badge: "default", ring: "ring-[var(--clinical-primary)]/20" },
  Опухоль: { badge: "warning", ring: "ring-orange-200/80" },
  Скрининг: { badge: "success", ring: "ring-cyan-200/80" },
  Маркеры: { badge: "secondary", ring: "ring-[var(--clinical-border)]" },
};

export function primaryTag(card: UltrasoundCard): string {
  return card.tags.find((t) => t !== "Скрининг") ?? card.tags[0] ?? "Обзор";
}
