"use client";

import { ChevronDown, ExternalLink, Search, X, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIotaTerms2026Filter } from "@/hooks/useIotaTerms2026Filter";
import {
  IOTA_TERMS_2026_IMAGE,
  IOTA_TERMS_2026_LINKS,
  IOTA_TERMS_2026_META,
} from "@/lib/education/iota-terms-2026/constants";
import { IOTA_TERMS_2026_TAG_FILTERS } from "@/lib/education/iota-terms-2026/terms-data";
import type { IotaTermSection } from "@/lib/education/iota-terms-2026/terms-data";
import { cn } from "@/lib/utils/cn";

export function IotaTerms2026Widget() {
  const { query, setQuery, activeTag, setActiveTag, filtered, total } = useIotaTerms2026Filter();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-lg">
        <div className="border-b border-[var(--clinical-border)] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-5 py-4 text-white sm:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">Консенсусное заявление</p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{IOTA_TERMS_2026_META.title}</h2>
          <p className="mt-2 text-sm text-orange-50/90">{IOTA_TERMS_2026_META.group}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur-sm">
              {IOTA_TERMS_2026_META.published}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur-sm">
              DOI {IOTA_TERMS_2026_META.doi}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              {IOTA_TERMS_2026_META.figureCaption}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setLightboxOpen(true)}>
              <ZoomIn className="mr-1.5 h-4 w-4" />
              Увеличить
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IOTA_TERMS_2026_IMAGE}
              alt={IOTA_TERMS_2026_META.title}
              className="mx-auto max-h-[720px] w-full object-contain transition-opacity group-hover:opacity-95"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/5 group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white">
                <ZoomIn className="h-4 w-4" />
                Открыть на весь экран
              </span>
            </span>
          </button>
          <p className="mt-3 text-center text-xs text-[var(--clinical-foreground-muted)]">
            Рис. 22 · sonogyn-pro · offline
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default" size="sm">
            <Link href={IOTA_TERMS_2026_LINKS.oradsCalculator.href}>{IOTA_TERMS_2026_LINKS.oradsCalculator.label}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={IOTA_TERMS_2026_LINKS.oradsGuide.href}>{IOTA_TERMS_2026_LINKS.oradsGuide.label}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={IOTA_TERMS_2026_META.sourceUrl} target="_blank" rel="noopener noreferrer">
              Wiley · полный текст
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: солидный компонент, папилляр, цветовой балл…"
            className="w-full rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--clinical-primary)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]"
              aria-label="Очистить"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap gap-2">
          {IOTA_TERMS_2026_TAG_FILTERS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag === "Все" ? null : activeTag === tag ? null : tag)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-all",
                (tag === "Все" && !activeTag) || activeTag === tag
                  ? "bg-[var(--clinical-primary)] text-white shadow"
                  : "border border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground-muted)] hover:border-[var(--clinical-primary)]/40",
              )}
            >
              {tag}
              {tag === "Все" ? ` · ${total}` : ""}
            </button>
          ))}
        </div>

        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Разделов: <span className="font-bold text-[var(--clinical-foreground)]">{filtered.length}</span> из {total}
        </p>
      </section>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--clinical-border)] p-10 text-center">
            <p className="font-bold">Ничего не найдено</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveTag(null);
              }}
              className="mt-4 text-sm font-bold text-[var(--clinical-primary)] underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          filtered.map((section, i) => (
            <TermAccordion key={section.id} section={section} defaultOpen={i === 0 || !!section.highlight} />
          ))
        )}
      </div>

      <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {IOTA_TERMS_2026_META.disclaimer}
      </p>

      <IotaInfographicLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
}

function TermAccordion({ section, defaultOpen }: { section: IotaTermSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        section.highlight
          ? "border-orange-300/60 bg-orange-50/40 dark:border-orange-800/40 dark:bg-orange-950/20"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--clinical-muted)]/40 sm:px-5"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--clinical-foreground)]">{section.title}</span>
            {section.highlight ? <Badge variant="warning">ключевой</Badge> : null}
          </div>
          {section.subtitle ? (
            <p className="mt-0.5 text-xs font-semibold text-[var(--clinical-primary)]">{section.subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-[var(--clinical-primary)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-[var(--clinical-border)] px-4 py-4 sm:px-5">
          <ul className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            {section.bullets.map((item) => (
              <li key={item.slice(0, 48)} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clinical-primary)]" aria-hidden />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          {section.notes?.length ? (
            <div className="mt-4 space-y-1 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-2.5 text-xs text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
              {section.notes.map((note) => (
                <p key={note.slice(0, 40)}>{note}</p>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {section.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IotaInfographicLightbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={IOTA_TERMS_2026_META.title}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="max-h-[95dvh] max-w-6xl overflow-auto rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IOTA_TERMS_2026_IMAGE} alt={IOTA_TERMS_2026_META.title} className="h-auto w-full object-contain" />
      </div>
    </div>
  );
}
