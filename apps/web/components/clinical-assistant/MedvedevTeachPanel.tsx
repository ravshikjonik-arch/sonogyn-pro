"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  getTeachForMarker,
  getSliceTeach,
  SCREENING_WINDOWS_TEACH,
  type MedvedevTeachCard,
} from "@repo/medvedev-reference";

export function MedvedevTeachCardView({
  card,
  compact,
  week,
}: {
  card: MedvedevTeachCard;
  compact?: boolean;
  week?: number;
}) {
  const normsHref =
    week != null && card.referenceTopicId
      ? `/reference/norms?week=${week}&q=${encodeURIComponent(card.title.split(" ")[0].toLowerCase())}`
      : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20",
        compact ? "text-xs" : "text-sm",
      )}
    >
      <p className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100">
        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
        {card.title}
        {card.appendix ? (
          <span className="font-normal text-[var(--clinical-foreground-muted)]">· {card.appendix}</span>
        ) : null}
      </p>
      <p className="mt-2 leading-relaxed text-[var(--clinical-foreground-muted)]">
        <span className="font-semibold text-[var(--clinical-foreground)]">Как мерить: </span>
        {card.howToMeasure}
      </p>
      {!compact ? (
        <p className="mt-1.5 leading-relaxed text-[var(--clinical-foreground-muted)]">
          <span className="font-semibold text-[var(--clinical-foreground)]">Клиника: </span>
          {card.clinicalMeaning}
        </p>
      ) : null}
      {card.redFlags?.length ? (
        <ul className="mt-2 list-disc pl-4 text-amber-900 dark:text-amber-200">
          {card.redFlags.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {card.referenceTopicId ? (
          <Link
            href={`/reference?topic=${card.referenceTopicId}`}
            className="text-[10px] font-semibold text-[var(--clinical-primary)] underline"
          >
            Методика →
          </Link>
        ) : null}
        {normsHref ? (
          <Link href={normsHref} className="text-[10px] font-semibold text-[var(--clinical-primary)] underline">
            Таблица норм →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function MedvedevSliceTeachPanel({
  sliceId,
  slice,
  structures,
  appendix,
}: {
  sliceId: string;
  slice: string;
  structures: string[];
  appendix: string;
}) {
  const teach = getSliceTeach(sliceId);
  if (!teach) return null;

  return (
    <div className="mt-2 rounded-lg border border-dashed border-amber-300/60 bg-amber-50/30 p-2 text-xs dark:border-amber-800 dark:bg-amber-950/10">
      <p className="font-semibold text-amber-950 dark:text-amber-100">Учебная подсказка</p>
      <p className="mt-1 text-[var(--clinical-foreground-muted)]">
        <span className="font-medium text-[var(--clinical-foreground)]">Срез: </span>
        {slice} (Прил. {appendix})
      </p>
      <p className="mt-1">{teach.teachHow}</p>
      <p className="mt-1 italic text-[var(--clinical-foreground-muted)]">{teach.teachWhy}</p>
      {teach.pitfalls ? (
        <p className="mt-1 text-amber-800 dark:text-amber-200">⚠ {teach.pitfalls}</p>
      ) : null}
      <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">{structures.join(" · ")}</p>
    </div>
  );
}

export function MedvedevScreeningWindowsTeach() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {SCREENING_WINDOWS_TEACH.map((w) => (
        <div
          key={w.id}
          className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-xs"
        >
          <p className="font-bold">{w.role}</p>
          <p className="text-[var(--clinical-primary)]">{w.window}</p>
          <p className="mt-1 leading-relaxed text-[var(--clinical-foreground-muted)]">{w.teach}</p>
        </div>
      ))}
    </div>
  );
}

export function MedvedevMarkerTeachInline({ marker, week }: { marker: string; week?: number }) {
  const card = getTeachForMarker(marker);
  if (!card) return null;
  return <MedvedevTeachCardView card={card} compact week={week} />;
}
