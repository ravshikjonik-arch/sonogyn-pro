"use client";

import { buildOutboundSourceLinks, listWhatsNewFeed } from "@repo/evidence-retrieval";
import { BookOpen, ExternalLink, FlaskConical, Link2, Newspaper, Pill, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { EvidenceAssistantWorkspace } from "@/components/evidence/EvidenceAssistantWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type EvidenceSourcesTab = "kr" | "ask" | "drugs" | "news" | "outbound";

const TABS: { id: EvidenceSourcesTab; label: string; icon: typeof Search }[] = [
  { id: "kr", label: "КР РФ", icon: BookOpen },
  { id: "ask", label: "Спросить", icon: Search },
  { id: "drugs", label: "Препараты", icon: Pill },
  { id: "news", label: "Новое", icon: Newspaper },
  { id: "outbound", label: "Ссылки вовне", icon: Link2 },
];

type DrugHit = {
  id: string;
  provider: string;
  title: string;
  abstract?: string;
  url: string;
  quote?: string;
};

function parseTab(raw: string | null): EvidenceSourcesTab {
  if (raw === "kr" || raw === "ask" || raw === "drugs" || raw === "news" || raw === "outbound") return raw;
  return "ask";
}

export function EvidenceSourcesHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [drugQuery, setDrugQuery] = useState("");
  const [drugLoading, setDrugLoading] = useState(false);
  const [drugHits, setDrugHits] = useState<DrugHit[]>([]);
  const [drugError, setDrugError] = useState("");

  const [outboundDoi, setOutboundDoi] = useState("");
  const [outboundTitle, setOutboundTitle] = useState("");

  const news = useMemo(() => listWhatsNewFeed(), []);
  const outboundLinks = useMemo(
    () => buildOutboundSourceLinks({ doi: outboundDoi || undefined, title: outboundTitle || undefined }),
    [outboundDoi, outboundTitle],
  );

  function setTab(next: EvidenceSourcesTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/tools/refs/evidence-sources?${params.toString()}`, { scroll: false });
  }

  async function onDrugSearch(e: FormEvent) {
    e.preventDefault();
    const q = drugQuery.trim();
    if (q.length < 2) {
      setDrugError("Введите МНН или название (≥2 символа).");
      return;
    }
    setDrugLoading(true);
    setDrugError("");
    try {
      const res = await fetch(
        `/api/evidence/search?q=${encodeURIComponent(q)}&limit=12&providers=grls,openfda,dailymed,roszdravnadzor`,
        { credentials: "same-origin" },
      );
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        records?: DrugHit[];
      } | null;
      if (!res.ok) {
        setDrugError(
          res.status === 401
            ? "Нужен вход в кабинет для этого запроса. Обновите страницу или войдите."
            : payload?.error || "Не удалось найти препараты.",
        );
        setDrugHits([]);
        return;
      }
      setDrugHits(payload?.records ?? []);
    } catch {
      setDrugError("Сеть недоступна. Попробуйте снова.");
      setDrugHits([]);
    } finally {
      setDrugLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          Доказательства и источники
        </p>
        <h1 className="text-2xl font-bold text-[var(--clinical-foreground)] md:text-3xl">
          Один слой над PubMed, КР и реестрами
        </h1>
        <p className="max-w-3xl text-sm text-[var(--clinical-foreground-muted)]">
          Карточка со ссылками за секунды. Полные платные тексты не храним — только метаданные и переход к
          первоисточнику. При расхождении РФ и международных гайдлайнов показываем оба.
        </p>
      </header>

      <div
        className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-1 sm:grid-cols-5"
        role="tablist"
        aria-label="Разделы доказательств"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)] sm:text-sm",
                selected
                  ? "bg-[var(--clinical-card)] text-[var(--clinical-primary-deep)] shadow-sm"
                  : "text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-foreground)]",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "ask" ? <EvidenceAssistantWorkspace /> : null}

      {tab === "kr" ? (
        <Card>
          <CardHeader>
            <CardTitle>Клинические рекомендации РФ</CardTitle>
            <CardDescription>
              Карточки КР МЗ РФ / НПА в кабинете и официальный рубрикатор. Тексты целиком не копируем.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-auto justify-start py-4">
              <Link href="/tools/refs/guidelines">
                <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                Каталог КР в SonoGyn
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-4">
              <a href="https://cr.minzdrav.gov.ru/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                Рубрикатор Минздрава
              </a>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-4">
              <Link href="/tools/refs/sources">Официальные гайдлайны (ACR · ISUOG · FIGO)</Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-4">
              <Link href="/tools/refs/evidence">SonoEvidence · курируемый корпус</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "drugs" ? (
        <Card>
          <CardHeader>
            <CardTitle>Препараты · ГРЛС и безопасность</CardTitle>
            <CardDescription>
              ГРЛС — основной реестр РФ (метаданные + ссылка). OpenFDA/DailyMed помечены как не РФ. Росздравнадзор —
              уведомления о качестве.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => void onDrugSearch(e)}>
              <Input
                value={drugQuery}
                onChange={(e) => setDrugQuery(e.target.value)}
                placeholder="МНН или торговое название (напр. аспирин, метформин)"
                aria-label="Поиск препарата"
              />
              <Button type="submit" disabled={drugLoading}>
                {drugLoading ? "Ищем…" : "Найти"}
              </Button>
            </form>
            {drugError ? (
              <p className="text-sm text-[var(--clinical-danger)]" role="alert">
                {drugError}
              </p>
            ) : null}
            <ul className="space-y-3">
              {drugHits.map((hit) => (
                <li
                  key={hit.id}
                  className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{hit.provider}</Badge>
                    {hit.provider === "openfda" || hit.provider === "dailymed" ? (
                      <Badge variant="outline">не РФ</Badge>
                    ) : null}
                  </div>
                  <a
                    href={hit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--clinical-primary-deep)] hover:underline"
                  >
                    {hit.title}
                  </a>
                  {hit.abstract ? (
                    <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{hit.abstract}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {tab === "news" ? (
        <Card>
          <CardHeader>
            <CardTitle>Новое</CardTitle>
            <CardDescription>Что проверить сегодня: КР, исследования, безопасность ЛС.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[var(--clinical-border)] p-3 transition-colors hover:bg-[var(--clinical-muted)]"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <span className="text-xs text-[var(--clinical-foreground-muted)]">{item.updatedAt}</span>
                </div>
                <p className="font-semibold text-[var(--clinical-foreground)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">{item.summary}</p>
              </a>
            ))}
            <Button asChild variant="outline">
              <Link href="/api/evidence/whats-new">JSON ленты</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "outbound" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ссылки вовне</CardTitle>
            <CardDescription>
              Scopus, Web of Science, eLIBRARY, Cochrane, Trip — только переход по DOI или названию, без хранения
              полных текстов.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">DOI</span>
                <Input
                  value={outboundDoi}
                  onChange={(e) => setOutboundDoi(e.target.value)}
                  placeholder="10.1000/xyz"
                  aria-label="DOI"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--clinical-foreground-muted)]">Название</span>
                <Input
                  value={outboundTitle}
                  onChange={(e) => setOutboundTitle(e.target.value)}
                  placeholder="O-RADS ultrasound management"
                  aria-label="Название статьи"
                />
              </label>
            </div>
            {outboundLinks.length === 0 ? (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">
                Укажите DOI и/или название — появятся ссылки на базы.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {outboundLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 rounded-xl border border-[var(--clinical-border)] p-3 hover:bg-[var(--clinical-muted)]"
                    >
                      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-primary)]" aria-hidden />
                      <span>
                        <span className="block font-semibold text-[var(--clinical-foreground)]">{link.label}</span>
                        {link.note ? (
                          <span className="text-xs text-[var(--clinical-foreground-muted)]">{link.note}</span>
                        ) : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
