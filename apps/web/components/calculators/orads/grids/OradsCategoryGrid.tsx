"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  getOradsCategoryPhotoCards,
  ORADS_ACR_CATEGORY_META,
  ORADS_PHOTO_CARD_DISCLAIMER_RU,
  type OradsAcrCategoryMeta,
  type OradsCategoryPhotoCard,
  type OradsPhotoCategoryId,
} from "@repo/orads-us";

import { OradsGridPickCard } from "@/components/calculators/orads/grids/OradsGridPickCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { chapterToneClasses } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

type Props = {
  onUseInCalculator?: (card: OradsCategoryPhotoCard) => void;
};

const CATEGORIES: OradsPhotoCategoryId[] = [0, 1, 2, 3, 4, 5];

function acrTabSelectedClasses(tone: OradsAcrCategoryMeta["tone"]): string {
  const map: Record<OradsAcrCategoryMeta["tone"], string> = {
    slate: "bg-slate-700 text-white",
    sky: "bg-sky-700 text-white",
    emerald: "bg-emerald-700 text-white",
    amber: "bg-amber-600 text-slate-950",
    orange: "bg-orange-700 text-white",
    red: "bg-red-700 text-white",
  };
  return map[tone];
}

export function OradsCategoryGrid({ onUseInCalculator }: Props) {
  const [tab, setTab] = useState<OradsPhotoCategoryId>(2);
  const [openCard, setOpenCard] = useState<OradsCategoryPhotoCard | null>(null);

  const meta = ORADS_ACR_CATEGORY_META[tab];
  const cards = useMemo(() => getOradsCategoryPhotoCards(tab), [tab]);
  const assessmentCards = cards.filter((card) => card.group === "assessment");
  const classicBenignCards = cards.filter((card) => card.group === "classic-benign");

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:px-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          ACR O-RADS US v2022 · Assessment Categories
        </p>
        <h2 className="mt-1 text-xl font-black text-[var(--clinical-foreground)]">Сетка по категории</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Как в приложении ACR: категория → ROM → дескриптор лексикона. Фото — учебный пример, не пластина атласа ACR.
          Категорию ставит врач, не картинка.
        </p>
      </div>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Категории ACR O-RADS US">
        {CATEGORIES.map((category) => {
          const item = ORADS_ACR_CATEGORY_META[category];
          const selected = tab === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`O-RADS ${category}, ${item.titleRu}, ROM ${item.rom}`}
              onClick={() => setTab(category)}
              className={cn(
                "min-w-[4.5rem] rounded-xl px-2.5 py-1.5 text-left transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
                selected
                  ? acrTabSelectedClasses(item.tone)
                  : "clinical-surface text-[var(--clinical-foreground)]",
              )}
            >
              <span className="block text-xs font-black leading-tight">O-RADS {category}</span>
              <span className={cn("block text-[10px] font-semibold", selected ? "opacity-90" : "text-[var(--clinical-foreground-muted)]")}>
                ROM {item.rom}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn("rounded-2xl border-2 p-4", chapterToneClasses(meta.tone))}>
        <p className="text-xs font-bold uppercase tracking-wide">
          O-RADS {meta.id} · {meta.titleEn}
        </p>
        <h3 className="text-lg font-black text-[var(--clinical-foreground)]">{meta.titleRu}</h3>
        <p className="mt-1 text-sm font-semibold text-[var(--clinical-foreground)]">
          ROM {meta.rom} · {meta.riskRu}
        </p>
        <p className="mt-2 text-xs font-bold text-[var(--clinical-foreground)]">Тактика ACR: {meta.managementRu}</p>
      </div>

      {assessmentCards.length > 0 ? (
        <section aria-labelledby={`orads-acr-${tab}-assessment`}>
          <h3 id={`orads-acr-${tab}-assessment`} className="mb-2 text-sm font-black text-[var(--clinical-foreground)]">
            Дескрипторы Assessment Categories
          </h3>
          <CardGrid cards={assessmentCards} onOpen={setOpenCard} />
        </section>
      ) : null}

      {classicBenignCards.length > 0 ? (
        <section aria-labelledby={`orads-acr-${tab}-classic`}>
          <h3 id={`orads-acr-${tab}-classic`} className="mb-1 text-sm font-black text-[var(--clinical-foreground)]">
            Classic Benign Lesions
          </h3>
          <p className="mb-2 text-xs text-[var(--clinical-foreground-muted)]">
            Типичные доброкачественные: только при полном совпадении с лексиконом ACR. Иначе считать по Assessment
            Categories.
          </p>
          <CardGrid cards={classicBenignCards} onOpen={setOpenCard} badge="Classic Benign" />
        </section>
      ) : null}

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
          Для этой категории пока нет дескриптора ACR.
        </p>
      ) : null}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">{ORADS_PHOTO_CARD_DISCLAIMER_RU}</p>

      <Dialog open={openCard !== null} onOpenChange={(open) => !open && setOpenCard(null)}>
        <DialogContent className="max-w-2xl">
          {openCard ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {openCard.titleRu} · O-RADS {openCard.category}
                </DialogTitle>
                <DialogDescription>
                  {openCard.acrLabelEn}. {openCard.disclaimerRu}
                </DialogDescription>
              </DialogHeader>
              {openCard.imageSrc ? (
                <div className="relative mx-5 aspect-[4/3] overflow-hidden rounded-xl bg-black">
                  <Image
                    src={openCard.imageSrc}
                    alt={openCard.imageAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 640px"
                  />
                </div>
              ) : (
                <p className="mx-5 rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
                  Учебной эхограммы пока нет — ориентир только дескриптор ACR.
                </p>
              )}
              <div className="space-y-3 px-5 pb-5">
                {openCard.sizeNoteRu ? (
                  <p className="text-sm font-semibold text-[var(--clinical-foreground)]">Размер: {openCard.sizeNoteRu}</p>
                ) : null}
                {openCard.keySignsRu.length > 0 ? (
                  <ul className="list-inside list-disc text-sm text-[var(--clinical-foreground)]">
                    {openCard.keySignsRu.map((sign) => (
                      <li key={sign}>{sign}</li>
                    ))}
                  </ul>
                ) : null}
                {openCard.managementRu ? (
                  <p className="text-sm font-bold text-[var(--clinical-foreground)]">Тактика ACR: {openCard.managementRu}</p>
                ) : null}
                {onUseInCalculator && openCard.subtype ? (
                  <Button
                    type="button"
                    onClick={() => {
                      onUseInCalculator(openCard);
                      setOpenCard(null);
                    }}
                  >
                    Похоже — проверить в сетке признаков
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardGrid({
  cards,
  onOpen,
  badge,
}: {
  cards: OradsCategoryPhotoCard[];
  onOpen: (card: OradsCategoryPhotoCard) => void;
  badge?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <OradsGridPickCard
          key={card.id}
          title={card.titleRu}
          hint={card.acrLabelEn}
          imageSrc={card.imageSrc}
          imageAlt={card.imageAlt}
          badge={badge ?? `O-RADS ${card.category}`}
          onClick={() => onOpen(card)}
        />
      ))}
    </div>
  );
}
