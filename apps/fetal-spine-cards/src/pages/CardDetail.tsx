import { ArrowLeft, Copy, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { CardImage } from "@/components/CardImage";
import { CardNavigation } from "@/components/CardNavigation";
import { ImageLightbox } from "@/components/ImageLightbox";
import { SectionContent } from "@/components/SectionContent";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { getCardById } from "@/data/cardsData";
import { getAdjacentCards, getConclusion } from "@/lib/card-utils";
import { isConclusionSection } from "@/lib/section-icons";

export function CardDetail() {
  const { id } = useParams();
  const cardId = Number(id);
  const card = Number.isFinite(cardId) ? getCardById(cardId) : undefined;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!card) {
    return <Navigate to="/" replace />;
  }

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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-bold text-medical-muted transition-colors hover:bg-white hover:text-medical-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          К галерее
        </Link>

        <div className="overflow-hidden rounded-3xl border border-medical-border bg-white shadow-xl">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-medical-navy-deep via-medical-navy to-medical-navy-light px-5 py-6 text-white sm:px-8">
            <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-medical-teal/15 blur-2xl" aria-hidden />
            <div className="relative flex flex-wrap items-center gap-2">
              <Badge variant="teal">#{String(card.id).padStart(2, "0")}</Badge>
              {card.tags.map((tag) => (
                <Badge key={tag} variant="ghost">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="relative mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{card.title}</h1>
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

          <div className="grid lg:grid-cols-[1fr_1fr] lg:divide-x lg:divide-medical-border">
            {/* Image panel */}
            <div className="border-b border-medical-border lg:border-b-0">
              <div className="flex items-center justify-between border-b border-medical-border bg-slate-50 px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-medical-muted">Инфографика</p>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-medical-navy shadow-sm ring-1 ring-medical-border transition-colors hover:bg-medical-teal-soft"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  Увеличить
                </button>
              </div>
              <CardImage
                imageId={card.imageId}
                title={card.title}
                variant="full"
                onClick={() => setLightboxOpen(true)}
              />
            </div>

            {/* Text panel */}
            <div className="p-4 sm:p-6 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-medical-muted">
                Структурированный протокол
              </h2>
              <Accordion
                items={card.sections.map((section, index) => ({
                  title: section.title,
                  defaultOpen: index === 0 || isConclusionSection(section.title),
                  content: <SectionContent content={section.content} />,
                }))}
              />
            </div>
          </div>
        </div>

        <CardNavigation prev={prev} next={next} />

        <p className="mt-8 rounded-2xl border border-amber-200/80 bg-medical-accent-soft px-4 py-3 text-center text-xs leading-relaxed text-amber-950">
          Образовательный материал · не является медицинским диагнозом · интерпретация — специалистом
        </p>
      </div>

      <ImageLightbox
        imageId={card.imageId}
        title={card.title}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
