"use client";

import { ArrowLeft, Copy, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FetalSpineCardImage } from "@/components/education/fetal-spine/FetalSpineCardImage";
import { FetalSpineCardNavigation } from "@/components/education/fetal-spine/FetalSpineCardNavigation";
import { FetalSpineImageLightbox } from "@/components/education/fetal-spine/FetalSpineImageLightbox";
import { FetalSpineSectionAccordion } from "@/components/education/fetal-spine/FetalSpineSectionAccordion";
import { Badge } from "@/components/ui/badge";
import { getAdjacentCards, getConclusion } from "@/lib/education/fetal-spine/card-utils";
import type { UltrasoundCard } from "@/lib/education/fetal-spine/cardsData";
import { FETAL_SPINE_DISCLAIMER } from "@/lib/education/fetal-spine/constants";
import { isConclusionSection } from "@/lib/education/fetal-spine/section-icons";

type FetalSpineCardDetailClientProps = {
  card: UltrasoundCard;
};

export function FetalSpineCardDetailClient({ card }: FetalSpineCardDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { prev, next } = getAdjacentCards(card.id);
  const conclusion = getConclusion(card);

  const handleCopyConclusion = async () => {
    if (!conclusion) return;
    try {
      await navigator.clipboard.writeText(conclusion);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <Link
        href="/tools/refs/fetal-spine"
        className="mb-5 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-bold text-[var(--clinical-foreground-muted)] transition-colors hover:bg-[var(--clinical-muted)] hover:text-[var(--clinical-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        К галерее
      </Link>

      <div className="overflow-hidden rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--clinical-primary-deep)] via-[var(--clinical-primary)] to-[var(--clinical-primary)]/85 px-5 py-6 text-white sm:px-8">
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
              #{String(card.id).padStart(2, "0")}
            </Badge>
            {card.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-white/25 text-white/90">
                {tag}
              </Badge>
            ))}
          </div>
          <h2 className="relative mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {card.title}
          </h2>
          {conclusion ? (
            <div className="relative mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm leading-relaxed text-white/95">{conclusion}</p>
              <button
                type="button"
                onClick={handleCopyConclusion}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/25"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] lg:divide-x lg:divide-[var(--clinical-border)]">
          <div className="border-b border-[var(--clinical-border)] lg:border-b-0">
            <div className="flex items-center justify-between border-b border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Инфографика
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--clinical-card)] px-3 py-1.5 text-xs font-bold text-[var(--clinical-foreground)] shadow-sm ring-1 ring-[var(--clinical-border)] transition-colors hover:bg-[var(--clinical-primary-muted)]"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                Увеличить
              </button>
            </div>
            <FetalSpineCardImage
              imageId={card.imageId}
              title={card.title}
              variant="full"
              onClick={() => setLightboxOpen(true)}
            />
          </div>

          <div className="p-4 sm:p-6 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--clinical-foreground-muted)]">
              Структурированный протокол
            </h3>
            <FetalSpineSectionAccordion
              items={card.sections.map((section, index) => ({
                title: section.title,
                content: section.content,
                defaultOpen: index === 0 || isConclusionSection(section.title),
              }))}
            />
          </div>
        </div>
      </div>

      <FetalSpineCardNavigation prev={prev} next={next} />

      <p className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {FETAL_SPINE_DISCLAIMER}
      </p>

      <FetalSpineImageLightbox
        imageId={card.imageId}
        title={card.title}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
