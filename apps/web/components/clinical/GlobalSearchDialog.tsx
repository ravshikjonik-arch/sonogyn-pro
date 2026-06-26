"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchCaseSearchHits,
  fetchConfirmedCaseHits,
  searchGlobalLocal,
  type CaseSearchHit,
  type GlobalSearchResult,
} from "@/lib/search/global-search";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
        {title}
      </p>
      {children}
    </section>
  );
}

function HitLink({
  href,
  title,
  subtitle,
  badge,
  onPick,
}: {
  href: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPick: () => void;
}) {
  return (
    <Link
      href={href}
      className="block border-b border-[var(--clinical-border)] px-4 py-3 transition last:border-0 hover:bg-[var(--clinical-muted)]"
      onClick={onPick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[var(--clinical-foreground)]">{title}</p>
        {badge ? (
          <span className="shrink-0 rounded-full bg-[var(--clinical-primary-muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--clinical-primary-deep)]">
            {badge}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--clinical-foreground-muted)]">{subtitle}</p>
      ) : null}
    </Link>
  );
}

export function GlobalSearchDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseSearchHit[]>([]);
  const [confirmedCases, setConfirmedCases] = useState<CaseSearchHit[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  const local = useMemo(() => searchGlobalLocal(query), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCases([]);
      setConfirmedCases([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim()) return;

    let cancelled = false;
    void fetchConfirmedCaseHits(4).then((hits) => {
      if (!cancelled) setConfirmedCases(hits);
    });

    return () => {
      cancelled = true;
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setCases([]);
      return;
    }

    let cancelled = false;
    setCasesLoading(true);
    const timer = window.setTimeout(() => {
      void fetchCaseSearchHits(q, 6).then((hits) => {
        if (!cancelled) {
          setCases(hits);
          setCasesLoading(false);
        }
      });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const onPick = useCallback(() => {
    onOpenChange(false);
    setQuery("");
  }, [onOpenChange]);

  const hasResults =
    local.tools.length > 0 ||
    local.ai.length > 0 ||
    local.classifications.length > 0 ||
    cases.length > 0 ||
    confirmedCases.length > 0;

  const emptyDefault: GlobalSearchResult = useMemo(
    () => ({
      ...searchGlobalLocal(""),
      cases: [],
    }),
    [],
  );

  const showDefault = !query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--clinical-border)] px-4 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Поиск
          </DialogTitle>
          <DialogDescription>
            Инструменты · кейсы · AI · классификации (P0.5 MVP)
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <Input
            autoFocus
            placeholder="O-RADS, срок, чат, TI-RADS…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto border-t border-[var(--clinical-border)]">
          {showDefault ? (
            <ResultSection title="Быстрый старт">
              <HitLink
                href="/cases?tab=cases&lifecycle=confirmed"
                title="Подтверждённые кейсы"
                subtitle="Expert-reviewed teaching cases"
                badge="CONFIRMED"
                onPick={onPick}
              />
              <HitLink
                href="/cases/new"
                title="Новый кейс УЗИ"
                subtitle="Wizard с анонимизацией (R6)"
                onPick={onPick}
              />
            </ResultSection>
          ) : null}

          {showDefault && confirmedCases.length > 0 ? (
            <ResultSection title="Подтверждённые">
              {confirmedCases.map((c) => (
                <HitLink
                  key={c.id}
                  href={c.href}
                  title={c.title}
                  subtitle={c.subtitle}
                  badge={c.lifecycle}
                  onPick={onPick}
                />
              ))}
            </ResultSection>
          ) : null}

          {!hasResults && !showDefault && !casesLoading ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--clinical-foreground-muted)]">
              Ничего не найдено
            </p>
          ) : null}

          {(showDefault ? emptyDefault.tools : local.tools).length > 0 ? (
            <ResultSection title="Инструменты">
              {(showDefault ? emptyDefault.tools : local.tools).map((t) => (
                <HitLink
                  key={t.id}
                  href={t.href}
                  title={t.title}
                  subtitle={t.description}
                  onPick={onPick}
                />
              ))}
            </ResultSection>
          ) : null}

          {(showDefault ? emptyDefault.ai : local.ai).length > 0 ? (
            <ResultSection title="AI">
              {(showDefault ? emptyDefault.ai : local.ai).map((t) => (
                <HitLink key={t.id} href={t.href} title={t.title} subtitle={t.subtitle} onPick={onPick} />
              ))}
            </ResultSection>
          ) : null}

          {cases.length > 0 || casesLoading ? (
            <ResultSection title="Кейсы">
              {casesLoading && cases.length === 0 ? (
                <p className="px-4 py-3 text-xs text-[var(--clinical-foreground-muted)]">Поиск кейсов…</p>
              ) : null}
              {cases.map((c) => (
                <HitLink
                  key={c.id}
                  href={c.href}
                  title={c.title}
                  subtitle={c.subtitle}
                  badge={c.lifecycle ?? undefined}
                  onPick={onPick}
                />
              ))}
            </ResultSection>
          ) : null}

          {(showDefault ? emptyDefault.classifications : local.classifications).length > 0 ? (
            <ResultSection title="Классификации">
              {(showDefault ? emptyDefault.classifications : local.classifications).map((t) => (
                <HitLink
                  key={t.id}
                  href={t.href}
                  title={t.label}
                  subtitle={`${t.system} · ${t.subtitle}`}
                  onPick={onPick}
                />
              ))}
            </ResultSection>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GlobalSearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        data-testid="global-search-trigger"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden xs:inline">Поиск</span>
        <kbd className="ml-2 hidden rounded border px-1.5 text-[10px] opacity-60 sm:inline">⌘K</kbd>
      </Button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
